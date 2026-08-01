/**
 * user_stats_v2_daily から NBA 総合ポイントを読む。
 * 個人期間ランキングと同じバケット優先順。
 */

export type DailyPointsInc = {
  pointsSumV3?: number;
};

/** seasonKey 優先 → leagues.nba → ranking → all */
export function pickNbaDailyPointsInc(
  data: Record<string, unknown> | null | undefined,
  seasonKey: string
): DailyPointsInc | null {
  if (!data || typeof data !== "object") return null;

  const bySeason = data.rankingBySeason as
    | Record<string, DailyPointsInc>
    | undefined;
  const seasonInc = bySeason?.[seasonKey];
  if (seasonInc && typeof seasonInc === "object") return seasonInc;

  const leagues = data.leagues as { nba?: DailyPointsInc } | undefined;
  if (leagues?.nba && typeof leagues.nba === "object") return leagues.nba;

  const ranking = data.ranking;
  if (ranking && typeof ranking === "object") {
    return ranking as DailyPointsInc;
  }

  const all = data.all;
  if (all && typeof all === "object") return all as DailyPointsInc;

  return null;
}

export function pointsFromDailyDoc(
  data: Record<string, unknown> | null | undefined,
  seasonKey: string
): number {
  const inc = pickNbaDailyPointsInc(data, seasonKey);
  return Number(inc?.pointsSumV3 ?? 0) || 0;
}

export function periodSnapshotDocId(
  battleId: string,
  period: string,
  label: string
): string {
  return `${battleId}_${period}_${label}`;
}
