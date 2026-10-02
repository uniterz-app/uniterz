import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import type { NbaPlayerDetailApiPayload } from "@/lib/nba/playerDetail/loadPlayerDetailBundle";

export type FetchPlayerDetailOptions = {
  playerId: string;
  apiBaseUrl?: string | null;
  season?: string;
  signal?: AbortSignal;
};

function root(base: string | null | undefined): string {
  return (base ?? "").replace(/\/$/, "");
}

/** GET /api/nba/player-detail?playerId=&season= */
export async function fetchPlayerDetailBundle(
  options: FetchPlayerDetailOptions
): Promise<NbaPlayerDetailApiPayload> {
  const playerId = String(options.playerId ?? "").trim();
  const season = (options.season ?? CURRENT_NBA_SEASON_KEY).trim();
  const qs = new URLSearchParams({ season, playerId });
  const path = `/api/nba/player-detail?${qs.toString()}`;
  const url = root(options.apiBaseUrl)
    ? `${root(options.apiBaseUrl)}${path}`
    : path;

  const res = await fetch(url, { method: "GET", signal: options.signal });
  const data = (await res.json().catch(() => ({}))) as Partial<
    NbaPlayerDetailApiPayload & { error?: string }
  >;
  if (!res.ok || !data.ok) {
    throw new Error(
      data.error || res.statusText || `player detail (${res.status})`
    );
  }
  return data as NbaPlayerDetailApiPayload;
}
