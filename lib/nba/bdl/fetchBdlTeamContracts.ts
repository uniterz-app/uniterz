/**
 * BDL `/nba/v1/contracts/teams` — チーム別契約（cap hit）。
 * team_id 必須。30 クラブを順に取る。
 */
import { bdlNbaGetJson, type BdlListResponse } from "@/lib/nba/bdl/bdlNbaFetch";
import {
  BDL_TEAM_ID_BY_APP_ID,
  appTeamIdFromBdlTeamId,
  rememberBdlTeamId,
} from "@/lib/nba/bdl/bdlNbaTeamIdMap";

export type BdlTeamContractRow = {
  id?: number;
  player_id?: number;
  season?: number;
  team_id?: number;
  cap_hit?: number | null;
  total_cash?: number | null;
  base_salary?: number | null;
  rank?: number | null;
  player?: {
    id?: number;
    first_name?: string;
    last_name?: string;
    position?: string | null;
    jersey_number?: string | null;
  } | null;
  team?: {
    id?: number;
    abbreviation?: string;
    full_name?: string;
  } | null;
};

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function fetchBdlContractsForTeam(
  bdlTeamId: number,
  seasonYear: number
): Promise<BdlTeamContractRow[]> {
  const res = await bdlNbaGetJson<BdlListResponse<BdlTeamContractRow>>(
    "/nba/v1/contracts/teams",
    { team_id: bdlTeamId, season: seasonYear }
  );
  const rows = Array.isArray(res.data) ? res.data : [];
  for (const row of rows) {
    const abbr = row.team?.abbreviation;
    const tid = row.team?.id ?? row.team_id;
    if (typeof tid === "number" && abbr) rememberBdlTeamId(tid, abbr);
  }
  return rows;
}

/** 全 NBA チームの契約を seasonYear で取得 */
export async function fetchBdlAllTeamContracts(
  seasonYear: number
): Promise<Map<string, BdlTeamContractRow[]>> {
  const byApp = new Map<string, BdlTeamContractRow[]>();
  const entries = Object.entries(BDL_TEAM_ID_BY_APP_ID);
  for (let i = 0; i < entries.length; i += 1) {
    const [appId, bdlId] = entries[i]!;
    byApp.set(appId, await fetchBdlContractsForTeam(bdlId, seasonYear));
    if (i < entries.length - 1) await sleep(80);
  }
  return byApp;
}
