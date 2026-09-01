/**
 * GET /api/nba/team-ace-out-records — クライアント thin wrapper
 */
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import type { NbaTeamAceOutRecordsApiPayload } from "@/lib/nba/insights/loadAceOutRecordsApi";
import type { NbaTeamAceOutRecord } from "@/lib/nba/insights/aceOutRecordTypes";

export type FetchTeamAceOutOptions = {
  apiBaseUrl?: string | null;
  season?: string;
  teamId: string;
  signal?: AbortSignal;
};

function root(base: string | null | undefined): string {
  return (base ?? "").replace(/\/$/, "");
}

export async function fetchTeamAceOutRecord(
  options: FetchTeamAceOutOptions
): Promise<NbaTeamAceOutRecord | null> {
  const season = (options.season ?? CURRENT_NBA_SEASON_KEY).trim();
  const teamId = options.teamId.trim();
  if (!teamId) return null;

  const qs = new URLSearchParams({ season });
  const path = `/api/nba/team-ace-out-records?${qs.toString()}`;
  const url = root(options.apiBaseUrl)
    ? `${root(options.apiBaseUrl)}${path}`
    : path;

  const res = await fetch(url, { method: "GET", signal: options.signal });
  const data = (await res.json().catch(() => ({}))) as Partial<
    NbaTeamAceOutRecordsApiPayload & { ok?: boolean; error?: string }
  >;
  if (!res.ok || !data.ok || !Array.isArray(data.teams)) {
    throw new Error(
      data.error || res.statusText || `team ace-out records (${res.status})`
    );
  }
  const row = data.teams.find((t) => t.teamId === teamId);
  if (!row) return null;
  return row;
}
