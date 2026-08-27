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
import {
  forEachWithConcurrency,
  NBA_INGEST_CONCURRENCY,
} from "@/lib/async/forEachWithConcurrency";

export type BdlTeamContractRow = {
  id?: number;
  player_id?: number;
  season?: number;
  team_id?: number;
  cap_hit?: number | null;
  total_cash?: number | null;
  base_salary?: number | null;
  rank?: number | null;
  contract_type?: string | null;
  signed_using?: string | null;
  contract_status?: string | null;
  contract_notes?: unknown;
  option?: string | null;
  option_type?: string | null;
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

/**
 * 全 NBA チームの契約を seasonYear で取得。
 *
 * 30 クラブを直列 + sleep だと 1 年分で十数秒かかり、契約 ingest は
 * 複数年ぶん繰り返すためタイムアウトしていた。ワーカープールで詰める。
 */
export async function fetchBdlAllTeamContracts(
  seasonYear: number
): Promise<Map<string, BdlTeamContractRow[]>> {
  const byApp = new Map<string, BdlTeamContractRow[]>();
  const entries = Object.entries(BDL_TEAM_ID_BY_APP_ID);
  await forEachWithConcurrency(
    entries,
    NBA_INGEST_CONCURRENCY,
    async ([appId, bdlId]) => {
      byApp.set(appId, await fetchBdlContractsForTeam(bdlId, seasonYear));
    }
  );
  return byApp;
}
