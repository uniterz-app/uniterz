import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import type { NbaPlayerContractSummary } from "@/lib/predict/nbaPlayerDetailPreviewMocks";

export type PlayerContractApiPayload = {
  ok: true;
  season: string;
  playerId: string;
  contract: NbaPlayerContractSummary | null;
  source?: string;
  updatedAt: string | null;
};

export type FetchPlayerContractOptions = {
  playerId: string;
  apiBaseUrl?: string | null;
  season?: string;
  teamId?: string | null;
  signal?: AbortSignal;
};

function root(base: string | null | undefined): string {
  return (base ?? "").replace(/\/$/, "");
}

/** GET /api/nba/player-contract?playerId=&season= */
export async function fetchPlayerContract(
  options: FetchPlayerContractOptions
): Promise<PlayerContractApiPayload> {
  const playerId = String(options.playerId ?? "").trim();
  const season = (options.season ?? CURRENT_NBA_SEASON_KEY).trim();
  const qs = new URLSearchParams({ season, playerId });
  const team = (options.teamId ?? "").trim();
  if (team) qs.set("team", team);

  const path = `/api/nba/player-contract?${qs.toString()}`;
  const url = root(options.apiBaseUrl)
    ? `${root(options.apiBaseUrl)}${path}`
    : path;

  const res = await fetch(url, { method: "GET", signal: options.signal });
  const data = (await res.json().catch(() => ({}))) as Partial<
    PlayerContractApiPayload & { error?: string; ok?: boolean }
  >;
  if (!res.ok || data.ok !== true) {
    throw new Error(
      data.error || res.statusText || `player contract (${res.status})`
    );
  }
  return data as PlayerContractApiPayload;
}
