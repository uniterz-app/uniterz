/**
 * BDL `/nba/v2/odds`（試合のマネーライン・合計）と `/nba/v2/odds/player_props`（選手プロップ）。
 * サーバー専用。今のラインだけ（終値の倉庫はない）。公開 API からは呼ばない。
 */
import { bdlNbaGetAllPages, bdlNbaGetJson, type BdlListResponse } from "@/lib/nba/bdl/bdlNbaFetch";

export type BdlBettingOdd = {
  id?: number;
  game_id?: number;
  vendor?: string | null;
  moneyline_home_odds?: number | null;
  moneyline_away_odds?: number | null;
  total_value?: string | number | null;
  total_over_odds?: number | null;
  total_under_odds?: number | null;
};

export type BdlPlayerProp = {
  id?: number;
  game_id?: number;
  player_id?: number;
  vendor?: string | null;
  prop_type?: string | null;
  line_value?: string | number | null;
  market?: { type?: string | null } | null;
};

export async function fetchBdlGameOdds(gameIds: readonly number[]): Promise<BdlBettingOdd[]> {
  if (gameIds.length === 0) return [];
  return bdlNbaGetAllPages<BdlBettingOdd>("/nba/v2/odds", {
    "game_ids[]": [...gameIds],
  });
}

/** 1 試合の選手プロップ。ページングなし。失敗しても空（キット作成を落とさない） */
export async function fetchBdlPlayerProps(input: {
  gameId: number;
  propType?: string;
}): Promise<BdlPlayerProp[]> {
  const res = await bdlNbaGetJson<BdlListResponse<BdlPlayerProp>>("/nba/v2/odds/player_props", {
    game_id: input.gameId,
    ...(input.propType ? { prop_type: input.propType } : {}),
  });
  return Array.isArray(res.data) ? res.data : [];
}
