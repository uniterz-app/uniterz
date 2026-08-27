/**
 * TOP SCORER 候補。
 * `games.topScorerCandidates` があればそれを使い、無ければ
 * 対戦2チームのロスター（Firestore）から PPG 順に組む。
 */
"use client";

import { useMemo } from "react";
import type { NbaTopScorerCandidate } from "@/lib/nba/topScorer";
import { topScorerCandidatesFromRoster } from "@/lib/nba/topScorerCandidatesFromRoster";
import { useNbaMatchupRoster } from "@/lib/nba/teamRosters/useNbaMatchupRoster";

type Options = {
  homeTeamId?: string | null;
  awayTeamId?: string | null;
  /** game に載っている候補。非空なら API を叩かない */
  override?: NbaTopScorerCandidate[] | null;
  apiBaseUrl?: string | null;
  season?: string;
  enabled?: boolean;
};

export function useNbaTopScorerCandidates(options: Options): {
  candidates: NbaTopScorerCandidate[];
  loading: boolean;
  source: "override" | "roster" | "empty";
} {
  const override = options.override ?? null;
  const hasOverride = Array.isArray(override) && override.length > 0;
  const homeTeamId = options.homeTeamId?.trim() || undefined;
  const awayTeamId = options.awayTeamId?.trim() || undefined;
  const enabled =
    (options.enabled ?? true) && !hasOverride && !!homeTeamId && !!awayTeamId;

  const { roster, loading } = useNbaMatchupRoster({
    homeTeamId,
    awayTeamId,
    apiBaseUrl: options.apiBaseUrl,
    season: options.season,
    enabled,
  });

  const fromRoster = useMemo(
    () => (hasOverride ? [] : topScorerCandidatesFromRoster(roster)),
    [hasOverride, roster]
  );

  if (hasOverride) {
    return {
      candidates: override!,
      loading: false,
      source: "override",
    };
  }

  return {
    candidates: fromRoster,
    loading: enabled && loading,
    source: fromRoster.length > 0 ? "roster" : "empty",
  };
}
