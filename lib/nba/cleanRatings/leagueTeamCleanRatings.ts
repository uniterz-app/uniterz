import type { NbaLeagueTeamStatRow } from "@/lib/predict/nbaLeagueTeamStatsMocks";

/** その表にガベージ抜きの値が入っているか（無い季・プレーオフは RATINGS を出さない） */
export function leagueTeamRowsHaveCleanRatings(rows: readonly NbaLeagueTeamStatRow[]): boolean {
  return rows.some((r) => r.cleanOrtg > 0);
}

/** ガベージ抜き系の NET の 30 チーム中の順位（1 = 最良）。値が無ければ null */
export function leagueTeamCleanNetRank(
  rows: readonly NbaLeagueTeamStatRow[],
  teamId: string,
  metric: "cleanNet" | "cleanAdjNet" | "cleanNetL10" = "cleanNet"
): number | null {
  const ranked = rows
    .filter((r) => r.cleanOrtg > 0)
    .sort((a, b) => b[metric] - a[metric]);
  const i = ranked.findIndex((r) => r.teamId === teamId);
  return i >= 0 ? i + 1 : null;
}
