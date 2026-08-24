import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import type {
  NbaTeamPayrollApiPayload,
  NbaTeamPayrollsApiPayload,
} from "./teamPayrollTypes";

export type FetchTeamPayrollOptions = {
  apiBaseUrl?: string | null;
  season?: string;
  signal?: AbortSignal;
};

function root(base: string | null | undefined): string {
  return (base ?? "").replace(/\/$/, "");
}

/** GET /api/nba/team-payroll?season= */
export async function fetchTeamPayrollsSnapshot(
  options: FetchTeamPayrollOptions = {}
): Promise<NbaTeamPayrollsApiPayload> {
  const season = (options.season ?? CURRENT_NBA_SEASON_KEY).trim();
  const qs = new URLSearchParams({ season });
  const path = `/api/nba/team-payroll?${qs.toString()}`;
  const url = root(options.apiBaseUrl)
    ? `${root(options.apiBaseUrl)}${path}`
    : path;

  const res = await fetch(url, { method: "GET", signal: options.signal });
  const data = (await res.json().catch(() => ({}))) as Partial<
    NbaTeamPayrollsApiPayload & { error?: string }
  >;
  if (!res.ok || !data.ok || !data.bundle) {
    throw new Error(
      data.error || res.statusText || `team payrolls (${res.status})`
    );
  }
  return data as NbaTeamPayrollsApiPayload;
}

/** GET /api/nba/team-payroll?season=&team= */
export async function fetchTeamPayroll(
  options: FetchTeamPayrollOptions & { teamId: string }
): Promise<NbaTeamPayrollApiPayload> {
  const season = (options.season ?? CURRENT_NBA_SEASON_KEY).trim();
  const qs = new URLSearchParams({
    season,
    team: options.teamId,
  });
  const path = `/api/nba/team-payroll?${qs.toString()}`;
  const url = root(options.apiBaseUrl)
    ? `${root(options.apiBaseUrl)}${path}`
    : path;

  const res = await fetch(url, { method: "GET", signal: options.signal });
  const data = (await res.json().catch(() => ({}))) as Partial<
    NbaTeamPayrollApiPayload & { error?: string }
  >;
  if (!res.ok || !data.ok) {
    throw new Error(
      data.error || res.statusText || `team payroll (${res.status})`
    );
  }
  return data as NbaTeamPayrollApiPayload;
}
