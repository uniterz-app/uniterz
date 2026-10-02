/**
 * BDL `/nba/v1/contracts/players` + `/aggregate` — 複数年契約。
 */
import {
  bdlNbaGetAllPages,
  bdlNbaGetJson,
  type BdlListResponse,
} from "@/lib/nba/bdl/bdlNbaFetch";
import {
  appTeamIdFromBdlTeamId,
  rememberBdlTeamId,
} from "@/lib/nba/bdl/bdlNbaTeamIdMap";
import type { BdlTeamContractRow } from "@/lib/nba/bdl/fetchBdlTeamContracts";

export type BdlPlayerContractRow = BdlTeamContractRow;

export type BdlPlayerContractAggregate = {
  id?: number;
  player_id?: number;
  start_year?: number;
  end_year?: number;
  contract_type?: string | null;
  contract_status?: string | null;
  contract_years?: number | null;
  total_value?: number | null;
  average_salary?: number | null;
  guaranteed_at_signing?: number | null;
  total_guaranteed?: number | null;
  signed_using?: string | null;
  free_agent_year?: number | null;
  free_agent_status?: string | null;
  contract_notes?: unknown;
  team_id?: number | null;
  player?: BdlTeamContractRow["player"];
  team?: BdlTeamContractRow["team"];
};

function rememberTeam(row: {
  team_id?: number | null;
  team?: { id?: number; abbreviation?: string } | null;
}): void {
  const tid = row.team?.id ?? row.team_id;
  const abbr = row.team?.abbreviation;
  if (typeof tid === "number") {
    rememberBdlTeamId(tid, abbr);
    if (!abbr) void appTeamIdFromBdlTeamId(tid);
  }
}

/** プレイヤーの年次契約行（season 降順想定）。seasons 省略で全履歴。 */
export async function fetchBdlPlayerContractSeasons(
  bdlPlayerId: number,
  seasonYears?: readonly number[]
): Promise<BdlPlayerContractRow[]> {
  const query: Record<string, string | number | ReadonlyArray<number>> = {
    player_id: bdlPlayerId,
    per_page: 100,
  };
  if (seasonYears && seasonYears.length > 0) {
    query["seasons[]"] = seasonYears;
  }
  const rows = await bdlNbaGetAllPages<BdlPlayerContractRow>(
    "/nba/v1/contracts/players",
    query
  );
  for (const row of rows) rememberTeam(row);
  return rows;
}

/** 複数年契約の aggregate（CURRENT / UPCOMING など複数あり得る） */
export async function fetchBdlPlayerContractAggregates(
  bdlPlayerId: number
): Promise<BdlPlayerContractAggregate[]> {
  const res = await bdlNbaGetJson<BdlListResponse<BdlPlayerContractAggregate>>(
    "/nba/v1/contracts/players/aggregate",
    { player_id: bdlPlayerId }
  );
  const rows = Array.isArray(res.data) ? res.data : [];
  for (const row of rows) rememberTeam(row);
  return rows;
}
