/** Firestore `users.createdAt` を参加日時（ms）に正規化 */
export function parseMemberSinceMs(
  data: Record<string, unknown>
): number | null {
  const createdAt = data.createdAt;
  if (createdAt && typeof createdAt === "object") {
    const ts = createdAt as { toMillis?: () => number; seconds?: number };
    if (typeof ts.toMillis === "function") {
      const ms = ts.toMillis();
      return Number.isFinite(ms) ? ms : null;
    }
    if (typeof ts.seconds === "number" && Number.isFinite(ts.seconds)) {
      return ts.seconds * 1000;
    }
  }
  if (typeof createdAt === "number" && Number.isFinite(createdAt)) {
    return createdAt;
  }
  return null;
}
