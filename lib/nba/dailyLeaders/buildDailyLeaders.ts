/**
 * 1 日分の試合 box（games/{id}.liveStats）から主要スタッツの Top20 を作る。
 * サーバー（/api/nba/daily-leaders）で使う純関数。
 */
import {
  gameDocTeamContext,
  normalizeLiveGameStatsDoc,
  type LiveGameBoxPlayer,
} from "@/lib/games/liveGameStats";
import { TEAM_SHORT } from "@/lib/team-short";

export const DAILY_LEADER_STATS = [
  { key: "pts", label: "PTS" },
  { key: "reb", label: "REB" },
  { key: "ast", label: "AST" },
  { key: "stl", label: "STL" },
  { key: "blk", label: "BLK" },
  { key: "fg3m", label: "3PM" },
] as const;

export type DailyLeaderStatKey = (typeof DAILY_LEADER_STATS)[number]["key"];

export const DAILY_LEADERS_TOP_N = 20;

export type DailyLeaderRow = {
  playerId: string;
  firstName: string;
  lastName: string;
  teamId: string;
  teamAbbr: string;
  oppAbbr: string;
  isHome: boolean;
  value: number;
  /** その日の成績一式（行の補足表示用） */
  stats: Record<DailyLeaderStatKey, number>;
  live: boolean;
  gameId: string;
};

export type DailyLeadersPayload = {
  ok: true;
  dateKey: string;
  timeZone: string;
  /** その日の NBA 試合数（未開始含む） */
  gameCount: number;
  /** box が入っている試合数 */
  gamesWithStats: number;
  hasLive: boolean;
  /** その日の試合がすべてプレシーズン */
  preseason: boolean;
  boards: Record<DailyLeaderStatKey, DailyLeaderRow[]>;
};

type Candidate = Omit<DailyLeaderRow, "value">;

const SIDE_BASE: readonly DailyLeaderStatKey[] = ["pts", "reb", "ast"];
const SIDE_EXTRA: readonly DailyLeaderStatKey[] = ["fg3m", "stl", "blk"];

/** 行の補足: PTS/REB/AST は常に、3PM/STL/BLK は 1 以上のときだけ。選択中の指標は除く。 */
export function dailyLeaderSideStats(
  stats: Record<DailyLeaderStatKey, number>,
  selected: DailyLeaderStatKey
): { key: DailyLeaderStatKey; label: string; value: number }[] {
  const keys = [
    ...SIDE_BASE,
    ...SIDE_EXTRA.filter((k) => (stats[k] ?? 0) > 0),
  ].filter((k) => k !== selected);
  return keys.map((key) => ({
    key,
    label: DAILY_LEADER_STATS.find((s) => s.key === key)?.label ?? key,
    value: stats[key] ?? 0,
  }));
}

function teamAbbr(teamId: string): string {
  return (TEAM_SHORT[teamId] ?? teamId.slice(-3)).toUpperCase();
}

function made(shooting: string): number {
  const n = Number(String(shooting).split("-")[0]);
  return Number.isFinite(n) ? n : 0;
}

function statsOf(p: LiveGameBoxPlayer): Record<DailyLeaderStatKey, number> {
  return {
    pts: p.pts,
    reb: p.reb,
    ast: p.ast,
    stl: p.stl,
    blk: p.blk,
    fg3m: made(p.fg3),
  };
}

function emptyBoards(): Record<DailyLeaderStatKey, DailyLeaderRow[]> {
  return { pts: [], reb: [], ast: [], stl: [], blk: [], fg3m: [] };
}

export function buildDailyLeaders(
  games: ReadonlyArray<{ id: string; data: Record<string, unknown> }>,
  dateKey: string,
  timeZone: string
): DailyLeadersPayload {
  const pool: Candidate[] = [];
  let gamesWithStats = 0;
  let hasLive = false;
  let preseasonGames = 0;

  for (const { id, data } of games) {
    if (String(data.seasonPhase ?? "") === "preseason") preseasonGames += 1;
    const live = normalizeLiveGameStatsDoc(data.liveStats);
    if (!live) continue;
    const boxCount = live.box.home.length + live.box.away.length;
    if (boxCount === 0) continue;
    gamesWithStats += 1;
    const isLive = live.phase === "live";
    if (isLive) hasLive = true;

    const ctx = gameDocTeamContext(data);
    const homeAbbr = teamAbbr(ctx.homeTeamId);
    const awayAbbr = teamAbbr(ctx.awayTeamId);
    const sides = [
      { players: live.box.home, teamId: ctx.homeTeamId, abbr: homeAbbr, opp: awayAbbr, isHome: true },
      { players: live.box.away, teamId: ctx.awayTeamId, abbr: awayAbbr, opp: homeAbbr, isHome: false },
    ];
    for (const side of sides) {
      for (const p of side.players) {
        // 出場していない選手（DNP）は除外
        if (!(p.min > 0)) continue;
        pool.push({
          playerId: p.playerId,
          firstName: p.firstName,
          lastName: p.lastName,
          teamId: side.teamId,
          teamAbbr: side.abbr,
          oppAbbr: side.opp,
          isHome: side.isHome,
          live: isLive,
          gameId: id,
          stats: statsOf(p),
        });
      }
    }
  }

  const boards = emptyBoards();
  for (const { key } of DAILY_LEADER_STATS) {
    boards[key] = pool
      .filter((c) => c.stats[key] > 0)
      .sort(
        (a, b) =>
          b.stats[key] - a.stats[key] ||
          b.stats.pts - a.stats.pts ||
          a.lastName.localeCompare(b.lastName)
      )
      .slice(0, DAILY_LEADERS_TOP_N)
      .map((c) => ({ ...c, value: c.stats[key] }));
  }

  return {
    ok: true,
    dateKey,
    timeZone,
    gameCount: games.length,
    gamesWithStats,
    hasLive,
    preseason: games.length > 0 && preseasonGames === games.length,
    boards,
  };
}
