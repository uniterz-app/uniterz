"use client";

import { useCallback, useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import type { Language } from "@/lib/i18n/language";
import type { RankingLeagueSource } from "@/lib/rankings/rankingLeagueSource";
import type { RankGapAnalysis } from "@/lib/rankings/rankGapAnalysis";

type State =
  | { status: "idle" | "loading" }
  | { status: "ready"; analysis: RankGapAnalysis }
  | { status: "error"; code: string };

export function useRankGapAnalysis(input: {
  enabled?: boolean;
  rankingLeague: RankingLeagueSource;
  wcStage?: unknown;
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
        lang: input.language,
      });
      const res = await fetch(`/api/rankings/gap?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const json = (await res.json()) as {
        ok?: boolean;
        analysis?: RankGapAnalysis;
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
    input.rankingLeague,
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
