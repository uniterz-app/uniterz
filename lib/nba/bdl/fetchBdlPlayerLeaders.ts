import { bdlNbaGetAllPages } from "@/lib/nba/bdl/bdlNbaFetch";
import {
  appTeamIdFromBdlTeamId,
  rememberBdlTeamId,
} from "@/lib/nba/bdl/bdlNbaTeamIdMap";
import type { NbaPlayerLeaderBdlStatType } from "@/lib/predict/nbaPlayerStatLeadersMocks";

export type BdlLeaderRow = {
  player: {
    id: number;
    first_name?: string;
    last_name?: string;
    team_id?: number;
    team?: {
      id?: number;
      abbreviation?: string;
      conference?: string;
    };
  };
  value: number;
  stat_type?: string;
  rank?: number;
  season?: number;
  games_played?: number;
};

export async function fetchBdlPlayerLeaders(input: {
  seasonYear: number;
  statType: NbaPlayerLeaderBdlStatType;
}): Promise<BdlLeaderRow[]> {
  let rows: BdlLeaderRow[];
  try {
    rows = await bdlNbaGetAllPages<BdlLeaderRow>(`/nba/v1/leaders`, {
      season: input.seasonYear,
      season_type: "regular",
      stat_type: input.statType,
    });
  } catch {
    rows = await bdlNbaGetAllPages<BdlLeaderRow>(`/v1/leaders`, {
      season: input.seasonYear,
      season_type: "regular",
      stat_type: input.statType,
    });
  }
  for (const row of rows) {
    const team = row.player?.team;
    if (team?.id != null) {
      rememberBdlTeamId(team.id, team.abbreviation);
    }
  }
  return rows;
}

export function resolveLeaderTeamId(row: BdlLeaderRow): string | null {
  const team = row.player?.team;
  if (team?.id != null) {
    const fromTeam = rememberBdlTeamId(team.id, team.abbreviation);
    if (fromTeam) return fromTeam;
  }
  const tid = row.player?.team_id;
  if (typeof tid === "number") return appTeamIdFromBdlTeamId(tid);
  return null;
}
