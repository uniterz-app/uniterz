/**
 * LEAGUE hub の追加集計（純関数・RN / Node 共通）:
 * 日程の厳しさ・UNITERZ の予想と結果・選手のホーム / アウェー / B2B・年俸と働き・通算の節目。
 */
import type { NbaPlayerCareerSeasonRow, NbaPlayerGameLog } from "@/lib/predict/nbaPlayerDetailPreviewMocks";
import {
  LEAGUE_HUB_MILESTONE_STATS,
  type LeagueHubCareerBase,
  type LeagueHubMilestoneRow,
  type LeagueHubMilestoneStat,
  type LeagueHubPlayerRef,
  type LeagueHubPlayerSplitRow,
  type LeagueHubPlayerSplits,
  type LeagueHubTeamPicks,
  type LeagueHubTeamSchedule,
  type LeagueHubValueRow,
} from "@/lib/nba/leagueHub/leagueHubTypes";

const DAY_MS = 86_400_000;
const LIST_LIMIT = 10;

function round(v: number, digits: number): number {
  const p = 10 ** digits;
  return Math.round(v * p) / p;
}

function avg(values: number[]): number {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

/** レギュラーの 1 試合（同じ 2 チーム・同じ日の重複 doc はまとめた後） */
export type LeagueHubSeasonGame = {
  homeTeamId: string;
  awayTeamId: string;
  final: boolean;
  homeScore: number | null;
  awayScore: number | null;
  /** UNITERZ の勝敗予想の人数 */
  picks: { home: number; away: number } | null;
};

/** 相手の今の勝率の平均。終わった試合と残り試合を分ける */
export function buildLeagueHubSchedules(
  games: LeagueHubSeasonGame[],
  winPctByTeam: Map<string, number>
): Map<string, LeagueHubTeamSchedule> {
  const acc = new Map<string, { p: number[]; r: number[] }>();
  const add = (teamId: string, oppId: string, final: boolean) => {
    const pct = winPctByTeam.get(oppId);
    if (pct == null) return;
    const a = acc.get(teamId) ?? { p: [], r: [] };
    (final ? a.p : a.r).push(pct);
    acc.set(teamId, a);
  };
  for (const g of games) {
    add(g.homeTeamId, g.awayTeamId, g.final);
    add(g.awayTeamId, g.homeTeamId, g.final);
  }
  return new Map(
    [...acc].map(([teamId, a]) => [
      teamId,
      {
        played: a.p.length > 0 ? round(avg(a.p), 3) : null,
        playedGames: a.p.length,
        remaining: a.r.length > 0 ? round(avg(a.r), 3) : null,
        remainingGames: a.r.length,
      },
    ])
  );
}

/** 予想の割合の合計 = 予想の勝ち数。引き分けの票は数えない */
export function buildLeagueHubTeamPicks(games: LeagueHubSeasonGame[]): Map<string, LeagueHubTeamPicks> {
  const out = new Map<string, LeagueHubTeamPicks>();
  for (const g of games) {
    if (!g.final || !g.picks || g.homeScore == null || g.awayScore == null) continue;
    if (g.homeScore === g.awayScore) continue;
    const total = g.picks.home + g.picks.away;
    if (total <= 0) continue;
    const homeWon = g.homeScore > g.awayScore;
    const majorityHome = g.picks.home >= g.picks.away;
    const majorityHit = g.picks.home !== g.picks.away && majorityHome === homeWon;
    for (const side of ["home", "away"] as const) {
      const teamId = side === "home" ? g.homeTeamId : g.awayTeamId;
      const won = side === "home" ? homeWon : !homeWon;
      const cur = out.get(teamId) ?? { games: 0, expectedWins: 0, wins: 0, majorityHits: 0 };
      cur.games += 1;
      cur.expectedWins += g.picks[side] / total;
      cur.wins += won ? 1 : 0;
      cur.majorityHits += majorityHit ? 1 : 0;
      out.set(teamId, cur);
    }
  }
  for (const v of out.values()) v.expectedWins = round(v.expectedWins, 2);
  return out;
}

type PlayerLogs = { ref: LeagueHubPlayerRef; days: Array<{ g: NbaPlayerGameLog; day: number }> };

/** 平均 12 点以上。ホーム / アウェーは両方 minGames 以上、B2B 2 日目は 2 試合以上 */
export function buildLeagueHubPlayerSplits(
  players: PlayerLogs[],
  minGames: number
): LeagueHubPlayerSplits {
  const homeAway: LeagueHubPlayerSplitRow[] = [];
  const b2b: LeagueHubPlayerSplitRow[] = [];
  const row = (ref: LeagueHubPlayerRef, a: number[], b: number[]): LeagueHubPlayerSplitRow => ({
    ...ref,
    a: round(avg(a), 1),
    b: round(avg(b), 1),
    diff: round(avg(a) - avg(b), 1),
    aGames: a.length,
    bGames: b.length,
  });
  for (const { ref, days } of players) {
    const played = days.filter((x) => x.g.min > 0);
    if (played.length < minGames || avg(played.map((x) => x.g.pts)) < 12) continue;
    const home = played.filter((x) => x.g.home).map((x) => x.g.pts);
    const away = played.filter((x) => !x.g.home).map((x) => x.g.pts);
    if (home.length >= minGames / 2 && away.length >= minGames / 2) {
      homeAway.push(row(ref, home, away));
    }
    // 自分も前日に出た試合だけ（前日を休んだ 2 日目は疲れの比較にならない）
    const playedDays = new Set(played.map((x) => x.day));
    const second = played.filter((x) => playedDays.has(x.day - DAY_MS)).map((x) => x.g.pts);
    const rest = played.filter((x) => !playedDays.has(x.day - DAY_MS)).map((x) => x.g.pts);
    if (second.length >= 2 && rest.length >= minGames / 2) b2b.push(row(ref, second, rest));
  }
  const top = (rows: LeagueHubPlayerSplitRow[], dir: 1 | -1) =>
    rows
      .filter((r) => r.diff * dir > 0)
      .sort((x, y) => (y.diff - x.diff) * dir)
      .slice(0, LIST_LIMIT);
  return {
    home: top(homeAway, 1),
    away: top(homeAway, -1),
    b2bDrop: top(b2b, -1),
    b2bUp: top(b2b, 1),
  };
}

/** 年俸順位と Game Score 順位の差。割安 = 年俸の順位より働きの順位がずっと上 */
export function buildLeagueHubValue(
  pool: Array<{ ref: LeagueHubPlayerRef; salaryUsd: number; gameScore: number }>
): { best: LeagueHubValueRow[]; worst: LeagueHubValueRow[] } | null {
  if (pool.length < 20) return null;
  const salaryRank = new Map(
    [...pool].sort((a, b) => b.salaryUsd - a.salaryUsd).map((p, i) => [p.ref.playerId, i + 1])
  );
  const gsRank = new Map(
    [...pool].sort((a, b) => b.gameScore - a.gameScore).map((p, i) => [p.ref.playerId, i + 1])
  );
  const rows: LeagueHubValueRow[] = pool.map((p) => ({
    ...p.ref,
    salaryM: round(p.salaryUsd / 1e6, 1),
    gameScore: round(p.gameScore, 1),
    salaryRank: salaryRank.get(p.ref.playerId)!,
    gameScoreRank: gsRank.get(p.ref.playerId)!,
    of: pool.length,
  }));
  const gap = (r: LeagueHubValueRow) => r.salaryRank - r.gameScoreRank;
  return {
    best: [...rows]
      .filter((r) => gap(r) > 0)
      .sort((a, b) => gap(b) - gap(a) || b.gameScore - a.gameScore)
      .slice(0, LIST_LIMIT),
    worst: [...rows]
      .filter((r) => gap(r) < 0)
      .sort((a, b) => gap(a) - gap(b) || b.salaryM - a.salaryM)
      .slice(0, LIST_LIMIT),
  };
}

/** 前季までのレギュラー通算（同じシーズンが複数行なら試合数の多い行 = 合計行） */
export function careerBaseFromRows(
  rows: NbaPlayerCareerSeasonRow[],
  seasonStartYear: number
): LeagueHubCareerBase {
  const bySeason = new Map<number, NbaPlayerCareerSeasonRow>();
  for (const r of rows) {
    if (!(r.seasonStart < seasonStartYear) || !(r.games > 0)) continue;
    const cur = bySeason.get(r.seasonStart);
    if (!cur || r.games > cur.games) bySeason.set(r.seasonStart, r);
  }
  const out: LeagueHubCareerBase = { games: 0, pts: 0, reb: 0, ast: 0, fg3m: 0, approxGames: 0 };
  let approx = 0;
  for (const r of bySeason.values()) {
    out.games += r.games;
    if (r.totals) {
      approx += r.totals.estGames ?? 0;
      for (const s of LEAGUE_HUB_MILESTONE_STATS) out[s] += r.totals[s] ?? 0;
    } else {
      approx += r.games;
      for (const s of LEAGUE_HUB_MILESTONE_STATS) out[s] += r.games * (r[s] ?? 0);
    }
  }
  for (const s of LEAGUE_HUB_MILESTONE_STATS) out[s] = Math.round(out[s]);
  out.approxGames = approx;
  return out;
}

const MILESTONE_TARGETS: Record<LeagueHubMilestoneStat, number[]> = {
  pts: [10000, 15000, 20000, 25000, 30000, 35000, 40000, 45000, 50000],
  reb: [5000, 7500, 10000, 12500, 15000],
  ast: [5000, 7500, 10000, 12500, 15000],
  fg3m: [1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500],
};
/** 今季のペースでこの試合数以内に届く節目だけ */
const MILESTONE_MAX_GAMES = 25;
const MILESTONE_LIMIT = 15;

export function buildLeagueHubMilestones(
  players: Array<{ ref: LeagueHubPlayerRef; base: LeagueHubCareerBase; logs: NbaPlayerGameLog[] }>
): LeagueHubMilestoneRow[] {
  const rows: LeagueHubMilestoneRow[] = [];
  for (const { ref, base, logs } of players) {
    const played = logs.filter((g) => g.min > 0);
    if (played.length === 0) continue;
    for (const stat of LEAGUE_HUB_MILESTONE_STATS) {
      const season = played.reduce((s, g) => s + g[stat], 0);
      const current = base[stat] + season;
      const target = MILESTONE_TARGETS[stat].find((t) => t > current);
      const perGame = season / played.length;
      if (target == null || !(perGame > 0)) continue;
      const remaining = target - current;
      const gamesAway = Math.ceil(remaining / perGame);
      if (gamesAway > MILESTONE_MAX_GAMES) continue;
      const approx = (base.approxGames ?? base.games) > 0;
      rows.push({ ...ref, stat, target, remaining, gamesAway, ...(approx ? { approx } : {}) });
    }
  }
  return rows
    .sort((a, b) => a.gamesAway - b.gamesAway || b.target - a.target)
    .slice(0, MILESTONE_LIMIT);
}
