"use client";

import { useEffect, useState } from "react";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import { buildMatchupRosterReport } from "@/lib/nba/teamRosters/buildMatchupRosterReport";
import { fetchMatchupRoster } from "@/lib/nba/teamRosters/fetchTeamRostersClient";
import {
  createSnapshotFetchCache,
  nbaSnapshotCacheKey,
  NBA_SNAPSHOT_CACHE_TTL_MS,
} from "@/lib/nba/snapshotFetchCache";
import type { NbaMatchupRosterApiPayload } from "@/lib/nba/teamRosters/teamRosterTypes";
import type { NbaRosterReport } from "@/lib/predict/nbaRoster";

type Options = {
  homeTeamId?: string;
  awayTeamId?: string;
  /** Native: getUniterzApiBaseUrl() */
  apiBaseUrl?: string | null;
  season?: string;
  /** prop で渡された場合は API をスキップ */
  override?: NbaRosterReport | null;
  /** false のときは取得しない（未選択タブの先読みを止める） */
  enabled?: boolean;
};

const cache = createSnapshotFetchCache<NbaMatchupRosterApiPayload>(
  NBA_SNAPSHOT_CACHE_TTL_MS
);

function rosterCacheKey(
  apiBaseUrl: string | null | undefined,
  season: string,
  homeTeamId: string,
  awayTeamId: string
): string {
  return `${nbaSnapshotCacheKey(apiBaseUrl, season)}|${homeTeamId}|${awayTeamId}`;
}

function reportFromPayload(
  payload: NbaMatchupRosterApiPayload,
  homeTeamId: string,
  awayTeamId: string
): NbaRosterReport | null {
  return buildMatchupRosterReport(
    homeTeamId,
    awayTeamId,
    payload.home,
    payload.away
  );
}

/**
 * 予想 ROSTER: Firestore のアクティブロスターを優先。
 * 未 ingest / 失敗時は null（呼び出し側でモックに落とさない想定）。
 */
export function useNbaMatchupRoster(options: Options): {
  roster: NbaRosterReport | null;
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
  const key = rosterCacheKey(apiBaseUrl, season, homeTeamId, awayTeamId);
  const peeked = want ? cache.peek(key) : null;
  const peekedRoster =
    peeked && homeTeamId && awayTeamId
      ? reportFromPayload(peeked, homeTeamId, awayTeamId)
      : null;
  const scopeKey = key;

  const [roster, setRoster] = useState<NbaRosterReport | null>(
    () => override ?? peekedRoster
  );
  const [source, setSource] = useState<
    "override" | "firestore" | "empty" | "error"
  >(() =>
    override
      ? "override"
      : peeked && (peeked.home || peeked.away)
        ? "firestore"
        : "empty"
  );
  const [readyScope, setReadyScope] = useState<string | null>(() =>
    override || peeked ? scopeKey : null
  );

  useEffect(() => {
    if (override) {
      setRoster(override);
      setSource("override");
      setReadyScope(scopeKey);
      return;
    }
    if (!enabled) {
      return;
    }
    if (!homeTeamId || !awayTeamId) {
      setRoster(null);
      setSource("empty");
      setReadyScope(scopeKey);
      return;
    }

    const hit = cache.peek(key);
    if (hit) {
      const built = reportFromPayload(hit, homeTeamId, awayTeamId);
      setRoster(built);
      setSource(built && (hit.home || hit.away) ? "firestore" : "empty");
      setReadyScope(scopeKey);
      return;
    }

    let cancelled = false;
    cache
      .load(key, () =>
        fetchMatchupRoster({
          homeTeamId,
          awayTeamId,
          season,
          apiBaseUrl,
        })
      )
      .then((payload) => {
        if (cancelled) return;
        const built = reportFromPayload(payload, homeTeamId, awayTeamId);
        setRoster(built);
        setSource(
          built && (payload.home || payload.away) ? "firestore" : "empty"
        );
      })
      .catch(() => {
        if (cancelled) return;
        setRoster(null);
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
    key,
    scopeKey,
  ]);

  const resolved = override ?? roster ?? peekedRoster;
  const loading = Boolean(want && !resolved && readyScope !== scopeKey);

  return { roster: resolved, loading, source };
}
