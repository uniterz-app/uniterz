import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import type { NbaLeagueTeamStatsApiPayload } from "./leagueTeamStatsTypes";

export type FetchLeagueTeamStatsOptions = {
  /** Native: `getUniterzApiBaseUrl()`。Web クライアントは省略で同一オリジン */
  apiBaseUrl?: string | null;
  /**
   * 省略時はカレンダー今季。
   * null のときはシーズンを付けず、公開 API の表示季（今季が空なら前期）に任せる。
   */
  season?: string | null;
  signal?: AbortSignal;
};

function buildUrl(base: string, season: string | null): string {
  const root = base.replace(/\/$/, "");
  if (!season) return `${root}/api/nba/league-team-stats`;
  const qs = new URLSearchParams({ season });
  return `${root}/api/nba/league-team-stats?${qs.toString()}`;
}

/** 認証不要・共有スナップショット */
export async function fetchLeagueTeamStats(
  options: FetchLeagueTeamStatsOptions = {}
): Promise<NbaLeagueTeamStatsApiPayload> {
  const season =
    options.season === null
      ? null
      : (options.season ?? CURRENT_NBA_SEASON_KEY).trim();
  const base = (options.apiBaseUrl ?? "").trim();
  const path = season
    ? `/api/nba/league-team-stats?${new URLSearchParams({ season })}`
    : "/api/nba/league-team-stats";

  let res: Response;
  try {
    res = await fetch(base ? buildUrl(base, season) : path, {
      method: "GET",
      signal: options.signal,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "fetch failed";
    throw new Error(msg);
  }

  const data = (await res.json().catch(() => ({}))) as Partial<
    NbaLeagueTeamStatsApiPayload & { error?: string }
  >;

  if (!res.ok || !data.ok || !data.bundle) {
    throw new Error(
      data.error || res.statusText || `league team stats (${res.status})`
    );
  }

  return data as NbaLeagueTeamStatsApiPayload;
}
