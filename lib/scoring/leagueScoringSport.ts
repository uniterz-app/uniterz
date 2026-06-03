import { normalizeLeague, type League } from "@/lib/leagues";

export type ScoringSport = "basketball" | "football";

const FOOTBALL_LEAGUES = new Set<League>(["j1", "pl", "wc"]);

/** 総合得点・スコア精度の採点ロジック（Cloud Functions の sport 区分と一致） */
export function leagueScoringSport(league: string | null | undefined): ScoringSport {
  const key = normalizeLeague(league);
  return FOOTBALL_LEAGUES.has(key) ? "football" : "basketball";
}
