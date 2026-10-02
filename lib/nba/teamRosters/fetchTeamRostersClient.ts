import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import type {
  NbaMatchupRosterApiPayload,
  NbaPlayerRosterHitApiPayload,
  NbaTeamRosterSliceApiPayload,
  NbaTeamRostersApiPayload,
} from "./teamRosterTypes";

export type FetchTeamRostersOptions = {
  apiBaseUrl?: string | null;
  season?: string;
  signal?: AbortSignal;
};

export type FetchMatchupRosterOptions = FetchTeamRostersOptions & {
  homeTeamId: string;
  awayTeamId: string;
};

function root(base: string | null | undefined): string {
  return (base ?? "").replace(/\/$/, "");
}

/** GET /api/nba/team-rosters?season= */
export async function fetchTeamRostersSnapshot(
  options: FetchTeamRostersOptions = {}
): Promise<NbaTeamRostersApiPayload> {
  const season = (options.season ?? CURRENT_NBA_SEASON_KEY).trim();
  const qs = new URLSearchParams({ season });
  const path = `/api/nba/team-rosters?${qs.toString()}`;
  const url = root(options.apiBaseUrl)
    ? `${root(options.apiBaseUrl)}${path}`
    : path;

  const res = await fetch(url, { method: "GET", signal: options.signal });
  const data = (await res.json().catch(() => ({}))) as Partial<
    NbaTeamRostersApiPayload & { error?: string }
  >;
  if (!res.ok || !data.ok || !data.bundle) {
    throw new Error(
      data.error || res.statusText || `team rosters (${res.status})`
    );
  }
  return data as NbaTeamRostersApiPayload;
}

/** GET /api/nba/team-rosters?season=&team= */
export async function fetchTeamRosterSlice(
  options: FetchTeamRostersOptions & { teamId: string }
): Promise<NbaTeamRosterSliceApiPayload> {
  const season = (options.season ?? CURRENT_NBA_SEASON_KEY).trim();
  const qs = new URLSearchParams({
    season,
    team: options.teamId,
  });
  const path = `/api/nba/team-rosters?${qs.toString()}`;
  const url = root(options.apiBaseUrl)
    ? `${root(options.apiBaseUrl)}${path}`
    : path;

  const res = await fetch(url, { method: "GET", signal: options.signal });
  const data = (await res.json().catch(() => ({}))) as Partial<
    NbaTeamRosterSliceApiPayload & { error?: string }
  >;
  if (!res.ok || !data.ok) {
    throw new Error(
      data.error || res.statusText || `team roster (${res.status})`
    );
  }
  return data as NbaTeamRosterSliceApiPayload;
}

/** GET /api/nba/team-rosters?season=&player= */
export async function fetchPlayerRosterHit(
  options: FetchTeamRostersOptions & { playerId: string }
): Promise<NbaPlayerRosterHitApiPayload> {
  const season = (options.season ?? CURRENT_NBA_SEASON_KEY).trim();
  const qs = new URLSearchParams({
    season,
    player: options.playerId,
  });
  const path = `/api/nba/team-rosters?${qs.toString()}`;
  const url = root(options.apiBaseUrl)
    ? `${root(options.apiBaseUrl)}${path}`
    : path;

  const res = await fetch(url, { method: "GET", signal: options.signal });
  const data = (await res.json().catch(() => ({}))) as Partial<
    NbaPlayerRosterHitApiPayload & { error?: string }
  >;
  if (!res.ok || !data.ok) {
    throw new Error(
      data.error || res.statusText || `player roster (${res.status})`
    );
  }
  return data as NbaPlayerRosterHitApiPayload;
}

/** GET /api/nba/team-rosters?season=&home=&away= */
export async function fetchMatchupRoster(
  options: FetchMatchupRosterOptions
): Promise<NbaMatchupRosterApiPayload> {
  const season = (options.season ?? CURRENT_NBA_SEASON_KEY).trim();
  const qs = new URLSearchParams({
    season,
    home: options.homeTeamId,
    away: options.awayTeamId,
  });
  const path = `/api/nba/team-rosters?${qs.toString()}`;
  const url = root(options.apiBaseUrl)
    ? `${root(options.apiBaseUrl)}${path}`
    : path;

  const res = await fetch(url, { method: "GET", signal: options.signal });
  const data = (await res.json().catch(() => ({}))) as Partial<
    NbaMatchupRosterApiPayload & { error?: string }
  >;
  if (!res.ok || !data.ok) {
    throw new Error(
      data.error || res.statusText || `matchup roster (${res.status})`
    );
  }
  return data as NbaMatchupRosterApiPayload;
}
