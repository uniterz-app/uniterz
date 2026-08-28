/**
 * GET /api/nba/team-season-records — チーム詳細 SPLITS 用の強弱スプリット。
 * 今季が空なら 0-0（前期フォールバックなし）。
 */
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import type { NbaTeamSeasonRecordsApiPayload } from "@/lib/nba/insights/loadTeamSeasonRecordsApi";

export type NbaTeamStrengthSplit = {
  vsOver500: { wins: number; losses: number };
  vsUnder500: { wins: number; losses: number };
};

export type FetchTeamStrengthSplitOptions = {
  apiBaseUrl?: string | null;
  season?: string;
  teamId: string;
  signal?: AbortSignal;
};

function root(base: string | null | undefined): string {
  return (base ?? "").replace(/\/$/, "");
}

function emptySplit(): NbaTeamStrengthSplit {
  return {
    vsOver500: { wins: 0, losses: 0 },
    vsUnder500: { wins: 0, losses: 0 },
  };
}

/** 公開 API から 1 チームの vs .500+ / sub-.500 を取る */
export async function fetchTeamStrengthSplit(
  options: FetchTeamStrengthSplitOptions
): Promise<NbaTeamStrengthSplit> {
  const season = (options.season ?? CURRENT_NBA_SEASON_KEY).trim();
  const teamId = options.teamId.trim();
  if (!teamId) return emptySplit();

  const qs = new URLSearchParams({ season });
  const path = `/api/nba/team-season-records?${qs.toString()}`;
  const url = root(options.apiBaseUrl)
    ? `${root(options.apiBaseUrl)}${path}`
    : path;

  const res = await fetch(url, { method: "GET", signal: options.signal });
  const data = (await res.json().catch(() => ({}))) as Partial<
    NbaTeamSeasonRecordsApiPayload & { ok?: boolean; error?: string }
  >;
  if (!res.ok || !data.ok || !Array.isArray(data.teams)) {
    throw new Error(
      data.error || res.statusText || `team season records (${res.status})`
    );
  }
  const row = data.teams.find((t) => t.teamId === teamId);
  if (!row) return emptySplit();
  return {
    vsOver500: {
      wins: row.vsOver500?.wins ?? 0,
      losses: row.vsOver500?.losses ?? 0,
    },
    vsUnder500: {
      wins: row.vsUnder500?.wins ?? 0,
      losses: row.vsUnder500?.losses ?? 0,
    },
  };
}
