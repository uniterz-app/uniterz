/**
 * BDL `/nba/v2/stats/advanced` — 試合単位の選手 advanced（GOAT）。
 * live ingest が box と merge して games.liveStats に載せる。
 */
import { bdlNbaGetAllPages } from "@/lib/nba/bdl/bdlNbaFetch";

export type BdlGameAdvancedStatRow = {
  id?: number | null;
  period?: number | null;
  pie?: number | null;
  assist_percentage?: number | null;
  net_rating?: number | null;
  offensive_rating?: number | null;
  defensive_rating?: number | null;
  true_shooting_percentage?: number | null;
  effective_field_goal_percentage?: number | null;
  usage_percentage?: number | null;
  player?: { id?: number } | null;
  game?: { id?: number } | null;
};

export async function fetchBdlGameAdvancedStats(
  gameIds: readonly number[]
): Promise<BdlGameAdvancedStatRow[]> {
  const ids = [...new Set(gameIds.filter((id) => Number.isFinite(id) && id > 0))];
  if (ids.length === 0) return [];
  try {
    return await bdlNbaGetAllPages<BdlGameAdvancedStatRow>(
      "/nba/v2/stats/advanced",
      {
        "game_ids[]": ids,
        period: 0,
      }
    );
  } catch (e) {
    console.warn("[fetchBdlGameAdvancedStats] failed", e);
    return [];
  }
}
