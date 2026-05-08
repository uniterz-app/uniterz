/** ランキング一覧のデータソース（NBA プレーオフ vs ワールドカップ） */

export const RANKING_LEAGUE_SOURCES = ["nba", "worldcup"] as const;

export type RankingLeagueSource = (typeof RANKING_LEAGUE_SOURCES)[number];

export function isRankingLeagueSource(v: unknown): v is RankingLeagueSource {
  return v === "nba" || v === "worldcup";
}
