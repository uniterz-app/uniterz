import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import type {
  NbaTeamInjuriesApiPayload,
  NbaTeamInjuryApiPayload,
} from "./teamInjuryTypes";

export type FetchTeamInjuriesOptions = {
  apiBaseUrl?: string | null;
  season?: string;
  signal?: AbortSignal;
};

function root(base: string | null | undefined): string {
  return (base ?? "").replace(/\/$/, "");
}

/** GET /api/nba/team-injuries?season= */
export async function fetchTeamInjuriesSnapshot(
  options: FetchTeamInjuriesOptions = {}
): Promise<NbaTeamInjuriesApiPayload> {
  const season = (options.season ?? CURRENT_NBA_SEASON_KEY).trim();
  const qs = new URLSearchParams({ season });
  const path = `/api/nba/team-injuries?${qs.toString()}`;
  const url = root(options.apiBaseUrl)
    ? `${root(options.apiBaseUrl)}${path}`
    : path;

  const res = await fetch(url, { method: "GET", signal: options.signal });
  const data = (await res.json().catch(() => ({}))) as Partial<
    NbaTeamInjuriesApiPayload & { error?: string }
  >;
  if (!res.ok || !data.ok || !data.bundle) {
    throw new Error(
      data.error || res.statusText || `team injuries (${res.status})`
    );
  }
  return data as NbaTeamInjuriesApiPayload;
}

/** GET /api/nba/team-injuries?season=&team= */
export async function fetchTeamInjuries(
  options: FetchTeamInjuriesOptions & { teamId: string }
): Promise<NbaTeamInjuryApiPayload> {
  const season = (options.season ?? CURRENT_NBA_SEASON_KEY).trim();
  const qs = new URLSearchParams({
    season,
    team: options.teamId,
  });
  const path = `/api/nba/team-injuries?${qs.toString()}`;
  const url = root(options.apiBaseUrl)
    ? `${root(options.apiBaseUrl)}${path}`
    : path;

  const res = await fetch(url, { method: "GET", signal: options.signal });
  const data = (await res.json().catch(() => ({}))) as Partial<
    NbaTeamInjuryApiPayload & { error?: string }
  >;
  if (!res.ok || !data.ok) {
    throw new Error(
      data.error || res.statusText || `team injuries (${res.status})`
    );
  }
  return data as NbaTeamInjuryApiPayload;
}
