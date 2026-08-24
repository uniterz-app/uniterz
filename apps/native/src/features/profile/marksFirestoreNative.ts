/** MARK リスト — `users/{uid}/marks/{targetUid}`（Firestore rules と一致） */
import {
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDocs,
  setDoc,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import {
  MARKED_BY_SUBCOLLECTION,
  MARKS_SUBCOLLECTION,
  MAX_MARKS_PRO,
  parseUserMark,
  type UserMark,
} from "../../../../../lib/marks/markTypes";
import {
  hydrateMarksMemory,
  peekMarksWriteEpoch,
} from "../../../../../lib/marks/marksMemoryStore";

type MarksOk = { ok: true };
type MarksFail = { ok: false; error: "failed" };

/** @deprecated ルートの markedPredictors は rules で書けない。後方互換の読みだけ残す */
const LEGACY_MARKS_FIELD = "markedPredictors";

function parseMarksField(raw: unknown): UserMark[] {
  if (!Array.isArray(raw)) return [];
  const rows: UserMark[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const data = item as Record<string, unknown>;
    const uid =
      typeof data.targetUid === "string" ? data.targetUid.trim() : "";
    const parsed = parseUserMark(uid, data);
    if (!parsed || seen.has(parsed.targetUid)) continue;
    seen.add(parsed.targetUid);
    rows.push(parsed);
  }
  rows.sort((a, b) => b.createdAtMs - a.createdAtMs);
  return rows.slice(0, MAX_MARKS_PRO);
}

export function parseMarksFromUserDoc(
  data: Record<string, unknown> | null | undefined
): UserMark[] {
  return parseMarksField(data?.[LEGACY_MARKS_FIELD]);
}

/**
 * レガシー配列があるときだけメモリを埋める。
 * 無いときは hydrated にしない（サブコレクション取得へ回す）。
 */
export function hydrateMarksFromUserDoc(
  uid: string,
  data: Record<string, unknown> | null | undefined
): boolean {
  const owner = uid.trim();
  if (!owner || !data) return false;
  if (!Array.isArray(data[LEGACY_MARKS_FIELD])) return false;
  hydrateMarksMemory(
    owner,
    parseMarksFromUserDoc(data),
    peekMarksWriteEpoch()
  );
  return true;
}

export async function listMarksNative(uid: string): Promise<UserMark[]> {
  const owner = uid.trim();
  if (!owner) return [];
  try {
    const snap = await getDocs(
      collection(db, "users", owner, MARKS_SUBCOLLECTION)
    );
    const rows: UserMark[] = [];
    const seen = new Set<string>();
    for (const d of snap.docs) {
      const parsed = parseUserMark(d.id, d.data() as Record<string, unknown>);
      if (!parsed || seen.has(parsed.targetUid)) continue;
      seen.add(parsed.targetUid);
      rows.push(parsed);
    }
    rows.sort((a, b) => b.createdAtMs - a.createdAtMs);
    return rows.slice(0, MAX_MARKS_PRO);
  } catch (err) {
    console.warn("[marks] list failed", err);
    return [];
  }
}

export async function writeMarkNative(
  uid: string,
  mark: UserMark
): Promise<MarksOk | MarksFail> {
  const owner = uid.trim();
  const target = mark.targetUid.trim();
  if (!owner || !target || owner === target) {
    return { ok: false, error: "failed" };
  }
  try {
    await setDoc(doc(db, "users", owner, MARKS_SUBCOLLECTION, target), {
      targetUid: target,
      handle: mark.handle,
      displayName: mark.displayName,
      photoURL: mark.photoURL,
      createdAtMs: mark.createdAtMs,
    });
    return { ok: true };
  } catch (err) {
    console.warn("[marks] write failed", err);
    return { ok: false, error: "failed" };
  }
}

export async function deleteMarkNative(
  uid: string,
  targetUid: string
): Promise<MarksOk | MarksFail> {
  const owner = uid.trim();
  const target = targetUid.trim();
  if (!owner || !target) return { ok: false, error: "failed" };
  try {
    await deleteDoc(doc(db, "users", owner, MARKS_SUBCOLLECTION, target));
    return { ok: true };
  } catch (err) {
    console.warn("[marks] delete failed", err);
    return { ok: false, error: "failed" };
  }
}

export async function setMarkedByNative(
  targetUid: string,
  fromUid: string
): Promise<void> {
  const target = targetUid.trim();
  const from = fromUid.trim();
  if (!target || !from || target === from) return;
  try {
    await setDoc(doc(db, "users", target, MARKED_BY_SUBCOLLECTION, from), {
      fromUid: from,
      createdAtMs: Date.now(),
    });
  } catch (err) {
    console.warn("[marks] markedBy set failed", err);
  }
}

export async function clearMarkedByNative(
  targetUid: string,
  fromUid: string
): Promise<void> {
  const target = targetUid.trim();
  const from = fromUid.trim();
  if (!target || !from) return;
  try {
    await deleteDoc(doc(db, "users", target, MARKED_BY_SUBCOLLECTION, from));
  } catch (err) {
    console.warn("[marks] markedBy clear failed", err);
  }
}

export async function countMarkedByNative(uid: string): Promise<number> {
  const owner = uid.trim();
  if (!owner) return 0;
  try {
    const snap = await getCountFromServer(
      collection(db, "users", owner, MARKED_BY_SUBCOLLECTION)
    );
    return snap.data().count;
  } catch (err) {
    console.warn("[marks] markedBy count failed", err);
    return 0;
  }
}
