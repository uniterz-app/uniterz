/**
 * NBA レギュラーシーズン順位の「今季だけ」の同率タイブレーク。
 * クライアントと同じペアを lib/nba/nbaStandingsSeasonTiebreak.ts に保つこと。
 *
 * 各要素は [同率時に上位の teamId, 下位側 teamId]。
 */
export const NBA_STANDINGS_SEASON_TIEBREAK_PAIRS: ReadonlyArray<
  readonly [winnerTeamId: string, loserTeamId: string]
> = [
  ["nba-raptors", "nba-hawks"],
  ["nba-76ers", "nba-magic"],
  ["nba-blazers", "nba-clippers"],
];

/** @returns negative if a should rank above b, positive if b above a, 0 if no rule */
export function compareNbaStandingsSeasonTiebreak(
  aId: string,
  bId: string
): number {
  for (const [winner, loser] of NBA_STANDINGS_SEASON_TIEBREAK_PAIRS) {
    if (winner === aId && loser === bId) return -1;
    if (winner === bId && loser === aId) return 1;
  }
  return 0;
}
