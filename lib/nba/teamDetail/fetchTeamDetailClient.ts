/**
 * GET /api/nba/team-detail — クライアント thin wrapper + 短 TTL 共有キャッシュ。
 */
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import type { NbaTeamDetailApiPayload } from "@/lib/nba/teamDetail/loadTeamDetailBundle";
import {
  createSnapshotFetchCache,
  NBA_SNAPSHOT_CACHE_TTL_MS,
  nbaSnapshotCacheKey,
} from "@/lib/nba/snapshotFetchCache";

export type FetchTeamDetailOptions = {
  teamId: string;
  apiBaseUrl?: string | null;
  season?: string;
};

const cache = createSnapshotFetchCache<NbaTeamDetailApiPayload>(
  NBA_SNAPSHOT_CACHE_TTL_MS
);

function root(base: string | null | undefined): string {
  return (base ?? "").replace(/\/$/, "");
}

async function fetchOnce(
  options: FetchTeamDetailOptions
): Promise<NbaTeamDetailApiPayload> {
  const teamId = String(options.teamId ?? "").trim();
  const season = (options.season ?? CURRENT_NBA_SEASON_KEY).trim();
  const qs = new URLSearchParams({ season, team: teamId });
  const path = `/api/nba/team-detail?${qs.toString()}`;
  const url = root(options.apiBaseUrl)
    ? `${root(options.apiBaseUrl)}${path}`
    : path;

  const res = await fetch(url, { method: "GET" });
  const data = (await res.json().catch(() => ({}))) as Partial<
    NbaTeamDetailApiPayload & { error?: string }
  >;
  if (!res.ok || !data.ok) {
    throw new Error(
      data.error || res.statusText || `team detail (${res.status})`
    );
  }
  return data as NbaTeamDetailApiPayload;
}

/** 同一 team+season は 5 分共有（画面遷移・二重マウントの dedupe） */
export async function fetchTeamDetailBundle(
  options: FetchTeamDetailOptions
): Promise<NbaTeamDetailApiPayload> {
  const teamId = String(options.teamId ?? "").trim();
  const season = (options.season ?? CURRENT_NBA_SEASON_KEY).trim();
  if (!teamId) {
    throw new Error("teamId required");
  }
  const key = `${nbaSnapshotCacheKey(options.apiBaseUrl, season)}|${teamId}`;
  return cache.load(key, () => fetchOnce(options));
}
