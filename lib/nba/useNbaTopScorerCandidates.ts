/**
 * TOP SCORER 候補。
 * 対戦2チームのロスター（Firestore）から PPG 順に組むのが正。
 * `games.topScorerCandidates` はロスターが空のときのフォールバックのみ
 * （開幕前の PPG=0 だけのリストでロスターを潰さない）。
 */
"use client";

import { useMemo } from "react";
import type { NbaTopScorerCandidate } from "@/lib/nba/topScorer";
import { topScorerCandidatesFromRoster } from "@/lib/nba/topScorerCandidatesFromRoster";
import { useNbaMatchupRoster } from "@/lib/nba/teamRosters/useNbaMatchupRoster";

type Options = {
  homeTeamId?: string | null;
  awayTeamId?: string | null;
  /** game に載っている候補。ロスターが空のときだけ使う */
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
  const overrideList =
    Array.isArray(override) && override.length > 0 ? override : null;
  const homeTeamId = options.homeTeamId?.trim() || undefined;
  const awayTeamId = options.awayTeamId?.trim() || undefined;
  const enabled =
    (options.enabled ?? true) && !!homeTeamId && !!awayTeamId;

  const { roster, loading } = useNbaMatchupRoster({
    homeTeamId,
    awayTeamId,
    apiBaseUrl: options.apiBaseUrl,
    season: options.season,
    enabled,
  });

  const fromRoster = useMemo(
    () => topScorerCandidatesFromRoster(roster),
    [roster]
  );

  if (fromRoster.length > 0) {
    return {
      candidates: fromRoster,
      loading: false,
      source: "roster",
    };
  }

  if (overrideList) {
    return {
      candidates: overrideList,
      loading: enabled && loading,
      source: "override",
    };
  }

  return {
    candidates: [],
    loading: enabled && loading,
    source: "empty",
  };
}
