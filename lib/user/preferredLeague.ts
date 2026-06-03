import { LEAGUES, type League } from "@/lib/leagues";
import type { RankingLeagueSource } from "@/lib/rankings/rankingLeagueSource";

/** オンボーディングで選ぶメインの予想リーグ（games / rankings / profile の初期表示） */
export const PREFERRED_LEAGUES = [LEAGUES.NBA, LEAGUES.WC] as const;
export type PreferredLeague = (typeof PREFERRED_LEAGUES)[number];

export function isPreferredLeague(v: unknown): v is PreferredLeague {
  return v === LEAGUES.NBA || v === LEAGUES.WC;
}

export function parsePreferredLeague(raw: unknown): PreferredLeague | null {
  return isPreferredLeague(raw) ? raw : null;
}

export function preferredLeagueToGamesLeague(
  preferred: PreferredLeague
): League {
  return preferred;
}

export function preferredLeagueToRankingSource(
  preferred: PreferredLeague
): RankingLeagueSource {
  return preferred === LEAGUES.WC ? "worldcup" : "nba";
}
