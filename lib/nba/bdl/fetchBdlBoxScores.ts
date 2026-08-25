/**
 * BDL `/nba/v1/box_scores` / `/nba/v1/box_scores/live`
 * GOAT（または Box Scores 付き）プラン前提。
 */
import { bdlNbaGetJson, type BdlListResponse } from "@/lib/nba/bdl/bdlNbaFetch";
import type { BdlGameTeam } from "@/lib/nba/bdl/fetchBdlGames";
import { rememberBdlTeamId } from "@/lib/nba/bdl/bdlNbaTeamIdMap";

export type BdlBoxScorePlayerStat = {
  min?: string | number | null;
  fgm?: number | null;
  fga?: number | null;
  fg_pct?: number | null;
  fg3m?: number | null;
  fg3a?: number | null;
  fg3_pct?: number | null;
  ftm?: number | null;
  fta?: number | null;
  ft_pct?: number | null;
  oreb?: number | null;
  dreb?: number | null;
  reb?: number | null;
  ast?: number | null;
  stl?: number | null;
  blk?: number | null;
  turnover?: number | null;
  pf?: number | null;
  pts?: number | null;
  plus_minus?: number | string | null;
  player?: {
    id?: number;
    first_name?: string;
    last_name?: string;
    position?: string;
    jersey_number?: string | number | null;
  } | null;
};

/** フラット形（docs）と nested `{ team, players }`（OpenAPI）の両方 */
export type BdlBoxScoreTeamBlock =
  | (Partial<BdlGameTeam> & {
      players?: BdlBoxScorePlayerStat[] | null;
      team?: BdlGameTeam | null;
    })
  | null;

export type BdlBoxScore = {
  id?: number | null;
  date?: string | null;
  season?: number | null;
  status?: string | null;
  status_state?: string | null;
  period?: number | null;
  time?: string | null;
  postseason?: boolean | null;
  home_team_score?: number | null;
  visitor_team_score?: number | null;
  home_team?: BdlBoxScoreTeamBlock;
  visitor_team?: BdlBoxScoreTeamBlock;
};

export function bdlBoxScoreTeamInfo(
  block: BdlBoxScoreTeamBlock | undefined
): BdlGameTeam | null {
  if (!block) return null;
  if (block.team && typeof block.team === "object") return block.team;
  if (block.id != null) {
    return {
      id: block.id,
      abbreviation: block.abbreviation,
      city: block.city,
      name: block.name,
      full_name: block.full_name,
      conference: block.conference,
      division: block.division,
    };
  }
  return null;
}

export function bdlBoxScorePlayers(
  block: BdlBoxScoreTeamBlock | undefined
): BdlBoxScorePlayerStat[] {
  if (!block?.players || !Array.isArray(block.players)) return [];
  return block.players;
}

function rememberTeams(rows: BdlBoxScore[]): void {
  for (const row of rows) {
    const home = bdlBoxScoreTeamInfo(row.home_team);
    const away = bdlBoxScoreTeamInfo(row.visitor_team);
    if (home?.id != null) rememberBdlTeamId(home.id, home.abbreviation);
    if (away?.id != null) rememberBdlTeamId(away.id, away.abbreviation);
  }
}

/** 当日のライブ更新ボックス（試合が無ければ空） */
export async function fetchBdlLiveBoxScores(): Promise<BdlBoxScore[]> {
  const res = await bdlNbaGetJson<BdlListResponse<BdlBoxScore>>(
    "/nba/v1/box_scores/live"
  );
  const rows = Array.isArray(res.data) ? res.data : [];
  rememberTeams(rows);
  return rows;
}

/** 特定日のボックス（YYYY-MM-DD） */
export async function fetchBdlBoxScoresForDate(
  date: string
): Promise<BdlBoxScore[]> {
  const day = date.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    throw new Error(`invalid box score date: ${date}`);
  }
  const res = await bdlNbaGetJson<BdlListResponse<BdlBoxScore>>(
    "/nba/v1/box_scores",
    { date: day }
  );
  const rows = Array.isArray(res.data) ? res.data : [];
  rememberTeams(rows);
  return rows;
}
