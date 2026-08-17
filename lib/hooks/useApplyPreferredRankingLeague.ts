"use client";

import { useEffect, useRef } from "react";
import type { ReadonlyURLSearchParams } from "next/navigation";
import { RANKINGS_TAB_LEAGUE_PARAM } from "@/lib/navigation/rankingsProfileFrom";
import type { RankingLeagueSource } from "@/lib/rankings/rankingLeagueSource";
import { useUserPreferredLeague } from "@/lib/hooks/useUserPreferredLeague";
import { preferredLeagueToRankingSource } from "@/lib/user/preferredLeague";

/**
 * URL に rankLeague が無いとき、users.preferredLeague をランキング初期表示へ反映。
 * preferredLeague 未設定時は呼び出し側のデフォルト（NBA）を使う。
 */
export function useApplyPreferredRankingLeague(
  uid: string | null | undefined,
  searchParams: ReadonlyURLSearchParams,
  setRankingLeague: (v: RankingLeagueSource) => void
): void {
  const { preferredLeague, ready } = useUserPreferredLeague(uid);
  const didApplyRef = useRef(false);

  useEffect(() => {
    if (!ready || didApplyRef.current) return;

    if (searchParams.get(RANKINGS_TAB_LEAGUE_PARAM)) {
      didApplyRef.current = true;
      return;
    }

    if (preferredLeague) {
      setRankingLeague(preferredLeagueToRankingSource(preferredLeague));
    }

    didApplyRef.current = true;
  }, [ready, preferredLeague, searchParams, setRankingLeague]);
}
