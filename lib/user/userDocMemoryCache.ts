/**
 * users/{uid} メモリ（Web / Native 共用）。
 * getDoc は各面の Firestore インスタンスで行い、ここに載せる。
 */
const USER_DOC_TTL_MS = 10 * 60 * 1000;

export type UserDocMemoryEntry = {
  at: number;
  exists: boolean;
  data: Record<string, unknown>;
};

const docCache = new Map<string, UserDocMemoryEntry>();
const docInflight = new Map<
  string,
  Promise<{ exists: boolean; data: Record<string, unknown> } | null>
>();

export function peekUserDocMemory(
  uid: string
): Record<string, unknown> | null | undefined {
  const safeUid = uid.trim();
  if (!safeUid) return undefined;
  const hit = docCache.get(safeUid);
  if (!hit || Date.now() - hit.at >= USER_DOC_TTL_MS) return undefined;
  return hit.exists ? hit.data : null;
}

export function peekUserDocMemoryEntry(
  uid: string
): UserDocMemoryEntry | undefined {
  const safeUid = uid.trim();
  if (!safeUid) return undefined;
  const hit = docCache.get(safeUid);
  if (!hit || Date.now() - hit.at >= USER_DOC_TTL_MS) return undefined;
  return hit;
}

export function setUserDocMemory(
  uid: string,
  entry: { exists: boolean; data: Record<string, unknown> }
): void {
  const safeUid = uid.trim();
  if (!safeUid) return;
  docCache.set(safeUid, {
    at: Date.now(),
    exists: entry.exists,
    data: entry.data,
  });
}

export function getUserDocMemoryInflight(
  uid: string
): Promise<{ exists: boolean; data: Record<string, unknown> } | null> | undefined {
  return docInflight.get(uid.trim());
}

export function setUserDocMemoryInflight(
  uid: string,
  promise: Promise<{ exists: boolean; data: Record<string, unknown> } | null>
): void {
  const safeUid = uid.trim();
  if (!safeUid) return;
  docInflight.set(safeUid, promise);
}

export function clearUserDocMemoryInflight(uid: string): void {
  docInflight.delete(uid.trim());
}

export function invalidateUserDocMemory(uid?: string): void {
  if (uid) {
    const safeUid = uid.trim();
    docCache.delete(safeUid);
    docInflight.delete(safeUid);
    return;
  }
  docCache.clear();
  docInflight.clear();
}
