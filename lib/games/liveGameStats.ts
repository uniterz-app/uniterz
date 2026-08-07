/**
 * NBA ライブ/終了試合スタッツ（チームスタッツ + ボックススコア）の本番用型と正規化。
 *
 * データフロー:
 * - 外部データ（手動 or パイプライン）→ PATCH /api/admin/nba-live-stats
 *   → games/{gameId}.liveStats に保存
 * - クライアント → GET /api/games/live-stats?gameId=...
 *   → liveStats + 試合ドキュメントから LiveGameStatsReport を組み立てて返す
 */

import { NBA_TEAM_NAME_BY_ID } from "@/lib/nba-team-names";
import { TEAM_SHORT } from "@/lib/team-short";

export type LiveGamePhase = "live" | "final";

export type LiveGameTeamSide = {
  teamId: string;
  teamName: string;
  abbr: string;
  score: number;
};

export type LiveGameTeamStatRow = {
  key: string;
  label: string;
  home: number;
  away: number;
  /** true なら低い方が勝ち（例: TO） */
  lowerIsBetter?: boolean;
  format?: "int" | "pct" | "one";
};

export type LiveGameBoxPlayer = {
  playerId: string;
  firstName: string;
  lastName: string;
  position: string;
  jerseyNumber: string;
  starter: boolean;
  min: number;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  tov: number;
  fg: string; // "8-15"
  fg3: string;
  ft: string;
  plusMinus: number;
};

export type LiveGameBoxTeam = {
  teamId: string;
  teamName: string;
  side: "home" | "away";
  players: LiveGameBoxPlayer[];
};

/** クォーター別スコア（Q1–Q4 + OT…）。未実施ピリオドは null */
export type LiveGameLineScore = {
  periods: string[];
  home: Array<number | null>;
  away: Array<number | null>;
};

export type LiveGameStatsReport = {
  gameId: string;
  phase: LiveGamePhase;
  periodLabel: string;
  clock: string | null;
  home: LiveGameTeamSide;
  away: LiveGameTeamSide;
  /** 無い・不正なら UI は非表示 */
  lineScore: LiveGameLineScore | null;
  teamStats: LiveGameTeamStatRow[];
  box: {
    home: LiveGameBoxTeam;
    away: LiveGameBoxTeam;
  };
};

/** games/{id}.liveStats に保存する形（ingest ペイロードと同形） */
export type LiveGameStatsDoc = {
  phase: LiveGamePhase;
  periodLabel: string;
  clock: string | null;
  homeScore: number;
  awayScore: number;
  lineScore: LiveGameLineScore | null;
  /** カタログの key → 値。片側でも欠けている行は表示しない */
  teamStats: {
    home: Record<string, number>;
    away: Record<string, number>;
  };
  box: {
    home: LiveGameBoxPlayer[];
    away: LiveGameBoxPlayer[];
  };
};

/** チームスタッツ行のカタログ（表示順・ラベル・フォーマット） */
export const LIVE_TEAM_STAT_CATALOG: ReadonlyArray<{
  key: string;
  label: string;
  format: "int" | "pct" | "one";
  lowerIsBetter?: boolean;
}> = [
  { key: "fg", label: "FG%", format: "pct" },
  { key: "fg3", label: "3P%", format: "pct" },
  { key: "ft", label: "FT%", format: "pct" },
  { key: "reb", label: "REB", format: "int" },
  { key: "ast", label: "AST", format: "int" },
  { key: "stl", label: "STL", format: "int" },
  { key: "blk", label: "BLK", format: "int" },
  { key: "tov", label: "TO", format: "int", lowerIsBetter: true },
  { key: "paint", label: "PAINT", format: "int" },
  { key: "fb", label: "FB PTS", format: "int" },
];

export function formatLiveTeamStatValue(
  value: number,
  format: LiveGameTeamStatRow["format"] = "int"
): string {
  if (!Number.isFinite(value)) return "—";
  if (format === "pct") return `${value.toFixed(1)}%`;
  if (format === "one") return value.toFixed(1);
  return String(Math.round(value));
}

/** 試合リーダー（ボックスから算出） */
export const LIVE_GAME_LEADER_CATALOG = [
  { key: "pts", label: "PTS" },
  { key: "reb", label: "REB" },
  { key: "ast", label: "AST" },
  { key: "stl", label: "STL" },
  { key: "blk", label: "BLK" },
] as const;

export type LiveGameLeaderStatKey =
  (typeof LIVE_GAME_LEADER_CATALOG)[number]["key"];

export type LiveGameLeaderEntry = {
  key: LiveGameLeaderStatKey;
  label: string;
  playerId: string;
  firstName: string;
  lastName: string;
  teamId: string;
  teamAbbr: string;
  value: number;
};

type LeaderCandidate = {
  player: LiveGameBoxPlayer;
  teamId: string;
  teamAbbr: string;
};

export function deriveLiveGameLeaders(
  report: Pick<LiveGameStatsReport, "home" | "away" | "box">
): LiveGameLeaderEntry[] {
  const pool: LeaderCandidate[] = [
    ...report.box.home.players.map((player) => ({
      player,
      teamId: report.box.home.teamId,
      teamAbbr: report.home.abbr,
    })),
    ...report.box.away.players.map((player) => ({
      player,
      teamId: report.box.away.teamId,
      teamAbbr: report.away.abbr,
    })),
  ];
  if (pool.length === 0) return [];

  const out: LiveGameLeaderEntry[] = [];
  for (const def of LIVE_GAME_LEADER_CATALOG) {
    let best: LeaderCandidate | null = null;
    let bestVal = -Infinity;
    for (const c of pool) {
      const v = c.player[def.key];
      if (!Number.isFinite(v)) continue;
      if (
        v > bestVal ||
        (v === bestVal &&
          best != null &&
          c.player.pts > best.player.pts)
      ) {
        best = c;
        bestVal = v;
      }
    }
    if (!best || bestVal < 0) continue;
    if (bestVal === 0 && def.key !== "pts") continue;
    out.push({
      key: def.key,
      label: def.label,
      playerId: best.player.playerId,
      firstName: best.player.firstName,
      lastName: best.player.lastName,
      teamId: best.teamId,
      teamAbbr: best.teamAbbr,
      value: bestVal,
    });
  }
  return out;
}

function num(v: unknown, fallback = 0): number {
  const n = typeof v === "string" ? Number(v) : v;
  return typeof n === "number" && Number.isFinite(n) ? n : fallback;
}

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function normalizeBoxPlayer(raw: unknown): LiveGameBoxPlayer | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const playerId = str(r.playerId).trim();
  const lastName = str(r.lastName).trim();
  if (!playerId || !lastName) return null;
  return {
    playerId,
    firstName: str(r.firstName).trim(),
    lastName,
    position: str(r.position).trim(),
    jerseyNumber: str(r.jerseyNumber ?? r.jersey).trim(),
    starter: Boolean(r.starter),
    min: num(r.min),
    pts: num(r.pts),
    reb: num(r.reb),
    ast: num(r.ast),
    stl: num(r.stl),
    blk: num(r.blk),
    tov: num(r.tov),
    fg: str(r.fg, "0-0"),
    fg3: str(r.fg3, "0-0"),
    ft: str(r.ft, "0-0"),
    plusMinus: num(r.plusMinus),
  };
}

function normalizeStatMap(raw: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (!raw || typeof raw !== "object") return out;
  for (const { key } of LIVE_TEAM_STAT_CATALOG) {
    const v = (raw as Record<string, unknown>)[key];
    const n = typeof v === "string" ? Number(v) : v;
    if (typeof n === "number" && Number.isFinite(n)) out[key] = n;
  }
  return out;
}

function normalizePeriodScore(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "string" ? Number(v) : v;
  return typeof n === "number" && Number.isFinite(n) ? n : null;
}

export function normalizeLiveGameLineScore(
  raw: unknown
): LiveGameLineScore | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const periodsRaw = Array.isArray(r.periods) ? r.periods : null;
  const homeRaw = Array.isArray(r.home) ? r.home : null;
  const awayRaw = Array.isArray(r.away) ? r.away : null;
  if (!periodsRaw || !homeRaw || !awayRaw) return null;
  if (periodsRaw.length === 0) return null;
  if (homeRaw.length !== periodsRaw.length || awayRaw.length !== periodsRaw.length) {
    return null;
  }
  const periods = periodsRaw.map((p) => str(p).trim()).filter(Boolean);
  if (periods.length !== periodsRaw.length) return null;
  return {
    periods,
    home: homeRaw.map(normalizePeriodScore),
    away: awayRaw.map(normalizePeriodScore),
  };
}

/**
 * ingest ペイロード（admin API 経由）を検証・正規化する。
 * 必須が欠けていれば null。
 */
export function normalizeLiveGameStatsDoc(
  raw: unknown
): LiveGameStatsDoc | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  const phase = r.phase === "final" ? "final" : r.phase === "live" ? "live" : null;
  if (!phase) return null;

  const boxRaw = (r.box ?? {}) as Record<string, unknown>;
  const statsRaw = (r.teamStats ?? {}) as Record<string, unknown>;

  const boxHome = Array.isArray(boxRaw.home)
    ? boxRaw.home.map(normalizeBoxPlayer).filter((p): p is LiveGameBoxPlayer => p !== null)
    : [];
  const boxAway = Array.isArray(boxRaw.away)
    ? boxRaw.away.map(normalizeBoxPlayer).filter((p): p is LiveGameBoxPlayer => p !== null)
    : [];

  return {
    phase,
    periodLabel: str(r.periodLabel).trim(),
    clock: str(r.clock).trim() || null,
    homeScore: num(r.homeScore),
    awayScore: num(r.awayScore),
    lineScore: normalizeLiveGameLineScore(r.lineScore),
    teamStats: {
      home: normalizeStatMap(statsRaw.home),
      away: normalizeStatMap(statsRaw.away),
    },
    box: { home: boxHome, away: boxAway },
  };
}

function teamAbbr(teamId: string): string {
  return (TEAM_SHORT[teamId] ?? teamId.slice(-3)).toUpperCase();
}

function teamName(teamId: string, fallback: string): string {
  return NBA_TEAM_NAME_BY_ID[teamId] ?? fallback;
}

type GameDocTeamContext = {
  homeTeamId: string;
  awayTeamId: string;
  homeName: string;
  awayName: string;
};

export function gameDocTeamContext(
  game: Record<string, unknown>
): GameDocTeamContext {
  const home = (game.home ?? {}) as Record<string, unknown>;
  const away = (game.away ?? {}) as Record<string, unknown>;
  return {
    homeTeamId: str(home.teamId ?? game.homeTeamId).trim(),
    awayTeamId: str(away.teamId ?? game.awayTeamId).trim(),
    homeName: str(home.name ?? home.nameJa),
    awayName: str(away.name ?? away.nameJa),
  };
}

/**
 * 保存済み liveStats + 試合ドキュメントの情報から表示用レポートを組み立てる。
 * teamStats は両サイド揃っている行のみ表示する。
 */
export function buildLiveGameStatsReport(
  gameId: string,
  game: Record<string, unknown>,
  live: LiveGameStatsDoc
): LiveGameStatsReport {
  const ctx = gameDocTeamContext(game);
  const homeName = teamName(ctx.homeTeamId, ctx.homeName);
  const awayName = teamName(ctx.awayTeamId, ctx.awayName);

  const teamStats: LiveGameTeamStatRow[] = [];
  for (const def of LIVE_TEAM_STAT_CATALOG) {
    const home = live.teamStats.home[def.key];
    const away = live.teamStats.away[def.key];
    if (home === undefined || away === undefined) continue;
    teamStats.push({
      key: def.key,
      label: def.label,
      home,
      away,
      format: def.format,
      ...(def.lowerIsBetter ? { lowerIsBetter: true } : {}),
    });
  }

  return {
    gameId,
    phase: live.phase,
    periodLabel: live.periodLabel,
    clock: live.clock,
    home: {
      teamId: ctx.homeTeamId,
      teamName: homeName,
      abbr: teamAbbr(ctx.homeTeamId),
      score: live.homeScore,
    },
    away: {
      teamId: ctx.awayTeamId,
      teamName: awayName,
      abbr: teamAbbr(ctx.awayTeamId),
      score: live.awayScore,
    },
    lineScore: live.lineScore,
    teamStats,
    box: {
      home: {
        teamId: ctx.homeTeamId,
        teamName: homeName,
        side: "home",
        players: live.box.home,
      },
      away: {
        teamId: ctx.awayTeamId,
        teamName: awayName,
        side: "away",
        players: live.box.away,
      },
    },
  };
}
