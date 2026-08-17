/**
 * バッジ付与ドキュメントの契約。
 *
 * 正本:
 *   user_badges/{uid}/badges/{badgeId}
 *     badgeId, grantedAt, meta.participantCount（付与時点のランキング母数）
 *   master_badges/{badgeId}.participantCount（同じ回の共有フォールバック）
 *
 * 表示優先順位: user_badges.meta → master_badges → （旧データ用）スナップショット推測
 */

export type BadgeGrantMeta = {
  /** その回のランキング参加者数（Top20 人数ではない） */
  participantCount?: number;
  rank?: number;
  phase?: string;
  metric?: string;
  round?: string;
  source?: string;
  yearMonth?: string;
};

export function normalizeParticipantCount(v: unknown): number | null {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.floor(n);
}

export function readGrantParticipantCount(data: {
  participantCount?: unknown;
  meta?: { participantCount?: unknown } | null;
}): number | null {
  return (
    normalizeParticipantCount(data.meta?.participantCount) ??
    normalizeParticipantCount(data.participantCount)
  );
}

/** 付与記録を優先。無ければカタログ */
export function pickBadgeParticipantCount(
  granted: unknown,
  catalog: unknown,
): number | undefined {
  const fromGrant = normalizeParticipantCount(granted);
  if (fromGrant != null) return fromGrant;
  const fromCatalog = normalizeParticipantCount(catalog);
  return fromCatalog ?? undefined;
}

export function userBadgeGrantFields(input: {
  badgeId: string;
  meta?: BadgeGrantMeta;
}): { badgeId: string; meta: BadgeGrantMeta } {
  const meta = { ...(input.meta ?? {}) };
  const count = normalizeParticipantCount(meta.participantCount);
  if (count != null) meta.participantCount = count;
  else delete meta.participantCount;
  return { badgeId: input.badgeId, meta };
}
