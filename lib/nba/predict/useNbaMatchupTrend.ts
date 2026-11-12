"use client";

import { useEffect, useState } from "react";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import { fetchTeamDetailBundle } from "@/lib/nba/teamDetail/fetchTeamDetailClient";
import {
  buildMatchupTrend,
  type NbaMatchupTrend,
} from "@/lib/nba/predict/buildMatchupTrend";

export type { NbaMatchupTrend } from "@/lib/nba/predict/buildMatchupTrend";

type Options = {
  homeTeamId?: string;
  awayTeamId?: string;
  apiBaseUrl?: string | null;
  season?: string;
  tipAtMs?: number | null;
  enabled?: boolean;
};

/** 予想 TREND: 両チームの `/api/nba/team-detail`（チーム詳細と共有キャッシュ） */
export function useNbaMatchupTrend(options: Options): {
  trend: NbaMatchupTrend | null;
  loading: boolean;
} {
  const homeTeamId = options.homeTeamId?.trim() ?? "";
  const awayTeamId = options.awayTeamId?.trim() ?? "";
  const season = (options.season ?? CURRENT_NBA_SEASON_KEY).trim();
  const apiBaseUrl = options.apiBaseUrl;
  const tipAtMs = options.tipAtMs ?? null;
  const enabled = options.enabled ?? true;
  const want = enabled && !!homeTeamId && !!awayTeamId;
  const [trend, setTrend] = useState<NbaMatchupTrend | null>(null);
  const [loading, setLoading] = useState(want);

  useEffect(() => {
    if (!want) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const load = (teamId: string) =>
      fetchTeamDetailBundle({ teamId, season, apiBaseUrl }).catch(() => null);
    Promise.all([load(homeTeamId), load(awayTeamId)])
      .then(([home, away]) => {
        if (cancelled) return;
        setTrend(
          home || away ? buildMatchupTrend({ home, away, tipAtMs }) : null
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [want, homeTeamId, awayTeamId, season, apiBaseUrl, tipAtMs]);

  return { trend, loading };
}
