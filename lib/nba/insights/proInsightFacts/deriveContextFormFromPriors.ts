/**
 * CONTEXT 用 — prior から連勝/会場連勝/点差プロファイルを導出。
 */
import type { SchedulePriorGame } from "@/lib/nba/insights/proInsightFacts/buildScheduleFacts";

export const CONTEXT_CLOSE_MARGIN = 5;
export const CONTEXT_BLOWOUT_MARGIN = 15;
export const CONTEXT_MARGIN_LOOKBACK = 10;

export type DerivedTeamForm = {
  teamId: string;
  streakKind: "W" | "L" | null;
  streakCount: number;
  /** streak 試合分の相手勝率平均（newest-first の pct 配列から） */
  streakOppWinPctAvg: number | null;
  homeWinStreak: number;
  awayWinStreak: number;
  homeLossStreak: number;
  awayLossStreak: number;
  margin: {
    sample: number;
    wins: number;
    losses: number;
    closeWins: number;
    blowoutWins: number;
    closeLosses: number;
    blowoutLosses: number;
  };
};

export function marginForTeam(g: SchedulePriorGame): number | null {
  const h = g.homeScore;
  const a = g.awayScore;
  if (typeof h !== "number" || typeof a !== "number") return null;
  if (!Number.isFinite(h) || !Number.isFinite(a)) return null;
  return g.isHome ? h - a : a - h;
}

export function wonForTeam(g: SchedulePriorGame): boolean | null {
  const m = marginForTeam(g);
  if (m == null || m === 0) return null;
  return m > 0;
}

export function deriveTeamFormFromPriors(input: {
  teamId: string;
  priorGames: SchedulePriorGame[];
}): DerivedTeamForm {
  const newestFirst = [...input.priorGames].sort(
    (a, b) => b.startAtMs - a.startAtMs
  );

  let streakKind: "W" | "L" | null = null;
  let streakCount = 0;
  for (const g of newestFirst) {
    const won = wonForTeam(g);
    if (won == null) break;
    const k: "W" | "L" = won ? "W" : "L";
    if (streakKind == null) streakKind = k;
    if (k !== streakKind) break;
    streakCount += 1;
  }

  let homeWinStreak = 0;
  let awayWinStreak = 0;
  let homeLossStreak = 0;
  let awayLossStreak = 0;
  for (const g of newestFirst) {
    if (!g.isHome) break;
    const won = wonForTeam(g);
    if (won == null) break;
    if (won) {
      if (homeLossStreak > 0) break;
      homeWinStreak += 1;
    } else {
      if (homeWinStreak > 0) break;
      homeLossStreak += 1;
    }
  }
  for (const g of newestFirst) {
    if (g.isHome) break;
    const won = wonForTeam(g);
    if (won == null) break;
    if (won) {
      if (awayLossStreak > 0) break;
      awayWinStreak += 1;
    } else {
      if (awayWinStreak > 0) break;
      awayLossStreak += 1;
    }
  }

  const window = newestFirst.slice(0, CONTEXT_MARGIN_LOOKBACK);
  let wins = 0;
  let losses = 0;
  let closeWins = 0;
  let blowoutWins = 0;
  let closeLosses = 0;
  let blowoutLosses = 0;
  let sample = 0;
  for (const g of window) {
    const m = marginForTeam(g);
    if (m == null) continue;
    sample += 1;
    const abs = Math.abs(m);
    if (m > 0) {
      wins += 1;
      if (abs <= CONTEXT_CLOSE_MARGIN) closeWins += 1;
      if (abs >= CONTEXT_BLOWOUT_MARGIN) blowoutWins += 1;
    } else {
      losses += 1;
      if (abs <= CONTEXT_CLOSE_MARGIN) closeLosses += 1;
      if (abs >= CONTEXT_BLOWOUT_MARGIN) blowoutLosses += 1;
    }
  }

  return {
    teamId: input.teamId,
    streakKind,
    streakCount,
    streakOppWinPctAvg: null,
    homeWinStreak,
    awayWinStreak,
    homeLossStreak,
    awayLossStreak,
    margin: {
      sample,
      wins,
      losses,
      closeWins,
      blowoutWins,
      closeLosses,
      blowoutLosses,
    },
  };
}

/** recentOppWinPctsNewestFirst: 直近が先頭 */
export function attachStreakOppQuality(
  form: DerivedTeamForm,
  recentOppWinPctsNewestFirst: number[]
): DerivedTeamForm {
  if (form.streakCount <= 0 || recentOppWinPctsNewestFirst.length === 0) {
    return form;
  }
  const slice = recentOppWinPctsNewestFirst.slice(0, form.streakCount);
  if (slice.length === 0) return form;
  const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
  return {
    ...form,
    streakOppWinPctAvg: Math.round(avg * 1000) / 1000,
  };
}
