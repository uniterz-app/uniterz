import { NBA_TEAM_NAME_BY_ID } from "../../../../../lib/nba-team-names";
import { TEAM_SHORT } from "../../../../../lib/team-short";

export type TeamAffinityRow = {
  teamId: string;
  teamName: string;
  games: number;
  winRate: number;
};

export type StyleMapPoint = {
  homeAwayBias: number;
  marketBias: number;
  winRate: number;
  key?: string;
};

export function resolveTeamDisplayName(teamId: string): string {
  return NBA_TEAM_NAME_BY_ID[teamId] ?? TEAM_SHORT[teamId] ?? teamId;
}

export function normalizeTeamAffinityRows(arr: unknown): TeamAffinityRow[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((t) => {
      const row = t as Record<string, unknown>;
      const teamId = String(row.teamId ?? "");
      if (!teamId) return null;
      return {
        teamId,
        teamName: resolveTeamDisplayName(teamId),
        games: Number(row.posts ?? row.games ?? 0),
        winRate: Number(row.winRate ?? 0),
      };
    })
    .filter((r): r is TeamAffinityRow => r != null);
}

/** Firestore に style が無い場合は homeAway / market 件数から近似（Web `computeStyleBiases` 同等） */
export function computeStyleBiases(stats: Record<string, unknown> | null | undefined): {
  homeAwayBias: number;
  marketBias: number;
} {
  if (!stats) return { homeAwayBias: 0, marketBias: 0 };
  const style = stats.style as
    | { homeAwayBias?: number; marketBias?: number }
    | undefined;
  if (
    style &&
    typeof style.homeAwayBias === "number" &&
    typeof style.marketBias === "number"
  ) {
    return {
      homeAwayBias: style.homeAwayBias,
      marketBias: style.marketBias,
    };
  }
  const homeAway = stats.homeAway as
    | { home?: { posts?: number }; away?: { posts?: number } }
    | undefined;
  const h = homeAway?.home?.posts ?? 0;
  const a = homeAway?.away?.posts ?? 0;
  const tot = h + a;
  const homeAwayBias = tot > 0 ? (h - a) / tot : 0;
  const market = stats.marketBias as
    | { favoritePickCount?: number; underdogPickCount?: number }
    | undefined;
  const fav = market?.favoritePickCount ?? 0;
  const und = market?.underdogPickCount ?? 0;
  const mt = fav + und;
  const favRate = mt > 0 ? fav / mt : 0.5;
  const marketBias = (0.5 - favRate) * 2;
  return { homeAwayBias, marketBias };
}

export function buildStyleMapPoint(
  stats: Record<string, unknown> | null | undefined,
  monthKey: string
): StyleMapPoint | null {
  if (!stats) return null;
  const biases = computeStyleBiases(stats);
  const raw = stats.raw as { winRate?: number } | undefined;
  return {
    homeAwayBias: biases.homeAwayBias,
    marketBias: biases.marketBias,
    winRate: Number(raw?.winRate ?? 0),
    key: monthKey,
  };
}
