/**
 * BDL `/nba/v1/lineup_stats` — 試合中に同時に出ていた 5 人の得失点。
 * オン／オフはここから足す。シーズン平均の専用エンドポイントは無い。
 */
import { bdlNbaGetJson, type BdlListResponse } from "@/lib/nba/bdl/bdlNbaFetch";

export type BdlLineupStatRow = {
  id: number;
  game_id: number;
  team_id: number;
  player_ids: number[];
  stats: {
    min?: number | null;
    off_rating?: number | null;
    def_rating?: number | null;
    net_rating?: number | null;
    poss?: number | null;
  };
};

export async function fetchBdlLineupStats(input: {
  seasonYear: number;
  seasonType?: "regular" | "playoffs";
}): Promise<BdlLineupStatRow[]> {
  const out: BdlLineupStatRow[] = [];
  let cursor: number | undefined;
  for (let page = 0; page < 200; page++) {
    const body = await bdlNbaGetJson<BdlListResponse<BdlLineupStatRow>>("/nba/v1/lineup_stats", {
      "seasons[]": [input.seasonYear],
      season_type: input.seasonType ?? "regular",
      per_page: 100,
      ...(cursor != null ? { cursor } : {}),
    });
    const chunk = Array.isArray(body.data) ? body.data : [];
    out.push(...chunk);
    const next = body.meta?.next_cursor;
    if (next == null || chunk.length === 0) break;
    cursor = next;
  }
  return out;
}
