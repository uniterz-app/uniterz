"use client";

import {
  createSnapshotFetchCache,
  NBA_SNAPSHOT_CACHE_TTL_MS,
} from "@/lib/nba/snapshotFetchCache";
import type { NbaLeagueTeamStatsApiPayload } from "@/lib/nba/leagueTeamStats/leagueTeamStatsTypes";

/**
 * リーグチーム表スナップショット。STATS ハブと予想 STATS タブで共有する。
 */
export const leagueTeamStatsSnapshotCache =
  createSnapshotFetchCache<NbaLeagueTeamStatsApiPayload>(
    NBA_SNAPSHOT_CACHE_TTL_MS
  );
