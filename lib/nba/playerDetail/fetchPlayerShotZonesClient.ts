import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import type { NbaPlayerShotZone } from "@/lib/predict/nbaPlayerDetailPreviewMocks";

export type PlayerShotZonesApiPayload = {
  ok: true;
  season: string;
  playerId: string;
  shotZones: NbaPlayerShotZone[];
  source?: string;
  updatedAt: string | null;
};

export type FetchPlayerShotZonesOptions = {
  playerId: string;
  apiBaseUrl?: string | null;
  season?: string;
  teamId?: string | null;
  signal?: AbortSignal;
};

function root(base: string | null | undefined): string {
  return (base ?? "").replace(/\/$/, "");
}

/** GET /api/nba/player-shot-zones?playerId=&season= */
export async function fetchPlayerShotZones(
  options: FetchPlayerShotZonesOptions
): Promise<PlayerShotZonesApiPayload> {
  const playerId = String(options.playerId ?? "").trim();
  const season = (options.season ?? CURRENT_NBA_SEASON_KEY).trim();
  const qs = new URLSearchParams({ season, playerId });
  const team = (options.teamId ?? "").trim();
  if (team) qs.set("team", team);

  const path = `/api/nba/player-shot-zones?${qs.toString()}`;
  const url = root(options.apiBaseUrl)
    ? `${root(options.apiBaseUrl)}${path}`
    : path;

  const res = await fetch(url, { method: "GET", signal: options.signal });
  const data = (await res.json().catch(() => ({}))) as Partial<
    PlayerShotZonesApiPayload & { error?: string; ok?: boolean }
  >;
  if (!res.ok || data.ok !== true) {
    throw new Error(
      data.error || res.statusText || `player shot zones (${res.status})`
    );
  }
  return data as PlayerShotZonesApiPayload;
}
