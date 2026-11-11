import { bdlNbaGetAllPages } from "@/lib/nba/bdl/bdlNbaFetch";

export type BdlMatchupRow = {
  game_id?: number;
  player_id?: number;
  opponent_player_id?: number;
  stats?: {
    matchup_seconds?: number | null;
    matchup_field_goals_made?: number | null;
    matchup_field_goals_attempted?: number | null;
  };
};

/** 1 試合の攻撃選手 × 守備選手。player_id が攻め、opponent_player_id が守り。 */
export function fetchBdlMatchupsForGame(gameId: number): Promise<BdlMatchupRow[]> {
  return bdlNbaGetAllPages<BdlMatchupRow>("/nba/v1/matchups", {
    "game_ids[]": [gameId],
  });
}
