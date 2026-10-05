"use client";

/** ブロックリスト（Web）— `users/{uid}/blocks/{targetUid}`（Firestore rules と一致） */
import { useSyncExternalStore } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import {
  BLOCKS_SUBCOLLECTION,
  type ModerationReportReason,
  type ModerationTargetType,
} from "@/lib/moderation/moderationTypes";

const EMPTY: ReadonlySet<string> = new Set();

let blocked: ReadonlySet<string> = EMPTY;
let ownerUid: string | null = null;
let unsubBlocks: Unsubscribe | null = null;
let unsubAuth: Unsubscribe | null = null;
const listeners = new Set<() => void>();

function emit(next: ReadonlySet<string>) {
  blocked = next;
  for (const l of listeners) l();
}

function watchOwner(uid: string | null) {
  if (uid === ownerUid) return;
  unsubBlocks?.();
  unsubBlocks = null;
  ownerUid = uid;
  emit(EMPTY);
  if (!uid) return;
  unsubBlocks = onSnapshot(
    collection(db, "users", uid, BLOCKS_SUBCOLLECTION),
    (snap) => emit(new Set(snap.docs.map((d) => d.id))),
    () => {}
  );
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!unsubAuth) {
    unsubAuth = onAuthStateChanged(auth, (u) => watchOwner(u?.uid ?? null));
  }
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => blocked;
const getServerSnapshot = () => EMPTY;

export function useBlockedUids(): ReadonlySet<string> {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export async function blockUser(targetUid: string): Promise<boolean> {
  const me = auth.currentUser?.uid;
  const target = targetUid.trim();
  if (!me || !target || me === target) return false;
  emit(new Set([...blocked, target]));
  try {
    await setDoc(doc(db, "users", me, BLOCKS_SUBCOLLECTION, target), {
      targetUid: target,
      createdAt: serverTimestamp(),
    });
    return true;
  } catch {
    const next = new Set(blocked);
    next.delete(target);
    emit(next);
    return false;
  }
}

export async function unblockUser(targetUid: string): Promise<boolean> {
  const me = auth.currentUser?.uid;
  const target = targetUid.trim();
  if (!me || !target) return false;
  const next = new Set(blocked);
  next.delete(target);
  emit(next);
  try {
    await deleteDoc(doc(db, "users", me, BLOCKS_SUBCOLLECTION, target));
    return true;
  } catch {
    emit(new Set([...blocked, target]));
    return false;
  }
}

export async function submitModerationReport(input: {
  targetType: ModerationTargetType;
  targetId: string;
  reason: ModerationReportReason;
}): Promise<"ok" | "rate_limited" | "failed"> {
  const user = auth.currentUser;
  if (!user) return "failed";
  try {
    const token = await user.getIdToken();
    const res = await fetch("/api/moderation/report", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ...input, appVariant: "web" }),
    });
    if (res.status === 429) return "rate_limited";
    // 未デプロイ環境では SPA の HTML が 200 で返るため、JSON の ok で判定する
    const json = (await res.json().catch(() => null)) as { ok?: unknown } | null;
    return res.ok && json?.ok === true ? "ok" : "failed";
  } catch {
    return "failed";
  }
}
