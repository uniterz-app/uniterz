import { computeStreakMetricsFromResults } from "@/lib/profile/computeStreakMetrics";
import {
  postMatchesProfileStreakScope,
  PROFILE_STREAK_SCOPE_KEYS,
  type ProfileStreakScopeKey,
} from "@/lib/profile/profileStreakScope";
import type { StreakMetrics } from "@/lib/profile/computeStreakMetrics";

export type SettledPostRow = {
  postId: string;
  gameId?: string | null;
  settledAtMs: number;
  isWin: boolean;
  league?: unknown;
  seasonPhase?: unknown;
  wcStage?: unknown;
};

export function computeAllScopeMetrics(
  rows: readonly SettledPostRow[]
): Record<ProfileStreakScopeKey, StreakMetrics> {
  const buckets: Record<ProfileStreakScopeKey, { ms: number; isWin: boolean }[]> =
    {
      "nba:playoffs": [],
      "wc:overall": [],
      "wc:qualifying": [],
      "wc:main": [],
    };

  for (const row of rows) {
    const input = {
      league: row.league,
      gameId: row.gameId,
      seasonPhase: row.seasonPhase,
      wcStage: row.wcStage,
    };
    for (const scope of PROFILE_STREAK_SCOPE_KEYS) {
      if (!postMatchesProfileStreakScope(input, scope)) continue;
      buckets[scope].push({ ms: row.settledAtMs, isWin: row.isWin });
    }
  }

  const out = {} as Record<ProfileStreakScopeKey, StreakMetrics>;
  for (const scope of PROFILE_STREAK_SCOPE_KEYS) {
    const scoped = buckets[scope];
    scoped.sort((a, b) => a.ms - b.ms);
    out[scope] = computeStreakMetricsFromResults(scoped.map((r) => r.isWin));
  }
  return out;
}

export function filterPostsForScope(
  rows: readonly SettledPostRow[],
  scope: ProfileStreakScopeKey,
  maxCount: number
): SettledPostRow[] {
  const filtered: SettledPostRow[] = [];
  for (const row of rows) {
    if (
      !postMatchesProfileStreakScope(
        {
          league: row.league,
          gameId: row.gameId,
          seasonPhase: row.seasonPhase,
          wcStage: row.wcStage,
        },
        scope
      )
    ) {
      continue;
    }
    filtered.push(row);
    if (filtered.length >= maxCount) break;
  }
  return filtered;
}
