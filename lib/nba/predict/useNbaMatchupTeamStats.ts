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
import { leagueTeamStatsSnapshotCache } from "@/lib/nba/leagueTeamStats/leagueTeamStatsSnapshotCache";
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

const gameLogCache = createSnapshotFetchCache<NbaTeamGameLogSlice>(
  NBA_SNAPSHOT_CACHE_TTL_MS
);

const matchupStatsCache = createSnapshotFetchCache<NbaTeamStatsBundle>(
  NBA_SNAPSHOT_CACHE_TTL_MS
);

function logCacheKey(
  apiBaseUrl: string | null | undefined,
  season: string,
  teamId: string
): string {
  return `${nbaSnapshotCacheKey(apiBaseUrl, season)}|log|${teamId}`;
}

function matchupCacheKey(
  apiBaseUrl: string | null | undefined,
  season: string,
  homeTeamId: string,
  awayTeamId: string
): string {
  return `${nbaSnapshotCacheKey(apiBaseUrl, season)}|${homeTeamId}|${awayTeamId}`;
}

function bundleFromLeague(
  league: NbaLeagueTeamStatsApiPayload,
  homeTeamId: string,
  awayTeamId: string,
  homeLog: NbaTeamGameLogSlice | null,
  awayLog: NbaTeamGameLogSlice | null
): NbaTeamStatsBundle {
  const bundle = enrichLeagueTeamStatsBundle(league.bundle, league.source);
  return buildMatchupTeamStatsBundle({
    homeTeamId,
    awayTeamId,
    seasonRows: bundle.season,
    last10Rows: bundle.last10,
    homeLog,
    awayLog,
  });
}

function sourceFromBuilt(
  league: NbaLeagueTeamStatsApiPayload,
  homeTeamId: string,
  awayTeamId: string,
  homeLog: NbaTeamGameLogSlice | null,
  awayLog: NbaTeamGameLogSlice | null
): "firestore" | "empty" {
  const enriched = enrichLeagueTeamStatsBundle(league.bundle, league.source);
  const live =
    league.source === "firestore" ||
    Boolean(homeLog?.finalCount || awayLog?.finalCount) ||
    enriched.season.some(
      (r) => r.teamId === homeTeamId || r.teamId === awayTeamId
    );
  return live ? "firestore" : "empty";
}

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
  const want = enabled && !override && !!homeTeamId && !!awayTeamId;
  const leagueKey = nbaSnapshotCacheKey(apiBaseUrl, season);
  const builtKey = matchupCacheKey(apiBaseUrl, season, homeTeamId, awayTeamId);
  const peekedBuilt = want ? matchupStatsCache.peek(builtKey) : null;
  const peekedLeague =
    want && !peekedBuilt
      ? leagueTeamStatsSnapshotCache.peek(leagueKey)
      : null;
  const peekedFromLeague =
    peekedLeague &&
    homeTeamId &&
    awayTeamId &&
    (peekedLeague.bundle.season.some(
      (r) => r.teamId === homeTeamId || r.teamId === awayTeamId
    ) ||
      peekedLeague.bundle.last10.some(
        (r) => r.teamId === homeTeamId || r.teamId === awayTeamId
      ))
      ? bundleFromLeague(
          peekedLeague,
          homeTeamId,
          awayTeamId,
          gameLogCache.peek(logCacheKey(apiBaseUrl, season, homeTeamId)),
          gameLogCache.peek(logCacheKey(apiBaseUrl, season, awayTeamId))
        )
      : null;
  const peekedStats = peekedBuilt ?? peekedFromLeague;
  const scopeKey = builtKey;

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
    if (!enabled) {
      return;
    }
    if (!homeTeamId || !awayTeamId) {
      setStats(null);
      setSource("empty");
      setReadyScope(scopeKey);
      return;
    }

    const cachedBuilt = matchupStatsCache.peek(builtKey);
    if (cachedBuilt) {
      setStats(cachedBuilt);
      setSource("firestore");
      setReadyScope(scopeKey);
      return;
    }

    let cancelled = false;

    const wrapLog = (teamId: string): Promise<NbaTeamGameLogSlice | null> =>
      gameLogCache
        .load(logCacheKey(apiBaseUrl, season, teamId), () =>
          fetchTeamGameLog({ teamId, season, apiBaseUrl }).then((p) => p.log)
        )
        .catch(() => null);

    Promise.all([
      leagueTeamStatsSnapshotCache.load(leagueKey, () =>
        fetchLeagueTeamStats({ season, apiBaseUrl })
      ),
      wrapLog(homeTeamId),
      wrapLog(awayTeamId),
    ])
      .then(([league, homeLog, awayLog]) => {
        if (cancelled) return;
        const built = bundleFromLeague(
          league,
          homeTeamId,
          awayTeamId,
          homeLog,
          awayLog
        );
        matchupStatsCache.load(builtKey, () => Promise.resolve(built));
        setStats(built);
        setSource(
          sourceFromBuilt(league, homeTeamId, awayTeamId, homeLog, awayLog)
        );
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
    leagueKey,
    builtKey,
    scopeKey,
  ]);

  const resolved = override ?? stats ?? peekedStats;
  const loading = Boolean(want && !resolved && readyScope !== scopeKey);

  return { stats: resolved, loading, source };
}
