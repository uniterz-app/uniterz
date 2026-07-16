"use client";

import { useCallback, useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import type { Language } from "@/lib/i18n/language";
import type { PlayoffRoundKey } from "@/lib/rankings/playoffRound";
import type { RankingPhase } from "@/lib/rankings/rankingPhase";
import type { RankingLeagueSource } from "@/lib/rankings/rankingLeagueSource";
import type { RankShadowAnalysis } from "@/lib/rankings/rankShadowAnalysis";
import type { WcRankingStage } from "@/lib/rankings/wcRankingStage";

type State =
  | { status: "idle" | "loading" }
  | { status: "ready"; analysis: RankShadowAnalysis }
  | { status: "error"; code: string };

export function useRankShadowAnalysis(input: {
  enabled?: boolean;
  rankingLeague: RankingLeagueSource;
  phase: RankingPhase;
  round: PlayoffRoundKey;
  wcStage: WcRankingStage | null;
  language: Language;
}) {
  const [state, setState] = useState<State>({ status: "idle" });

  const reload = useCallback(async () => {
    const user = getAuth().currentUser;
    if (!user || input.enabled === false) {
      setState({ status: "idle" });
      return;
    }

    setState({ status: "loading" });
    try {
      const token = await user.getIdToken();
      const params = new URLSearchParams({
        league: input.rankingLeague,
        phase: input.phase,
        round: input.round,
        lang: input.language,
      });
      if (input.wcStage) params.set("wcStage", input.wcStage);

      const res = await fetch(`/api/rankings/shadow?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const json = (await res.json()) as {
        ok?: boolean;
        analysis?: RankShadowAnalysis;
        error?: string;
      };

      if (!res.ok || !json.ok || !json.analysis) {
        setState({
          status: "error",
          code: json.error ?? `http_${res.status}`,
        });
        return;
      }

      setState({ status: "ready", analysis: json.analysis });
    } catch {
      setState({ status: "error", code: "network" });
    }
  }, [
    input.enabled,
    input.language,
    input.phase,
    input.rankingLeague,
    input.round,
    input.wcStage,
  ]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    state,
    reload,
    loading: state.status === "loading" || state.status === "idle",
    analysis: state.status === "ready" ? state.analysis : null,
    errorCode: state.status === "error" ? state.code : null,
  };
}
