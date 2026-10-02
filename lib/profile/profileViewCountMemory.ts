/**
 * プロフィール閲覧数の短いメモリ（Web / Native 共用）。
 * タブ往復でチップを空に戻さない。TTL 短め。
 */

const TTL_MS = 2 * 60 * 1000;
const cache = new Map<string, { at: number; count: number }>();

export function peekProfileViewCountMemory(
  uid: string | null | undefined
): number | null {
  const key = uid?.trim() ?? "";
  if (!key) return null;
  const hit = cache.get(key);
  if (!hit || Date.now() - hit.at >= TTL_MS) return null;
  return hit.count;
}

export function setProfileViewCountMemory(uid: string, count: number): void {
  const key = uid.trim();
  if (!key) return;
  cache.set(key, {
    at: Date.now(),
    count: Math.max(0, Math.floor(count)),
  });
}
