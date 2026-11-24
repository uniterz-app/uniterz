/**
 * チーム試合ログ明細から期間のリーグ表行。
 * スコアは常に。box / PAINT / FB があれば 4FCT・SHOOTING 以外の箱スタッツも。
 */
import { NBA_ALL_TEAM_IDS } from "@/lib/nba/teamGameLog/buildTeamGameLogsBundleFromGames";
import {
  aggregateLeagueTeamRowFromBoxGames,
  withDerivedTwoPointScoring,
  type LeagueTeamBoxGame,
} from "@/lib/nba/leagueTeamStats/aggregateLeagueTeamRowFromBoxes";
import {
  filterLogsByWindow,
  type NbaStatsWindow,
} from "@/lib/nba/nbaStatsWindow";
import type {
  NbaTeamGameLogBoxTotals,
  NbaTeamGameLogDetail,
} from "@/lib/nba/teamGameLog/teamGameLogDetail";
import type { NbaLeagueTeamStatRow } from "@/lib/predict/nbaLeagueTeamStatsMocks";

export type TeamWindowScoreGame = {
  dateLabel: string;
  startMs?: number;
  result: "W" | "L";
  teamScore: number;
  oppScore: number;
  box?: NbaTeamGameLogBoxTotals;
  oppBox?: NbaTeamGameLogBoxTotals;
  paint?: number;
  fb?: number;
  oppPaint?: number;
  oppFb?: number;
};

export type TeamWindowRowOptions = {
  /** シーズン pace。box が無いとき ORTG / DRTG の代理 */
  seasonPaceByTeamId?: ReadonlyMap<string, number> | Record<string, number>;
};

function paceFor(teamId: string, opts?: TeamWindowRowOptions): number {
  const map = opts?.seasonPaceByTeamId;
  if (!map) return 100;
  const raw =
    map instanceof Map ? map.get(teamId) : (map as Record<string, number>)[teamId];
  if (typeof raw === "number" && Number.isFinite(raw) && raw >= 80) return raw;
  return 100;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function toBoxGame(g: TeamWindowScoreGame): LeagueTeamBoxGame {
  return {
    teamScore: g.teamScore,
    oppScore: g.oppScore,
    result: g.result,
    box: g.box ?? null,
    oppBox: g.oppBox ?? null,
    paint: g.paint ?? null,
    fb: g.fb ?? null,
    oppPaint: g.oppPaint ?? null,
    oppFb: g.oppFb ?? null,
  };
}

export function teamWindowRowFromGames(
  games: readonly TeamWindowScoreGame[],
  window: NbaStatsWindow,
  teamId: string,
  opts?: TeamWindowRowOptions
): NbaLeagueTeamStatRow {
  const sliced = filterLogsByWindow(games, window);
  return aggregateLeagueTeamRowFromBoxGames({
    teamId,
    games: sliced.map(toBoxGame),
    seasonPace: paceFor(teamId, opts),
  });
}

export function teamWindowRowFromDetail(
  detail: NbaTeamGameLogDetail | null,
  window: NbaStatsWindow,
  teamId: string,
  opts?: TeamWindowRowOptions
): NbaLeagueTeamStatRow {
  return teamWindowRowFromGames(detail?.games ?? [], window, teamId, opts);
}

export function buildTeamWindowRowsFromDetails(
  details: ReadonlyMap<string, NbaTeamGameLogDetail | null>,
  window: NbaStatsWindow,
  opts?: TeamWindowRowOptions
): NbaLeagueTeamStatRow[] {
  return NBA_ALL_TEAM_IDS.map((teamId) =>
    teamWindowRowFromDetail(details.get(teamId) ?? null, window, teamId, opts)
  ).filter((row) => row.wins + row.losses > 0);
}

export function fillWindowRatingsFromSeasonPace(
  rows: readonly NbaLeagueTeamStatRow[],
  seasonRows: ReadonlyArray<{ teamId: string; pace?: number | null }>
): NbaLeagueTeamStatRow[] {
  const paceMap: Record<string, number> = {};
  for (const r of seasonRows) {
    if (typeof r.pace === "number" && Number.isFinite(r.pace) && r.pace >= 80) {
      paceMap[r.teamId] = r.pace;
    }
  }
  return rows.map((row) => {
    if (row.ortg >= 80 && row.drtg >= 80) {
      return withDerivedTwoPointScoring(row);
    }
    const pace = round1(paceFor(row.teamId, { seasonPaceByTeamId: paceMap }));
    const ortg = round1((row.ppg / pace) * 100);
    const drtg = round1((row.papg / pace) * 100);
    return withDerivedTwoPointScoring({
      ...row,
      pace,
      ortg,
      drtg,
      netrtg: round1(ortg - drtg),
    });
  });
}

export function buildTeamWindowRowsFromGameLists(
  gamesByTeam: ReadonlyMap<string, readonly TeamWindowScoreGame[]>,
  window: NbaStatsWindow,
  opts?: TeamWindowRowOptions
): NbaLeagueTeamStatRow[] {
  return NBA_ALL_TEAM_IDS.map((teamId) =>
    teamWindowRowFromGames(gamesByTeam.get(teamId) ?? [], window, teamId, opts)
  ).filter((row) => row.wins + row.losses > 0);
}
