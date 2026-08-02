/** ランキング一覧のデータソース（NBA のみ） */

export const RANKING_LEAGUE_SOURCES = ["nba"] as const;

export type RankingLeagueSource = (typeof RANKING_LEAGUE_SOURCES)[number];

export function isRankingLeagueSource(v: unknown): v is RankingLeagueSource {
  return v === "nba";
}
