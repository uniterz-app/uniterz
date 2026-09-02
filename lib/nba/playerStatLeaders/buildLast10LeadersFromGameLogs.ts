/**
 * Firestore `nbaPlayerGameLogs` → Player Leaders の last10 ボード。
 * BDL 追加呼び出しなし（ingest 済みログの集計のみ）。
 *
 * 出せる指標: box score 系（pts/reb/ast…・FG%/3P%/FT%・EFF・OREB/DREB）。
 * Advanced はログに無いので空のまま。
 */
import type { Firestore } from "firebase-admin/firestore";
import { nbaConferenceForTeam } from "@/lib/nba/nbaConferenceTeams";
import {
  NBA_PLAYER_GAME_LOGS_COLLECTION,
  NBA_PLAYER_GAME_LOGS_PLAYERS_SUB,
} from "@/lib/nba/playerGameLogs/playerGameLogsTypes";
import { loadTeamRostersSnapshot } from "@/lib/nba/teamRosters/loadTeamRostersSnapshot";
import { playerCardName } from "@/lib/predict/nbaRoster";
import type { NbaPlayerGameLog } from "@/lib/predict/nbaPlayerDetailPreviewMocks";
import {
  NBA_BDL_PLAYER_LEADER_STAT_TYPES,
  type NbaPlayerLeaderMetricId,
  type NbaPlayerStatLeaderRow,
} from "@/lib/predict/nbaPlayerStatLeadersMocks";
import { NBA_PLAYER_ADVANCED_LEADER_METRICS } from "@/lib/predict/nbaPlayerStatLeadersAdvanced";

const LAST10_WINDOW = 10;
const LEADER_BOARD_LIMIT = 30;
/** ノイズ抑制。開幕直後は 1 でも載せる */
const MIN_GAMES = 1;

export type PlayerGameLogsForLeaders = {
  playerId: string;
  playerName: string;
  teamId: string;
  gameLogs: NbaPlayerGameLog[];
};

function emptyBoard(): Record<NbaPlayerLeaderMetricId, NbaPlayerStatLeaderRow[]> {
  const board: Partial<
    Record<NbaPlayerLeaderMetricId, NbaPlayerStatLeaderRow[]>
  > = {};
  for (const id of NBA_BDL_PLAYER_LEADER_STAT_TYPES) board[id] = [];
  for (const m of NBA_PLAYER_ADVANCED_LEADER_METRICS) board[m.id] = [];
  return board as Record<NbaPlayerLeaderMetricId, NbaPlayerStatLeaderRow[]>;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function resolveGameLogs(raw: unknown): NbaPlayerGameLog[] {
  if (!Array.isArray(raw)) return [];
  const out: NbaPlayerGameLog[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as NbaPlayerGameLog;
    if (!row.gameId) continue;
    out.push(row);
  }
  return out;
}

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
  min: number;
  fgm: number;
  fga: number;
  fg3m: number;
  fg3a: number;
  ftm: number;
  fta: number;
  /** classic EFF numerator sum */
  effSum: number;
};

function aggregateLast10(
  player: PlayerGameLogsForLeaders
): Agg | null {
  const slice = player.gameLogs.slice(0, LAST10_WINDOW);
  if (slice.length < MIN_GAMES) return null;

  let pts = 0;
  let reb = 0;
  let oreb = 0;
  let dreb = 0;
  let ast = 0;
  let stl = 0;
  let blk = 0;
  let tov = 0;
  let min = 0;
  let fgm = 0;
  let fga = 0;
  let fg3m = 0;
  let fg3a = 0;
  let ftm = 0;
  let fta = 0;
  let effSum = 0;

  let hasOreb = false;
  let hasDreb = false;

  for (const g of slice) {
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
    min += g.min;
    fgm += g.fgm;
    fga += g.fga;
    fg3m += g.fg3m;
    fg3a += g.fg3a;
    ftm += g.ftm;
    fta += g.fta;
    const missedFg = Math.max(0, g.fga - g.fgm);
    const missedFt = Math.max(0, g.fta - g.ftm);
    effSum +=
      g.pts + g.reb + g.ast + g.stl + g.blk - g.tov - missedFg - missedFt;
  }

  return {
    playerId: player.playerId,
    playerName: player.playerName,
    teamId: player.teamId,
    gp: slice.length,
    pts,
    reb,
    oreb: hasOreb ? oreb : 0,
    dreb: hasDreb ? dreb : 0,
    ast,
    stl,
    blk,
    tov,
    min,
    fgm,
    fga,
    fg3m,
    fg3a,
    ftm,
    fta,
    effSum,
  };
}

function toRow(
  agg: Agg,
  value: number
): NbaPlayerStatLeaderRow {
  const conference = nbaConferenceForTeam(agg.teamId) ?? "west";
  return {
    playerId: agg.playerId,
    playerName: agg.playerName,
    teamId: agg.teamId,
    conference,
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

/**
 * メモリ上のプレイヤー試合ログから last10 リーダーボードを構築。
 */
export function buildLast10LeadersFromGameLogs(
  players: PlayerGameLogsForLeaders[]
): Record<NbaPlayerLeaderMetricId, NbaPlayerStatLeaderRow[]> {
  const board = emptyBoard();
  const aggs: Agg[] = [];
  for (const p of players) {
    const agg = aggregateLast10(p);
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
  perGame("tov", (a) => a.tov, false);
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

  // advanced — ログに無いので空
  return board;
}

export async function listPlayerGameLogsForLeaders(
  db: Firestore,
  seasonKey: string
): Promise<PlayerGameLogsForLeaders[]> {
  const season = seasonKey.trim();
  const [logsSnap, rosters] = await Promise.all([
    db
      .collection(NBA_PLAYER_GAME_LOGS_COLLECTION)
      .doc(season)
      .collection(NBA_PLAYER_GAME_LOGS_PLAYERS_SUB)
      .get(),
    loadTeamRostersSnapshot(db, season),
  ]);

  const nameById = new Map<string, { name: string; teamId: string }>();
  for (const team of Object.values(rosters.bundle.teams)) {
    for (const p of team.players) {
      nameById.set(String(p.id), {
        name: playerCardName(p),
        teamId: team.teamId,
      });
    }
  }

  const out: PlayerGameLogsForLeaders[] = [];
  for (const doc of logsSnap.docs) {
    const data = doc.data() as {
      playerId?: unknown;
      teamId?: unknown;
      gameLogs?: unknown;
    };
    const playerId = String(data.playerId ?? doc.id).trim();
    if (!playerId) continue;
    const gameLogs = resolveGameLogs(data.gameLogs);
    if (gameLogs.length === 0) continue;
    const meta = nameById.get(playerId);
    const teamId =
      (typeof data.teamId === "string" && data.teamId.trim()
        ? data.teamId.trim()
        : null) ??
      meta?.teamId ??
      "";
    out.push({
      playerId,
      playerName: meta?.name ?? `Player ${playerId}`,
      teamId,
      gameLogs,
    });
  }
  return out;
}

export function last10BoardHasRows(
  board: Record<NbaPlayerLeaderMetricId, NbaPlayerStatLeaderRow[]>
): boolean {
  return (board.pts?.length ?? 0) > 0;
}
