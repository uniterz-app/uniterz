/**
 * GET /api/nba/matchup-detail — クライアント + 共有 TTL キャッシュ。
 */
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import type { NbaMatchupDetailApiPayload } from "@/lib/nba/predict/loadMatchupDetailBundle";
import {
  createSnapshotFetchCache,
  NBA_SNAPSHOT_CACHE_TTL_MS,
  nbaSnapshotCacheKey,
} from "@/lib/nba/snapshotFetchCache";

export type FetchMatchupDetailOptions = {
  homeTeamId: string;
  awayTeamId: string;
  apiBaseUrl?: string | null;
  season?: string;
};

const cache = createSnapshotFetchCache<NbaMatchupDetailApiPayload>(
  NBA_SNAPSHOT_CACHE_TTL_MS
);

function root(base: string | null | undefined): string {
  return (base ?? "").replace(/\/$/, "");
}

/** 空ロスターを sticky キャッシュしない（シーズン切替直後の空レスポンス毒化防止） */
function matchupDetailHasRosterPlayers(
  payload: NbaMatchupDetailApiPayload
): boolean {
  return (
    (payload.rosterHome?.players?.length ?? 0) > 0 ||
    (payload.rosterAway?.players?.length ?? 0) > 0
  );
}

export function matchupDetailCacheKey(
  apiBaseUrl: string | null | undefined,
  season: string,
  homeTeamId: string,
  awayTeamId: string
): string {
  return `${nbaSnapshotCacheKey(apiBaseUrl, season)}|${homeTeamId}|${awayTeamId}`;
}

async function fetchOnce(
  options: FetchMatchupDetailOptions
): Promise<NbaMatchupDetailApiPayload> {
  const homeTeamId = String(options.homeTeamId ?? "").trim();
  const awayTeamId = String(options.awayTeamId ?? "").trim();
  const season = (options.season ?? CURRENT_NBA_SEASON_KEY).trim();
  const qs = new URLSearchParams({
    season,
    home: homeTeamId,
    away: awayTeamId,
  });
  const path = `/api/nba/matchup-detail?${qs.toString()}`;
  const url = root(options.apiBaseUrl)
    ? `${root(options.apiBaseUrl)}${path}`
    : path;

  const res = await fetch(url, { method: "GET" });
  const data = (await res.json().catch(() => ({}))) as Partial<
    NbaMatchupDetailApiPayload & { error?: string }
  >;
  if (!res.ok || !data.ok) {
    throw new Error(
      data.error || res.statusText || `matchup detail (${res.status})`
    );
  }
  return data as NbaMatchupDetailApiPayload;
}

export async function fetchMatchupDetailBundle(
  options: FetchMatchupDetailOptions
): Promise<NbaMatchupDetailApiPayload> {
  const homeTeamId = String(options.homeTeamId ?? "").trim();
  const awayTeamId = String(options.awayTeamId ?? "").trim();
  const season = (options.season ?? CURRENT_NBA_SEASON_KEY).trim();
  if (!homeTeamId || !awayTeamId) {
    throw new Error("home and away required");
  }
  const key = matchupDetailCacheKey(
    options.apiBaseUrl,
    season,
    homeTeamId,
    awayTeamId
  );
  const existing = cache.peek(key);
  if (existing && !matchupDetailHasRosterPlayers(existing)) {
    cache.invalidate(key);
  }
  const value = await cache.load(key, () => fetchOnce(options));
  if (!matchupDetailHasRosterPlayers(value)) {
    cache.invalidate(key);
  }
  return value;
}

export function peekMatchupDetailBundle(
  options: FetchMatchupDetailOptions
): NbaMatchupDetailApiPayload | null {
  const homeTeamId = String(options.homeTeamId ?? "").trim();
  const awayTeamId = String(options.awayTeamId ?? "").trim();
  const season = (options.season ?? CURRENT_NBA_SEASON_KEY).trim();
  if (!homeTeamId || !awayTeamId) return null;
  const hit = cache.peek(
    matchupDetailCacheKey(
      options.apiBaseUrl,
      season,
      homeTeamId,
      awayTeamId
    )
  );
  if (hit && !matchupDetailHasRosterPlayers(hit)) return null;
  return hit;
}
