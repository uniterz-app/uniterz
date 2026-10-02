import { nbaStatsSnapshotCacheControl } from "@/lib/nba/nbaStatsSnapshotCacheControl";
import type { NbaPlayerStatLeadersSnapshotSource } from "./playerStatLeadersTypes";

export function playerStatLeadersCacheControl(input: {
  source: NbaPlayerStatLeadersSnapshotSource;
  updatedAt: Date | null;
}): string {
  return nbaStatsSnapshotCacheControl(input);
}
