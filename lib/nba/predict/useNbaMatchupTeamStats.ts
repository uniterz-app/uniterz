"use client";

import { useEffect, useState } from "react";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import { fetchLeagueTeamStats } from "@/lib/nba/leagueTeamStats/fetchLeagueTeamStatsClient";
import { fetchTeamGameLog } from "@/lib/nba/teamGameLog/fetchTeamGameLogClient";
import { enrichLeagueTeamStatsBundle } from "@/lib/predict/nbaLeagueTeamStatsMocks";
import { buildMatchupTeamStatsBundle } from "@/lib/nba/predict/buildMatchupTeamStatsBundle";
import {
  createSnapshotFetchCache,
  nbaSnapshotCacheKey,
  NBA_SNAPSHOT_CACHE_TTL_MS,
} from "@/lib/nba/snapshotFetchCache";
import type { NbaLeagueTeamStatsApiPayload } from "@/lib/nba/leagueTeamStats/leagueTeamStatsTypes";
import type { NbaTeamStatsBundle } from "@/lib/predict/nbaTeamStatsPreviewMocks";
import { emptyTeamStatsBundle } from "@/lib/predict/nbaTeamStatsPreviewMocks";
import type { NbaTeamGameLogSlice } from "@/lib/nba/teamGameLog/teamGameLogTypes";

type Options = {
  homeTeamId?: string;
  awayTeamId?: string;
  apiBaseUrl?: string | null;
  season?: string;
  override?: NbaTeamStatsBundle | null;
  /** false のときは取得しない（未選択タブの先読みを止める） */
  enabled?: boolean;
};

/** 予想モーダルを開き直してもリーグ表を取り直さない */
const leagueCache = createSnapshotFetchCache<NbaLeagueTeamStatsApiPayload>(
  NBA_SNAPSHOT_CACHE_TTL_MS
);

/**
 * 予想 STATS: リーグ表の当該2チーム + 試合ログ（H/A・FORM）。
 * モック matchup には落とさない。
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

  const [stats, setStats] = useState<NbaTeamStatsBundle | null>(
    override ?? null
  );
  const [loading, setLoading] = useState(
    enabled && !override && !!homeTeamId && !!awayTeamId
  );
  const [source, setSource] = useState<
    "override" | "firestore" | "empty" | "error"
  >(override ? "override" : "empty");

  useEffect(() => {
    if (override) {
      setStats(override);
      setSource("override");
      setLoading(false);
      return;
    }
    if (!enabled) {
      setLoading(false);
      return;
    }
    if (!homeTeamId || !awayTeamId) {
      setStats(null);
      setSource("empty");
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const wrapLog = (teamId: string): Promise<NbaTeamGameLogSlice | null> =>
      fetchTeamGameLog({ teamId, season, apiBaseUrl })
        .then((p) => p.log)
        .catch(() => null);

    Promise.all([
      leagueCache.load(nbaSnapshotCacheKey(apiBaseUrl, season), () =>
        fetchLeagueTeamStats({ season, apiBaseUrl })
      ),
      wrapLog(homeTeamId),
      wrapLog(awayTeamId),
    ])
      .then(([league, homeLog, awayLog]) => {
        if (cancelled) return;
        const bundle = enrichLeagueTeamStatsBundle(
          league.bundle,
          league.source
        );
        const built = buildMatchupTeamStatsBundle({
          homeTeamId,
          awayTeamId,
          seasonRows: bundle.season,
          last10Rows: bundle.last10,
          homeLog,
          awayLog,
        });
        setStats(built);
        const live =
          league.source === "firestore" ||
          Boolean(homeLog?.finalCount || awayLog?.finalCount) ||
          bundle.season.some(
            (r) => r.teamId === homeTeamId || r.teamId === awayTeamId
          );
        setSource(live ? "firestore" : "empty");
      })
      .catch(() => {
        if (cancelled) return;
        setStats(emptyTeamStatsBundle(homeTeamId, awayTeamId));
        setSource("error");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, homeTeamId, awayTeamId, season, apiBaseUrl, override]);

  return { stats, loading, source };
}
