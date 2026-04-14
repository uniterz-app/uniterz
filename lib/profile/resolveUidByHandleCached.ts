import type { Firestore } from "firebase-admin/firestore";

const HIT_TTL_MS = 5 * 60_000;
const MISS_TTL_MS = 60_000;

type Entry = { at: number; uid: string | null };

const handleUidCache = new Map<string, Entry>();

function ttlFor(entry: Entry): number {
  return entry.uid != null ? HIT_TTL_MS : MISS_TTL_MS;
}

/**
 * Admin `users` の handle 解決をプロセス内で短時間キャッシュし、
 * 同一ハンドルへの連続リクエストの読み取りを抑える。
 */
export async function resolveUidByHandleCached(
  adminDb: Firestore,
  handle: string
): Promise<string | null> {
  const key = handle;
  const now = Date.now();
  const hit = handleUidCache.get(key);
  if (hit && now - hit.at < ttlFor(hit)) {
    return hit.uid;
  }

  const snap = await adminDb
    .collection("users")
    .where("handle", "==", handle)
    .limit(1)
    .get();

  const uid = snap.empty ? null : snap.docs[0].id;
  handleUidCache.set(key, { at: now, uid });
  return uid;
}
