import {
  nbaStatsSnapshotCacheControl,
  type NbaStatsSnapshotSource,
} from "@/lib/nba/nbaStatsSnapshotCacheControl";
import type { NbaLeagueTeamStatsSnapshotSource } from "./leagueTeamStatsTypes";

export function leagueTeamStatsCacheControl(input: {
  source: NbaLeagueTeamStatsSnapshotSource | NbaStatsSnapshotSource;
  updatedAt: Date | null;
}): string {
  return nbaStatsSnapshotCacheControl(input);
}
