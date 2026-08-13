/**
 * users/{uid} — プロフィール初回表示用のメモリキャッシュ（重複 getDoc 回避）。
 */
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";

const DOC_TTL_MS = 10 * 60_000;

type UserDocEntry = {
  at: number;
  exists: boolean;
  data: Record<string, unknown>;
};

const docCache = new Map<string, UserDocEntry>();
const docInflight = new Map<
  string,
  Promise<{ exists: boolean; data: Record<string, unknown> } | null>
>();

export function peekProfileUserDocNative(
  uid: string
): Record<string, unknown> | null | undefined {
  const safeUid = uid.trim();
  if (!safeUid) return undefined;
  const hit = docCache.get(safeUid);
  if (!hit || Date.now() - hit.at >= DOC_TTL_MS) return undefined;
  return hit.exists ? hit.data : null;
}

export function invalidateProfileUserDocNative(uid: string): void {
  docCache.delete(uid.trim());
}

export async function loadProfileUserDocNative(
  uid: string
): Promise<{ exists: boolean; data: Record<string, unknown> } | null> {
  const safeUid = uid.trim();
  if (!safeUid) return null;

  const hit = docCache.get(safeUid);
  if (hit && Date.now() - hit.at < DOC_TTL_MS) {
    return { exists: hit.exists, data: hit.data };
  }

  const existing = docInflight.get(safeUid);
  if (existing) return existing;

  const promise = getDoc(doc(db, "users", safeUid))
    .then((snap) => {
      const entry: UserDocEntry = {
        at: Date.now(),
        exists: snap.exists(),
        data: snap.exists()
          ? (snap.data() as Record<string, unknown>)
          : {},
      };
      docCache.set(safeUid, entry);
      return { exists: entry.exists, data: entry.data };
    })
    .catch(() => null)
    .finally(() => {
      docInflight.delete(safeUid);
    });

  docInflight.set(safeUid, promise);
  return promise;
}
