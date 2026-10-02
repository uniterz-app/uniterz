import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import type { NbaPlayerCareerSeasonRow } from "@/lib/predict/nbaPlayerDetailPreviewMocks";

export type PlayerCareerSeasonsApiPayload = {
  ok: true;
  season: string;
  playerId: string;
  careerSeasons: {
    regular: NbaPlayerCareerSeasonRow[];
    playoffs: NbaPlayerCareerSeasonRow[];
  };
  source?: string;
  updatedAt: string | null;
};

export type FetchPlayerCareerSeasonsOptions = {
  playerId: string;
  apiBaseUrl?: string | null;
  season?: string;
  teamId?: string | null;
  position?: string | null;
  signal?: AbortSignal;
};

function root(base: string | null | undefined): string {
  return (base ?? "").replace(/\/$/, "");
}

/** GET /api/nba/player-career-seasons?playerId=&season= */
export async function fetchPlayerCareerSeasons(
  options: FetchPlayerCareerSeasonsOptions
): Promise<PlayerCareerSeasonsApiPayload> {
  const playerId = String(options.playerId ?? "").trim();
  const season = (options.season ?? CURRENT_NBA_SEASON_KEY).trim();
  const qs = new URLSearchParams({ season, playerId });
  const team = (options.teamId ?? "").trim();
  if (team) qs.set("team", team);
  const position = (options.position ?? "").trim();
  if (position) qs.set("position", position);

  const path = `/api/nba/player-career-seasons?${qs.toString()}`;
  const url = root(options.apiBaseUrl)
    ? `${root(options.apiBaseUrl)}${path}`
    : path;

  const res = await fetch(url, { method: "GET", signal: options.signal });
  const data = (await res.json().catch(() => ({}))) as Partial<
    PlayerCareerSeasonsApiPayload & { error?: string; ok?: boolean }
  >;
  if (!res.ok || data.ok !== true) {
    throw new Error(
      data.error || res.statusText || `player career seasons (${res.status})`
    );
  }
  return data as PlayerCareerSeasonsApiPayload;
}
