/**
 * BDL `/nba/v1/shot_charts`（試合終了後、FGA 1 本 = 1 行。GOAT 以上）。サーバー専用。
 * プレシーズンは返らない。
 */
import { bdlNbaGetAllPages } from "@/lib/nba/bdl/bdlNbaFetch";

export type BdlShotChartRow = {
  id?: number;
  game_id?: number;
  player_id?: number;
  team_id?: number;
  season?: number;
  season_type?: string | null;
  period?: number | null;
  clock?: string | null;
  made?: boolean | null;
  shot_value?: number | null;
  shot_type?: string | null;
  shot_distance?: number | null;
  coordinate_x?: number | null;
  coordinate_y?: number | null;
  shot_zone_basic?: string | null;
  shot_zone_area?: string | null;
  shot_zone_range?: string | null;
};

export async function fetchBdlShotChartsForGame(gameId: number): Promise<BdlShotChartRow[]> {
  return bdlNbaGetAllPages<BdlShotChartRow>("/nba/v1/shot_charts", {
    "game_ids[]": [gameId],
  });
}
