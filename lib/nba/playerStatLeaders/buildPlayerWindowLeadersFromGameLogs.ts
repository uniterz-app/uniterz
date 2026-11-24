/**
 * 選手試合ログから期間の Player Leaders。BDL なし。
 * box + 回数ボード + 試合ログから出る 4FCT / TS% / 得点内訳。
 */
import { nbaConferenceForTeam } from "@/lib/nba/nbaConferenceTeams";
import {
  filterLogsByWindow,
  type NbaStatsWindow,
} from "@/lib/nba/nbaStatsWindow";
import type { PlayerGameLogsForLeaders } from "@/lib/nba/playerStatLeaders/buildLast10LeadersFromGameLogs";
import {
  countPlayerSeasonStatMilestones,
  NBA_PLAYER_COUNT_LEADER_METRIC_IDS,
} from "@/lib/predict/nbaPlayerCountLeaderMetrics";
import type { NbaPlayerGameLog } from "@/lib/predict/nbaPlayerDetailPreviewMocks";
import {
  NBA_BDL_PLAYER_LEADER_STAT_TYPES,
  type NbaPlayerLeaderMetricId,
  type NbaPlayerStatLeaderRow,
} from "@/lib/predict/nbaPlayerStatLeadersMocks";
import {
  NBA_PLAYER_ADVANCED_LEADER_METRICS,
  playerAdvancedMetricDef,
} from "@/lib/predict/nbaPlayerStatLeadersAdvanced";

const LEADER_BOARD_LIMIT = 30;
const MIN_GAMES = 1;

type Agg = {
  playerId: string;
  playerName: string;
  teamId: string;
  gp: number;
  pts: number;
  reb: number;
  oreb: number;
  dreb: number;
  ast: number;
  stl: number;
  blk: number;
  tov: number;
  pf: number | null;
  min: number;
  fgm: number;
  fga: number;
  fg3m: number;
  fg3a: number;
  ftm: number;
  fta: number;
  plusMinus: number;
  effSum: number;
};

export function emptyPlayerWindowBoard(): Record<
  NbaPlayerLeaderMetricId,
  NbaPlayerStatLeaderRow[]
> {
  const board: Partial<
    Record<NbaPlayerLeaderMetricId, NbaPlayerStatLeaderRow[]>
  > = {};
  for (const id of NBA_BDL_PLAYER_LEADER_STAT_TYPES) board[id] = [];
  for (const m of NBA_PLAYER_ADVANCED_LEADER_METRICS) board[m.id] = [];
  for (const id of NBA_PLAYER_COUNT_LEADER_METRIC_IDS) board[id] = [];
  return board as Record<NbaPlayerLeaderMetricId, NbaPlayerStatLeaderRow[]>;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function aggregateLogs(
  player: PlayerGameLogsForLeaders,
  logs: readonly NbaPlayerGameLog[]
): Agg | null {
  if (logs.length < MIN_GAMES) return null;
  let pts = 0;
  let reb = 0;
  let oreb = 0;
  let dreb = 0;
  let ast = 0;
  let stl = 0;
  let blk = 0;
  let tov = 0;
  let pf = 0;
  let pfGames = 0;
  let min = 0;
  let fgm = 0;
  let fga = 0;
  let fg3m = 0;
  let fg3a = 0;
  let ftm = 0;
  let fta = 0;
  let plusMinus = 0;
  let effSum = 0;
  let hasOreb = false;
  let hasDreb = false;
  for (const g of logs) {
    pts += g.pts;
    reb += g.reb;
    if (typeof g.oreb === "number" && Number.isFinite(g.oreb)) {
      oreb += g.oreb;
      hasOreb = true;
    }
    if (typeof g.dreb === "number" && Number.isFinite(g.dreb)) {
      dreb += g.dreb;
      hasDreb = true;
    }
    ast += g.ast;
    stl += g.stl;
    blk += g.blk;
    tov += g.tov;
    if (typeof g.pf === "number" && Number.isFinite(g.pf)) {
      pf += g.pf;
      pfGames += 1;
    }
    min += g.min;
    fgm += g.fgm;
    fga += g.fga;
    fg3m += g.fg3m;
    fg3a += g.fg3a;
    ftm += g.ftm;
    fta += g.fta;
    plusMinus += g.plusMinus;
    const missedFg = Math.max(0, g.fga - g.fgm);
    const missedFt = Math.max(0, g.fta - g.ftm);
    effSum +=
      g.pts + g.reb + g.ast + g.stl + g.blk - g.tov - missedFg - missedFt;
  }
  return {
    playerId: player.playerId,
    playerName: player.playerName,
    teamId: player.teamId,
    gp: logs.length,
    pts,
    reb,
    oreb: hasOreb ? oreb : 0,
    dreb: hasDreb ? dreb : 0,
    ast,
    stl,
    blk,
    tov,
    pf: pfGames === logs.length ? pf : null,
    min,
    fgm,
    fga,
    fg3m,
    fg3a,
    ftm,
    fta,
    plusMinus,
    effSum,
  };
}

function toRow(agg: Agg, value: number): NbaPlayerStatLeaderRow {
  return {
    playerId: agg.playerId,
    playerName: agg.playerName,
    teamId: agg.teamId,
    conference: nbaConferenceForTeam(agg.teamId) ?? "west",
    gamesPlayed: agg.gp,
    value,
  };
}

function fillBoard(
  board: Record<NbaPlayerLeaderMetricId, NbaPlayerStatLeaderRow[]>,
  metric: NbaPlayerLeaderMetricId,
  rows: NbaPlayerStatLeaderRow[],
  higherIsBetter = true
): void {
  const sorted = [...rows].sort((a, b) =>
    higherIsBetter ? b.value - a.value : a.value - b.value
  );
  board[metric] = sorted.slice(0, LEADER_BOARD_LIMIT);
}

export function buildPlayerWindowLeadersFromGameLogs(
  players: readonly PlayerGameLogsForLeaders[],
  window: NbaStatsWindow
): Record<NbaPlayerLeaderMetricId, NbaPlayerStatLeaderRow[]> {
  const board = emptyPlayerWindowBoard();
  const aggs: Agg[] = [];
  const slicedByPlayer: Array<{
    player: PlayerGameLogsForLeaders;
    logs: NbaPlayerGameLog[];
  }> = [];
  for (const p of players) {
    const logs = filterLogsByWindow(p.gameLogs, window);
    slicedByPlayer.push({ player: p, logs });
    const agg = aggregateLogs(p, logs);
    if (agg) aggs.push(agg);
  }
  if (aggs.length === 0) return board;

  const perGame = (
    metric: NbaPlayerLeaderMetricId,
    pick: (a: Agg) => number,
    higherIsBetter = true
  ) => {
    fillBoard(
      board,
      metric,
      aggs.map((a) => toRow(a, round1(pick(a) / a.gp))),
      higherIsBetter
    );
  };

  perGame("pts", (a) => a.pts);
  perGame("reb", (a) => a.reb);
  if (aggs.some((a) => a.oreb > 0)) perGame("oreb", (a) => a.oreb);
  if (aggs.some((a) => a.dreb > 0)) perGame("dreb", (a) => a.dreb);
  perGame("ast", (a) => a.ast);
  perGame("stl", (a) => a.stl);
  perGame("blk", (a) => a.blk);
  perGame("tov", (a) => a.tov);
  const withPf = aggs.filter((a) => a.pf != null);
  if (withPf.length > 0) {
    fillBoard(
      board,
      "pf",
      withPf.map((a) => toRow(a, round1((a.pf as number) / a.gp)))
    );
  }
  perGame("min", (a) => a.min);
  perGame("fgm", (a) => a.fgm);
  perGame("fga", (a) => a.fga);
  perGame("fg3m", (a) => a.fg3m);
  perGame("fg3a", (a) => a.fg3a);
  perGame("ftm", (a) => a.ftm);
  perGame("fta", (a) => a.fta);
  perGame("eff", (a) => a.effSum);
  fillBoard(
    board,
    "plus_minus",
    aggs.map((a) => toRow(a, round1(a.plusMinus / a.gp))),
    playerAdvancedMetricDef("plus_minus").higherIsBetter
  );

  fillBoard(
    board,
    "fg_pct",
    aggs
      .filter((a) => a.fga >= Math.max(5, a.gp))
      .map((a) => toRow(a, round3(a.fgm / a.fga)))
  );
  fillBoard(
    board,
    "fg3_pct",
    aggs
      .filter((a) => a.fg3a >= Math.max(3, Math.ceil(a.gp * 0.5)))
      .map((a) => toRow(a, round3(a.fg3m / a.fg3a)))
  );
  fillBoard(
    board,
    "ft_pct",
    aggs
      .filter((a) => a.fta >= Math.max(3, Math.ceil(a.gp * 0.5)))
      .map((a) => toRow(a, round3(a.ftm / a.fta)))
  );

  const efgRows = aggs
    .filter((a) => a.fga >= Math.max(5, a.gp))
    .map((a) => toRow(a, round3((a.fgm + 0.5 * a.fg3m) / a.fga)));
  fillBoard(board, "efg_pct", efgRows, playerAdvancedMetricDef("efg_pct").higherIsBetter);

  const tsRows = aggs
    .filter((a) => a.fga + a.fta > 0 && a.pts > 0)
    .map((a) =>
      toRow(a, round3(a.pts / (2 * (a.fga + 0.44 * a.fta))))
    );
  fillBoard(board, "ts_pct", tsRows, playerAdvancedMetricDef("ts_pct").higherIsBetter);

  const ftrRows = aggs
    .filter((a) => a.fga >= Math.max(5, a.gp))
    .map((a) => toRow(a, round3(a.fta / a.fga)));
  fillBoard(
    board,
    "fta_rate",
    ftrRows,
    playerAdvancedMetricDef("fta_rate").higherIsBetter
  );

  const tovRows = aggs
    .filter(
      (a) =>
        a.tov > 0 &&
        a.fga + 0.44 * a.fta + a.tov >= Math.max(8, a.gp * 2)
    )
    .map((a) =>
      toRow(a, round3(a.tov / (a.fga + 0.44 * a.fta + a.tov)))
    );
  fillBoard(
    board,
    "tov_pct",
    tovRows,
    playerAdvancedMetricDef("tov_pct").higherIsBetter
  );

  const pts3Rows = aggs
    .filter((a) => a.fg3m > 0)
    .map((a) => toRow(a, round1((3 * a.fg3m) / a.gp)));
  fillBoard(board, "pts_3", pts3Rows);
  const pts2Rows = aggs
    .filter((a) => a.fgm > a.fg3m)
    .map((a) => toRow(a, round1((2 * (a.fgm - a.fg3m)) / a.gp)));
  fillBoard(board, "pts_2", pts2Rows);
  const ptsFtRows = aggs
    .filter((a) => a.ftm > 0)
    .map((a) => toRow(a, round1(a.ftm / a.gp)));
  fillBoard(board, "pts_ft", ptsFtRows);

  const share3 = aggs
    .filter((a) => a.pts > 0)
    .map((a) => toRow(a, round3((3 * a.fg3m) / a.pts)));
  fillBoard(board, "pct_pts_3", share3);
  const share2 = aggs
    .filter((a) => a.pts > 0 && a.fgm > a.fg3m)
    .map((a) => toRow(a, round3((2 * (a.fgm - a.fg3m)) / a.pts)));
  fillBoard(board, "pct_pts_2", share2);
  const shareFt = aggs
    .filter((a) => a.pts > 0)
    .map((a) => toRow(a, round3(a.ftm / a.pts)));
  fillBoard(board, "pct_pts_ft", shareFt);

  const astToRows = aggs
    .filter((a) => a.tov > 0)
    .map((a) => toRow(a, round3(a.ast / a.tov)));
  fillBoard(
    board,
    "ast_to",
    astToRows,
    playerAdvancedMetricDef("ast_to").higherIsBetter
  );

  for (const { player, logs } of slicedByPlayer) {
    if (logs.length < MIN_GAMES) continue;
    const counts = countPlayerSeasonStatMilestones(logs);
    const base = {
      playerId: player.playerId,
      playerName: player.playerName,
      teamId: player.teamId,
      conference: nbaConferenceForTeam(player.teamId) ?? "west",
      gamesPlayed: logs.length,
    };
    for (const id of NBA_PLAYER_COUNT_LEADER_METRIC_IDS) {
      const value = counts[id];
      if (value <= 0) continue;
      board[id].push({ ...base, value });
    }
  }
  for (const id of NBA_PLAYER_COUNT_LEADER_METRIC_IDS) {
    board[id] = board[id]
      .sort((a, b) => b.value - a.value || a.playerName.localeCompare(b.playerName))
      .slice(0, LEADER_BOARD_LIMIT);
  }

  return board;
}
