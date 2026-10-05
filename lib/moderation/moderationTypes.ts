/** ユーザー / グループの通報・ブロック（App Store Guideline 1.2）共通型 */

export const MODERATION_TARGET_TYPES = ["user", "group"] as const;
export type ModerationTargetType = (typeof MODERATION_TARGET_TYPES)[number];

export const MODERATION_REPORT_REASONS = [
  "inappropriate",
  "spam",
  "harassment",
] as const;
export type ModerationReportReason = (typeof MODERATION_REPORT_REASONS)[number];

/** Firestore `users/{uid}/blocks/{targetUid}` */
export const BLOCKS_SUBCOLLECTION = "blocks";

export function isModerationTargetType(v: unknown): v is ModerationTargetType {
  return (
    typeof v === "string" &&
    (MODERATION_TARGET_TYPES as readonly string[]).includes(v)
  );
}

export function isModerationReportReason(
  v: unknown
): v is ModerationReportReason {
  return (
    typeof v === "string" &&
    (MODERATION_REPORT_REASONS as readonly string[]).includes(v)
  );
}

/** ランキング行などからブロック済みユーザーを除く */
export function filterBlockedRows<T>(
  rows: readonly T[],
  blockedUids: ReadonlySet<string>,
  getUid: (row: T) => string | null | undefined
): T[] {
  if (blockedUids.size === 0) return rows as T[];
  return rows.filter((row) => {
    const uid = getUid(row);
    return !uid || !blockedUids.has(uid);
  });
}
