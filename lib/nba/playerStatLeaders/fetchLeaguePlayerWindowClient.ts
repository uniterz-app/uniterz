import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import {
  nbaStatsWindowId,
  type NbaStatsWindow,
} from "@/lib/nba/nbaStatsWindow";
import type {
  NbaPlayerLeaderMetricId,
  NbaPlayerStatLeaderRow,
} from "@/lib/predict/nbaPlayerStatLeadersMocks";

export type LeaguePlayerWindowPayload = {
  ok: true;
  season: string;
  window: string;
  board: Record<NbaPlayerLeaderMetricId, NbaPlayerStatLeaderRow[]>;
};

type FetchLeaguePlayerWindowOptions = {
  apiBaseUrl?: string | null;
  season?: string;
  window: NbaStatsWindow;
  signal?: AbortSignal;
};

export async function fetchLeaguePlayerWindow(
  options: FetchLeaguePlayerWindowOptions
): Promise<LeaguePlayerWindowPayload> {
  if (options.window.kind === "season") {
    throw new Error("season window uses league-player-stats");
  }
  const season = (options.season ?? CURRENT_NBA_SEASON_KEY).trim();
  const qs = new URLSearchParams({
    season,
    window: nbaStatsWindowId(options.window),
  });
  const root = (options.apiBaseUrl ?? "").trim().replace(/\/$/, "");
  const path = `/api/nba/league-player-window?${qs.toString()}`;
  const res = await fetch(root ? `${root}${path}` : path, {
    method: "GET",
    signal: options.signal,
  });
  const data = (await res.json().catch(() => ({}))) as Partial<
    LeaguePlayerWindowPayload & { error?: string }
  >;
  if (!res.ok || !data.ok || !data.board || typeof data.board !== "object") {
    throw new Error(
      data.error || res.statusText || `league player window (${res.status})`
    );
  }
  return data as LeaguePlayerWindowPayload;
}
