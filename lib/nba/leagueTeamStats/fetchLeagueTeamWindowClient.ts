import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import type { NbaLeagueTeamStatRow } from "@/lib/predict/nbaLeagueTeamStatsMocks";
import {
  nbaStatsWindowId,
  type NbaStatsWindow,
} from "@/lib/nba/nbaStatsWindow";

export type LeagueTeamWindowPayload = {
  ok: true;
  season: string;
  window: string;
  rows: NbaLeagueTeamStatRow[];
};

type FetchLeagueTeamWindowOptions = {
  apiBaseUrl?: string | null;
  season?: string;
  window: NbaStatsWindow;
  signal?: AbortSignal;
};

export async function fetchLeagueTeamWindow(
  options: FetchLeagueTeamWindowOptions
): Promise<LeagueTeamWindowPayload> {
  if (options.window.kind === "season") {
    throw new Error("season window uses league-team-stats");
  }
  const season = (options.season ?? CURRENT_NBA_SEASON_KEY).trim();
  const qs = new URLSearchParams({
    season,
    window: nbaStatsWindowId(options.window),
  });
  const root = (options.apiBaseUrl ?? "").trim().replace(/\/$/, "");
  const path = `/api/nba/league-team-window?${qs.toString()}`;
  const res = await fetch(root ? `${root}${path}` : path, {
    method: "GET",
    signal: options.signal,
  });
  const data = (await res.json().catch(() => ({}))) as Partial<
    LeagueTeamWindowPayload & { error?: string }
  >;
  if (!res.ok || !data.ok || !Array.isArray(data.rows)) {
    throw new Error(
      data.error || res.statusText || `league team window (${res.status})`
    );
  }
  return data as LeagueTeamWindowPayload;
}
