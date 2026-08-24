import { bdlNbaGetAllPages } from "@/lib/nba/bdl/bdlNbaFetch";
import { rememberBdlTeamId } from "@/lib/nba/bdl/bdlNbaTeamIdMap";

export type BdlGameTeam = {
  id: number;
  abbreviation?: string;
  city?: string;
  name?: string;
  full_name?: string;
  conference?: string;
  division?: string;
};

/** BDL `season_type` クエリ。省略時は非プレシーズンのみ返る。 */
export type BdlGamesSeasonType =
  | "preseason"
  | "regular"
  | "ist"
  | "playin"
  | "playoffs";

export type BdlGame = {
  id: number;
  date?: string;
  season?: number;
  status?: string;
  status_state?: string | null;
  period?: number;
  time?: string | null;
  postseason?: boolean;
  postponed?: boolean;
  home_team_score?: number | null;
  visitor_team_score?: number | null;
  datetime?: string | null;
  ist_stage?: string | null;
  /** レスポンスに無い場合あり。ingest 側でクエリ種別を渡す */
  season_type?: BdlGamesSeasonType | string | null;
  home_team?: BdlGameTeam;
  visitor_team?: BdlGameTeam;
};

/**
 * BDL `/nba/v1/games` — `seasons[]` / `dates[]` は配列クエリ。
 * `season_type` 省略時はプレシーズン以外（OpenAPI 仕様）。
 */
export async function fetchBdlGames(input: {
  seasonYears?: ReadonlyArray<number>;
  dates?: ReadonlyArray<string>;
  postseason?: boolean;
  seasonType?: BdlGamesSeasonType;
}): Promise<BdlGame[]> {
  const query: Record<string, string | number | boolean | ReadonlyArray<string | number>> =
    {};
  if (input.seasonYears?.length) {
    query["seasons[]"] = [...input.seasonYears];
  }
  if (input.dates?.length) {
    query["dates[]"] = [...input.dates];
  }
  if (input.postseason != null) {
    query.postseason = input.postseason;
  }
  if (input.seasonType) {
    query.season_type = input.seasonType;
  }

  const rows = await bdlNbaGetAllPages<BdlGame>("/nba/v1/games", query);
  for (const g of rows) {
    if (g.home_team?.id != null) {
      rememberBdlTeamId(g.home_team.id, g.home_team.abbreviation);
    }
    if (g.visitor_team?.id != null) {
      rememberBdlTeamId(g.visitor_team.id, g.visitor_team.abbreviation);
    }
  }
  return rows;
}
