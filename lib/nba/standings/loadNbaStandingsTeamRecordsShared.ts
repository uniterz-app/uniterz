import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import type { MatchCardTeamRecord } from "@/lib/games/useMatchCardTeamRecords";
import {
  createSnapshotFetchCache,
  nbaSnapshotCacheKey,
  NBA_SNAPSHOT_CACHE_TTL_MS,
} from "@/lib/nba/snapshotFetchCache";
import { fetchNbaConferenceStandings } from "@/lib/nba/standings/fetchNbaConferenceStandingsClient";
import type { NbaConferenceStandingsApiPayload } from "@/lib/nba/standings/nbaConferenceStandingsTypes";
import { buildNbaStandingsTeamRecordMap } from "@/lib/nba/standings/buildNbaStandingsTeamRecordMap";

const cache = createSnapshotFetchCache<NbaConferenceStandingsApiPayload>(
  NBA_SNAPSHOT_CACHE_TTL_MS
);

export type LoadNbaStandingsTeamRecordsOptions = {
  apiBaseUrl?: string | null;
  season?: string;
  /** 省略時は全30チーム */
  teamIds?: readonly string[];
};

function pickTeamIds(
  full: Record<string, MatchCardTeamRecord>,
  teamIds: readonly string[] | undefined
): Record<string, MatchCardTeamRecord> {
  if (!teamIds?.length) return full;
  const out: Record<string, MatchCardTeamRecord> = {};
  for (const id of teamIds) {
    const row = full[id];
    if (row) out[id] = row;
  }
  return out;
}

/** `/api/nba/standings`（BDL ingest スナップショット）から W-L / rank を解決 */
export async function loadNbaStandingsTeamRecordsShared(
  options: LoadNbaStandingsTeamRecordsOptions = {}
): Promise<Record<string, MatchCardTeamRecord>> {
  const season = (options.season ?? CURRENT_NBA_SEASON_KEY).trim();
  const key = nbaSnapshotCacheKey(options.apiBaseUrl, season);
  const payload = await cache.load(key, () =>
    fetchNbaConferenceStandings({
      apiBaseUrl: options.apiBaseUrl,
      season,
    })
  );
  const full = buildNbaStandingsTeamRecordMap(payload.board);
  return pickTeamIds(full, options.teamIds);
}
