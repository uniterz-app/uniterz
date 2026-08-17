import { LEAGUES, type League } from "@/lib/leagues";
import type { RankingLeagueSource } from "@/lib/rankings/rankingLeagueSource";

/** オンボーディングで選ぶメインの予想リーグ（games / rankings / profile の初期表示） */
export const PREFERRED_LEAGUES = [LEAGUES.NBA] as const;
export type PreferredLeague = (typeof PREFERRED_LEAGUES)[number];

export function isPreferredLeague(v: unknown): v is PreferredLeague {
  return v === LEAGUES.NBA;
}

/** Firestore の legacy `wc` は NBA として扱う */
export function parsePreferredLeague(raw: unknown): PreferredLeague | null {
  if (raw === LEAGUES.NBA || raw === LEAGUES.WC) return LEAGUES.NBA;
  return null;
}

export function preferredLeagueToGamesLeague(
  _preferred: PreferredLeague
): League {
  return LEAGUES.NBA;
}

export function preferredLeagueToRankingSource(
  _preferred: PreferredLeague
): RankingLeagueSource {
  return "nba";
}
