"use client";

import { useEffect, useRef } from "react";
import type { ReadonlyURLSearchParams } from "next/navigation";
import { RANKINGS_TAB_LEAGUE_PARAM } from "@/lib/navigation/rankingsProfileFrom";
import type { RankingLeagueSource } from "@/lib/rankings/rankingLeagueSource";
import { LEAGUES } from "@/lib/leagues";
import { useUserPreferredLeague } from "@/lib/hooks/useUserPreferredLeague";

/**
 * URL に rankLeague が無いとき、users.preferredLeague === wc なら WC ランキングを初期表示。
 */
export function useApplyPreferredRankingLeague(
  uid: string | null | undefined,
  searchParams: ReadonlyURLSearchParams,
  setRankingLeague: (v: RankingLeagueSource) => void,
  onPreferredWorldCup?: () => void
): void {
  const { preferredLeague, ready } = useUserPreferredLeague(uid);
  const didApplyRef = useRef(false);
  const onWcRef = useRef(onPreferredWorldCup);
  onWcRef.current = onPreferredWorldCup;

  useEffect(() => {
    if (!ready || didApplyRef.current) return;

    if (searchParams.get(RANKINGS_TAB_LEAGUE_PARAM)) {
      didApplyRef.current = true;
      return;
    }

    if (preferredLeague === LEAGUES.WC) {
      setRankingLeague("worldcup");
      onWcRef.current?.();
    }

    didApplyRef.current = true;
  }, [ready, preferredLeague, searchParams, setRankingLeague]);
}
