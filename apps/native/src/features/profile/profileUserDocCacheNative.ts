/**
 * users/{uid} — プロフィール初回表示用（共有メモリ + Native Firestore）。
 */
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import {
  clearUserDocMemoryInflight,
  getUserDocMemoryInflight,
  invalidateUserDocMemory,
  peekUserDocMemory,
  peekUserDocMemoryEntry,
  setUserDocMemory,
  setUserDocMemoryInflight,
} from "../../../../../lib/user/userDocMemoryCache";

/** 復帰直後の Firestore 再接続中は getDoc が返らないことがあるため打ち切る */
const GET_DOC_TIMEOUT_MS = 6_000;
const RETRY_DELAY_MS = 800;
const MAX_ATTEMPTS = 2;

type UserDocLoadResult = { exists: boolean; data: Record<string, unknown> };

/** TTL 切れ・取得失敗時の表示用。成功した最後の users/{uid} */
const lastGoodDoc = new Map<string, UserDocLoadResult>();

export function peekProfileUserDocNative(
  uid: string
): Record<string, unknown> | null | undefined {
  return peekUserDocMemory(uid);
}

/** TTL を無視して、最後に取得できた users/{uid} を返す（未取得は undefined） */
export function peekLastGoodProfileUserDocNative(
  uid: string
): Record<string, unknown> | null | undefined {
  const hit = lastGoodDoc.get(uid.trim());
  if (!hit) return undefined;
  return hit.exists ? hit.data : null;
}

export function invalidateProfileUserDocNative(uid: string): void {
  invalidateUserDocMemory(uid);
  lastGoodDoc.delete(uid.trim());
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getDocWithTimeout(uid: string) {
  return new Promise<Awaited<ReturnType<typeof getDoc>>>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("users doc read timed out")),
      GET_DOC_TIMEOUT_MS
    );
    getDoc(doc(db, "users", uid)).then(
      (snap) => {
        clearTimeout(timer);
        resolve(snap);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      }
    );
  });
}

async function fetchUserDocWithRetry(
  uid: string
): Promise<UserDocLoadResult | null> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const snap = await getDocWithTimeout(uid);
      const entry: UserDocLoadResult = {
        exists: snap.exists(),
        data: snap.exists() ? (snap.data() as Record<string, unknown>) : {},
      };
      setUserDocMemory(uid, entry);
      lastGoodDoc.set(uid, entry);
      return entry;
    } catch (e) {
      if (__DEV__) {
        console.warn(`[profileUserDoc] read failed (attempt ${attempt})`, e);
      }
      if (attempt < MAX_ATTEMPTS) await sleep(RETRY_DELAY_MS);
    }
  }
  return null;
}

export async function loadProfileUserDocNative(
  uid: string,
  opts?: {
    /** メモリを使わず取り直す（残高などサーバー側で増える値を最新にする） */
    fresh?: boolean;
  }
): Promise<UserDocLoadResult | null> {
  const safeUid = uid.trim();
  if (!safeUid) return null;

  const hit = opts?.fresh ? undefined : peekUserDocMemoryEntry(safeUid);
  if (hit) {
    return { exists: hit.exists, data: hit.data };
  }

  const existing = getUserDocMemoryInflight(safeUid);
  if (existing) return existing;

  const promise = fetchUserDocWithRetry(safeUid).finally(() => {
    clearUserDocMemoryInflight(safeUid);
  });

  setUserDocMemoryInflight(safeUid, promise);
  return promise;
}
