import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import type { NbaTeamGameLogApiPayload } from "@/lib/nba/teamGameLog/teamGameLogTypes";

export type FetchTeamGameLogOptions = {
  apiBaseUrl?: string | null;
  season?: string;
  teamId: string;
  signal?: AbortSignal;
};

function root(base: string | null | undefined): string {
  return (base ?? "").replace(/\/$/, "");
}

/** GET /api/nba/team-game-log?season=&team= */
export async function fetchTeamGameLog(
  options: FetchTeamGameLogOptions
): Promise<NbaTeamGameLogApiPayload> {
  const season = (options.season ?? CURRENT_NBA_SEASON_KEY).trim();
  const team = options.teamId.trim();
  const qs = new URLSearchParams({ season, team });
  const path = `/api/nba/team-game-log?${qs.toString()}`;
  const url = root(options.apiBaseUrl)
    ? `${root(options.apiBaseUrl)}${path}`
    : path;

  const res = await fetch(url, { method: "GET", signal: options.signal });
  const data = (await res.json().catch(() => ({}))) as Partial<
    NbaTeamGameLogApiPayload & { error?: string }
  >;
  if (!res.ok || !data.ok || !data.log) {
    throw new Error(
      data.error || res.statusText || `team game log (${res.status})`
    );
  }
  return data as NbaTeamGameLogApiPayload;
}
