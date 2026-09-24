/**
 * プレイヤー詳細 ROLE 用: 所属チームのロスター切片。
 * `/api/nba/team-rosters?team=` + 共有 TTL キャッシュ。
 */
"use client";

import { useEffect, useState } from "react";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import { fetchTeamRosterSlice } from "@/lib/nba/teamRosters/fetchTeamRostersClient";
import type { NbaRosterPlayer } from "@/lib/predict/nbaRoster";
import {
  createSnapshotFetchCache,
  NBA_SNAPSHOT_CACHE_TTL_MS,
  nbaSnapshotCacheKey,
} from "@/lib/nba/snapshotFetchCache";
import type { NbaTeamRosterSliceApiPayload } from "@/lib/nba/teamRosters/teamRosterTypes";

const cache = createSnapshotFetchCache<NbaTeamRosterSliceApiPayload>(
  NBA_SNAPSHOT_CACHE_TTL_MS
);

function cacheKey(
  apiBaseUrl: string | null | undefined,
  season: string,
  teamId: string
): string {
  return `${nbaSnapshotCacheKey(apiBaseUrl, season)}|rosterSlice|${teamId}`;
}

type Options = {
  teamId?: string | null;
  apiBaseUrl?: string | null;
  season?: string;
  enabled?: boolean;
};

export function useNbaTeamRosterSlice(options: Options): {
  players: NbaRosterPlayer[];
  loading: boolean;
} {
  const teamId = (options.teamId ?? "").trim();
  const season = (options.season ?? CURRENT_NBA_SEASON_KEY).trim();
  const apiBaseUrl = options.apiBaseUrl;
  const enabled = (options.enabled ?? true) && !!teamId;

  const [players, setPlayers] = useState<NbaRosterPlayer[]>([]);
  const [loading, setLoading] = useState(enabled);

  useEffect(() => {
    if (!enabled || !teamId) {
      setPlayers([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    const key = cacheKey(apiBaseUrl, season, teamId);

    void cache
      .load(key, () =>
        fetchTeamRosterSlice({ teamId, season, apiBaseUrl })
      )
      .then((payload) => {
        if (cancelled) return;
        setPlayers(payload.team?.players ?? []);
      })
      .catch(() => {
        if (cancelled) return;
        setPlayers([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, teamId, season, apiBaseUrl]);

  return { players, loading };
}
