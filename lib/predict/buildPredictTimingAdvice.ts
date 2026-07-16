/**
 * 予想フォーム — Pro「タイミング」1 行アドバイス（レガシー・月次参照）。
 * v1 は buildPredictTimingAdviceV1.ts を参照。
 */

import type { Language } from "@/lib/i18n/language";
import type {
  PredictTimingAdvice,
} from "@/lib/predict/predictTimingAdviceTypes";
import type { RankShadowCompareRow } from "@/lib/rankings/rankShadowAnalysis";

export type { PredictTimingAdvice, PredictTimingAdviceId } from "@/lib/predict/predictTimingAdviceTypes";

type TeamAffinity = {
  teamId: string;
  posts: number;
  winRate: number;
};

export type PredictTimingAdviceInput = {
  language: Language;
  homeTeamId?: string;
  awayTeamId?: string;
  homeTeamName: string;
  awayTeamName: string;
  isKnockout: boolean;
  monthlyStats: {
    raw?: { winRate?: number };
    homeAway?: {
      away?: { winRate?: number; posts?: number };
    };
    teamStats?: {
      strong?: TeamAffinity[];
      weak?: TeamAffinity[];
    };
  } | null;
  globalAvgWinRate?: number | null;
  shadowCompareRows?: RankShadowCompareRow[] | null;
};

const MIN_TEAM_POSTS = 5;
const STRONG_WIN_RATE = 0.58;
const WEAK_WIN_RATE = 0.42;
const AWAY_GAP = 0.1;

function pct(rate: number): number {
  const v = rate <= 1 ? rate * 100 : rate;
  return Math.round(v);
}

function findTeamAffinity(
  teams: TeamAffinity[] | undefined,
  teamId: string | undefined
): TeamAffinity | null {
  if (!teamId || !teams?.length) return null;
  return teams.find((t) => t.teamId === teamId) ?? null;
}

function pickTeamStrong(input: PredictTimingAdviceInput): PredictTimingAdvice | null {
  const globalAvg = input.globalAvgWinRate;
  if (globalAvg == null || !Number.isFinite(globalAvg)) return null;

  const candidates: Array<{
    teamName: string;
    winRate: number;
  }> = [];

  const home = findTeamAffinity(
    input.monthlyStats?.teamStats?.strong,
    input.homeTeamId
  );
  if (home && home.posts >= MIN_TEAM_POSTS && home.winRate >= STRONG_WIN_RATE) {
    candidates.push({ teamName: input.homeTeamName, winRate: home.winRate });
  }

  const away = findTeamAffinity(
    input.monthlyStats?.teamStats?.strong,
    input.awayTeamId
  );
  if (away && away.posts >= MIN_TEAM_POSTS && away.winRate >= STRONG_WIN_RATE) {
    candidates.push({ teamName: input.awayTeamName, winRate: away.winRate });
  }

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.winRate - a.winRate);
  const top = candidates[0]!;
  return {
    id: "teamStrong",
    params: {
      team: top.teamName,
      userPct: pct(top.winRate),
      avgPct: pct(globalAvg),
    },
  };
}

function pickTeamWeak(input: PredictTimingAdviceInput): PredictTimingAdvice | null {
  const weakTeams = input.monthlyStats?.teamStats?.weak;
  if (!weakTeams?.length) return null;

  for (const teamId of [input.homeTeamId, input.awayTeamId]) {
    const row = findTeamAffinity(weakTeams, teamId);
    if (!row || row.posts < MIN_TEAM_POSTS || row.winRate > WEAK_WIN_RATE) {
      continue;
    }
    const teamName =
      teamId === input.homeTeamId ? input.homeTeamName : input.awayTeamName;
    return {
      id: "teamWeak",
      params: { team: teamName, userPct: pct(row.winRate) },
    };
  }
  return null;
}

function pickAwayWeak(input: PredictTimingAdviceInput): PredictTimingAdvice | null {
  const overall = input.monthlyStats?.raw?.winRate;
  const away = input.monthlyStats?.homeAway?.away;
  if (
    overall == null ||
    !away ||
    (away.posts ?? 0) < MIN_TEAM_POSTS ||
    away.winRate == null
  ) {
    return null;
  }
  if (away.winRate > overall - AWAY_GAP) return null;
  return {
    id: "awayWeak",
    params: { userPct: pct(away.winRate) },
  };
}

function pickShadowExact(
  rows: RankShadowCompareRow[] | null | undefined
): PredictTimingAdvice | null {
  const exact = rows?.find((r) => r.id === "exactHits");
  if (!exact || exact.tag !== "weakness" || exact.cohortAvg < 0.5) return null;
  return { id: "shadowExact", params: {} };
}

function pickKnockoutFocus(
  input: PredictTimingAdviceInput
): PredictTimingAdvice | null {
  if (!input.isKnockout) return null;
  return { id: "knockoutFocus", params: {} };
}

/** 優先度順に最初にマッチした 1 件を返す */
export function buildPredictTimingAdvice(
  input: PredictTimingAdviceInput
): PredictTimingAdvice | null {
  if (!input.monthlyStats) return null;

  return (
    pickTeamStrong(input) ??
    pickTeamWeak(input) ??
    pickAwayWeak(input) ??
    pickShadowExact(input.shadowCompareRows) ??
    (input.isKnockout ? pickKnockoutFocus(input) : null)
  );
}
