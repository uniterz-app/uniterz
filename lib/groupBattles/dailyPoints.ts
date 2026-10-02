/**
 * user_stats_v2_daily から NBA Pick Up 総合ポイントを読む。
 * PRO LEAGUE（open / leagues.nba / all）は使わない。
 */

export type DailyPointsInc = {
  pointsSumV3?: number;
};

/**
 * Pick Up のみ:
 * 1. rankingBySeason[seasonKey]
 * 2. ranking（レガシー Pick Up 累積）
 */
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

  const ranking = data.ranking;
  if (ranking && typeof ranking === "object") {
    return ranking as DailyPointsInc;
  }

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
