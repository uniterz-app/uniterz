/**
 * BDL `/nba/v1/player_injuries` — 全ページ取得。
 * team id は player.team から記憶する。
 */
import { bdlNbaGetAllPages } from "@/lib/nba/bdl/bdlNbaFetch";
import {
  appTeamIdFromBdlAbbreviation,
  appTeamIdFromBdlTeamId,
  rememberBdlTeamId,
} from "@/lib/nba/bdl/bdlNbaTeamIdMap";

export type BdlPlayerInjuryRow = {
  player?: {
    id?: number;
    first_name?: string;
    last_name?: string;
    position?: string | null;
    jersey_number?: string | null;
    /** 新 API は team オブジェクトではなく team_id のみのことが多い */
    team_id?: number | null;
    team?: {
      id?: number;
      abbreviation?: string;
      full_name?: string;
    } | null;
  } | null;
  status?: string | null;
  return_date?: string | null;
  description?: string | null;
};

/** 全 injured players（Available は mapper 側で除外） */
export async function fetchBdlPlayerInjuries(): Promise<BdlPlayerInjuryRow[]> {
  const rows = await bdlNbaGetAllPages<BdlPlayerInjuryRow>(
    "/nba/v1/player_injuries"
  );
  for (const row of rows) {
    const team = row.player?.team;
    if (team?.id != null && team.abbreviation) {
      rememberBdlTeamId(team.id, team.abbreviation);
    }
  }
  return rows;
}

export function appTeamIdFromBdlInjuryRow(
  row: BdlPlayerInjuryRow
): string | null {
  const team = row.player?.team;
  if (team?.id != null && team.abbreviation) {
    return (
      rememberBdlTeamId(team.id, team.abbreviation) ??
      appTeamIdFromBdlAbbreviation(team.abbreviation)
    );
  }
  if (team?.abbreviation) {
    return appTeamIdFromBdlAbbreviation(team.abbreviation);
  }
  const teamId = row.player?.team_id ?? team?.id;
  if (typeof teamId === "number" && Number.isFinite(teamId)) {
    return appTeamIdFromBdlTeamId(teamId);
  }
  return null;
}
