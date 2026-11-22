"use client";

import { useEffect, useState } from "react";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import {
  fetchMatchupDetailBundle,
  peekMatchupDetailBundle,
} from "@/lib/nba/predict/fetchMatchupDetailClient";
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

/** 予想 TREND: `/api/nba/matchup-detail`（STATS と共有。team-detail×2 はしない） */
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
  const fetchOpts = { homeTeamId, awayTeamId, season, apiBaseUrl };
  const peeked = want ? peekMatchupDetailBundle(fetchOpts) : null;
  const peekedTrend =
    peeked?.trendHome || peeked?.trendAway
      ? buildMatchupTrend({
          home: peeked.trendHome ?? null,
          away: peeked.trendAway ?? null,
          tipAtMs,
        })
      : null;
  const [trend, setTrend] = useState<NbaMatchupTrend | null>(peekedTrend);
  const [loading, setLoading] = useState(want && !peekedTrend);

  useEffect(() => {
    if (!want) {
      setLoading(false);
      return;
    }
    const hit = peekMatchupDetailBundle(fetchOpts);
    if (hit?.trendHome || hit?.trendAway) {
      setTrend(
        buildMatchupTrend({
          home: hit.trendHome ?? null,
          away: hit.trendAway ?? null,
          tipAtMs,
        })
      );
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchMatchupDetailBundle(fetchOpts)
      .then((payload) => {
        if (cancelled) return;
        setTrend(
          payload.trendHome || payload.trendAway
            ? buildMatchupTrend({
                home: payload.trendHome ?? null,
                away: payload.trendAway ?? null,
                tipAtMs,
              })
            : null
        );
      })
      .catch(() => {
        if (!cancelled) setTrend(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [want, homeTeamId, awayTeamId, season, apiBaseUrl, tipAtMs]);

  return { trend: trend ?? peekedTrend, loading };
}
