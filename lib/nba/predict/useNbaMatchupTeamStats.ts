"use client";

import { useEffect, useState } from "react";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import {
  fetchMatchupDetailBundle,
  peekMatchupDetailBundle,
} from "@/lib/nba/predict/fetchMatchupDetailClient";
import type { NbaTeamStatsBundle } from "@/lib/predict/nbaTeamStatsPreviewMocks";
import { emptyTeamStatsBundle } from "@/lib/predict/nbaTeamStatsPreviewMocks";

type Options = {
  homeTeamId?: string;
  awayTeamId?: string;
  apiBaseUrl?: string | null;
  season?: string;
  override?: NbaTeamStatsBundle | null;
  /** false のときは取得しない（未選択タブの先読みを止める） */
  enabled?: boolean;
};

/**
 * 予想 STATS: `/api/nba/matchup-detail` 共有キャッシュから切り出し。
 * （旧: league-team-stats + game-log×2 の 3 本 fan-out）
 */
export function useNbaMatchupTeamStats(options: Options): {
  stats: NbaTeamStatsBundle | null;
  loading: boolean;
  source: "override" | "firestore" | "empty" | "error";
} {
  const homeTeamId = options.homeTeamId?.trim() ?? "";
  const awayTeamId = options.awayTeamId?.trim() ?? "";
  const season = (options.season ?? CURRENT_NBA_SEASON_KEY).trim();
  const override = options.override;
  const apiBaseUrl = options.apiBaseUrl;
  const enabled = options.enabled ?? true;
  const want = enabled && !override && !!homeTeamId && !!awayTeamId;
  const fetchOpts = { homeTeamId, awayTeamId, season, apiBaseUrl };
  const peeked = want ? peekMatchupDetailBundle(fetchOpts) : null;
  const peekedStats = peeked?.stats ?? null;
  const scopeKey = `${homeTeamId}|${awayTeamId}|${season}|stats`;

  const [stats, setStats] = useState<NbaTeamStatsBundle | null>(
    () => override ?? peekedStats
  );
  const [source, setSource] = useState<
    "override" | "firestore" | "empty" | "error"
  >(override ? "override" : peekedStats ? "firestore" : "empty");
  const [readyScope, setReadyScope] = useState<string | null>(() =>
    override || peekedStats ? scopeKey : null
  );

  useEffect(() => {
    if (override) {
      setStats(override);
      setSource("override");
      setReadyScope(scopeKey);
      return;
    }
    if (!enabled) return;
    if (!homeTeamId || !awayTeamId) {
      setStats(null);
      setSource("empty");
      setReadyScope(scopeKey);
      return;
    }

    const hit = peekMatchupDetailBundle(fetchOpts);
    if (hit) {
      setStats(hit.stats);
      setSource(hit.source === "firestore" ? "firestore" : "empty");
      setReadyScope(scopeKey);
      return;
    }

    let cancelled = false;
    fetchMatchupDetailBundle(fetchOpts)
      .then((payload) => {
        if (cancelled) return;
        setStats(payload.stats);
        setSource(payload.source === "firestore" ? "firestore" : "empty");
      })
      .catch(() => {
        if (cancelled) return;
        setStats(emptyTeamStatsBundle(homeTeamId, awayTeamId));
        setSource("error");
      })
      .finally(() => {
        if (!cancelled) setReadyScope(scopeKey);
      });

    return () => {
      cancelled = true;
    };
  }, [
    enabled,
    homeTeamId,
    awayTeamId,
    season,
    apiBaseUrl,
    override,
    scopeKey,
  ]);

  const resolved = override ?? stats ?? peekedStats;
  const loading = Boolean(want && !resolved && readyScope !== scopeKey);

  return { stats: resolved, loading, source };
}
