/**
 * 予想フォーム — Pro「タイミング」v1（柱 3 確定仕様）
 * @see docs/pro-subscription-plan.md
 */

import type {
  ContextGlobalCache,
  UserStatsV2ContextCache,
} from "@/lib/stats/userStatsV2ContextCache";
import {
  contextGlobalWinRate,
  contextUnderdogWinRate,
  contextWinRate,
} from "@/lib/stats/userStatsV2ContextCache";
import type {
  PredictTimingAdvice,
  PredictTimingAdviceV1Id,
  TimingRuleEval,
} from "@/lib/predict/predictTimingAdviceTypes";

export type TeamUpsetContext = {
  teamId: string;
  teamName: string;
  upsetGames: number;
  totalGames: number;
  tournamentAvgUpsetRate: number;
};

export type PredictTimingAdviceV1Input = {
  homeTeamId?: string;
  awayTeamId?: string;
  homeTeamName: string;
  awayTeamName: string;
  context: UserStatsV2ContextCache | null;
  global?: ContextGlobalCache | null;
  teamUpsetContexts?: TeamUpsetContext[];
};

const MIN_TEAM_POSTS = 5;
const MIN_PATTERN_POSTS = 8;
const STRONG_WIN_RATE = 0.58;
const WEAK_WIN_RATE = 0.42;
const AWAY_GAP = 0.1;
const MIN_TEAM_UPSET_GAMES = 3;
const MIN_GLOBAL_POSTS_FOR_AVG = 100;

const RULE_META: Record<
  PredictTimingAdviceV1Id,
  { priority: number; labelJa: string; labelEn: string }
> = {
  teamStrong: {
    priority: 1,
    labelJa: "L1 得意チーム",
    labelEn: "L1 strong team",
  },
  teamWeak: {
    priority: 2,
    labelJa: "L1 苦手チーム",
    labelEn: "L1 weak team",
  },
  teamUpsetContext: {
    priority: 3,
    labelJa: "L3 チーム upset",
    labelEn: "L3 team upset",
  },
  awayWeak: {
    priority: 4,
    labelJa: "L1 アウェイ苦手",
    labelEn: "L1 away weak",
  },
  underdogStrong: {
    priority: 5,
    labelJa: "L1 逆張り得意",
    labelEn: "L1 underdog strong",
  },
};

function pct(rate: number): number {
  const v = rate <= 1 ? rate * 100 : rate;
  return Math.round(v);
}

function evalRule(
  id: PredictTimingAdviceV1Id,
  hit: boolean,
  reason: string,
  advice: PredictTimingAdvice | null
): TimingRuleEval {
  const meta = RULE_META[id];
  return {
    id,
    priority: meta.priority,
    labelJa: meta.labelJa,
    labelEn: meta.labelEn,
    hit,
    reason,
    advice: hit ? advice : null,
  };
}

function pickTeamStrong(
  input: PredictTimingAdviceV1Input
): TimingRuleEval {
  const id = "teamStrong" as const;
  const ctx = input.context;
  if (!ctx) return evalRule(id, false, "context なし", null);

  const globalAvg = contextGlobalWinRate(input.global);
  const canCompareAvg =
    globalAvg != null &&
    (input.global?.raw.posts ?? 0) >= MIN_GLOBAL_POSTS_FOR_AVG;

  const candidates: Array<{ teamName: string; winRate: number }> = [];

  for (const [teamId, teamName] of [
    [input.homeTeamId, input.homeTeamName],
    [input.awayTeamId, input.awayTeamName],
  ] as const) {
    if (!teamId) continue;
    const bucket = ctx.teams[teamId];
    if (!bucket || bucket.posts < MIN_TEAM_POSTS) continue;
    const winRate = contextWinRate(bucket);
    if (winRate == null || winRate < STRONG_WIN_RATE) continue;
    if (canCompareAvg && winRate <= globalAvg) continue;
    candidates.push({ teamName, winRate });
  }

  if (candidates.length === 0) {
    return evalRule(id, false, "得意チーム条件未達", null);
  }

  candidates.sort((a, b) => b.winRate - a.winRate);
  const top = candidates[0]!;
  return evalRule(id, true, `${top.teamName} 勝率 ${pct(top.winRate)}%`, {
    id,
    params: {
      team: top.teamName,
      userPct: pct(top.winRate),
      avgPct: canCompareAvg ? pct(globalAvg!) : "—",
    },
  });
}

function pickTeamWeak(input: PredictTimingAdviceV1Input): TimingRuleEval {
  const id = "teamWeak" as const;
  const ctx = input.context;
  if (!ctx) return evalRule(id, false, "context なし", null);

  for (const [teamId, teamName] of [
    [input.homeTeamId, input.homeTeamName],
    [input.awayTeamId, input.awayTeamName],
  ] as const) {
    if (!teamId) continue;
    const bucket = ctx.teams[teamId];
    if (!bucket || bucket.posts < MIN_TEAM_POSTS) continue;
    const winRate = contextWinRate(bucket);
    if (winRate == null || winRate > WEAK_WIN_RATE) continue;
    return evalRule(id, true, `${teamName} 勝率 ${pct(winRate)}%`, {
      id,
      params: { team: teamName, userPct: pct(winRate) },
    });
  }

  return evalRule(id, false, "苦手チーム条件未達", null);
}

function pickTeamUpsetContext(
  input: PredictTimingAdviceV1Input
): TimingRuleEval {
  const id = "teamUpsetContext" as const;
  const contexts = input.teamUpsetContexts ?? [];
  if (contexts.length === 0) {
    return evalRule(id, false, "チーム upset 文脈なし", null);
  }

  const matchIds = new Set(
    [input.homeTeamId, input.awayTeamId].filter(Boolean)
  );

  let best: TeamUpsetContext | null = null;
  let bestDelta = 0;

  for (const row of contexts) {
    if (!matchIds.has(row.teamId)) continue;
    if (row.totalGames < MIN_TEAM_UPSET_GAMES) continue;
    const rate = row.upsetGames / row.totalGames;
    const delta = rate - row.tournamentAvgUpsetRate;
    if (delta < 0.15) continue;
    if (delta > bestDelta) {
      best = row;
      bestDelta = delta;
    }
  }

  if (!best) {
    return evalRule(id, false, "大会平均より明確に高くない", null);
  }

  return evalRule(
    id,
    true,
    `${best.teamName} ${best.upsetGames}/${best.totalGames}`,
    {
      id,
      params: {
        team: best.teamName,
        upset: best.upsetGames,
        total: best.totalGames,
      },
    }
  );
}

function pickAwayWeak(input: PredictTimingAdviceV1Input): TimingRuleEval {
  const id = "awayWeak" as const;
  const ctx = input.context;
  if (!ctx) return evalRule(id, false, "context なし", null);

  const overall = contextWinRate(ctx.raw);
  const away = ctx.homeAway.away;
  const awayRate = contextWinRate(away);

  if (
    overall == null ||
    awayRate == null ||
    away.posts < MIN_PATTERN_POSTS
  ) {
    return evalRule(id, false, "アウェイ母数不足", null);
  }
  if (awayRate > overall - AWAY_GAP) {
    return evalRule(
      id,
      false,
      `差 ${pct((overall - awayRate) * 100) / 100}pt < ${pct(AWAY_GAP * 100)}pt`,
      null
    );
  }

  return evalRule(id, true, `アウェイ勝率 ${pct(awayRate)}%`, {
    id,
    params: { userPct: pct(awayRate) },
  });
}

function pickUnderdogStrong(
  input: PredictTimingAdviceV1Input
): TimingRuleEval {
  const id = "underdogStrong" as const;
  const ctx = input.context;
  if (!ctx) return evalRule(id, false, "context なし", null);

  const picks = ctx.market.underdogPickCount;
  const rate = contextUnderdogWinRate(ctx.market);
  if (picks < MIN_PATTERN_POSTS || rate == null) {
    return evalRule(id, false, "逆張り母数不足", null);
  }

  const globalUnd =
    input.global?.market &&
    input.global.market.underdogPickCount > 0
      ? input.global.market.underdogWins /
        input.global.market.underdogPickCount
      : null;

  const overall = contextWinRate(ctx.raw);
  const beatsGlobal = globalUnd != null && rate > globalUnd + 0.05;
  const beatsSelf = overall != null && rate > overall + 0.05;

  if (!beatsGlobal && !beatsSelf) {
    return evalRule(id, false, "逆張り的中率が平均より高くない", null);
  }

  return evalRule(
    id,
    true,
    `${ctx.market.underdogWins}/${picks} 的中`,
    {
      id,
      params: {
        hits: ctx.market.underdogWins,
        picks,
      },
    }
  );
}

const PICKERS = [
  pickTeamStrong,
  pickTeamWeak,
  pickTeamUpsetContext,
  pickAwayWeak,
  pickUnderdogStrong,
] as const;

export function explainPredictTimingAdviceV1(
  input: PredictTimingAdviceV1Input
): TimingRuleEval[] {
  return PICKERS.map((pick) => pick(input));
}

/** 予想フォームに載せる最大件数（強い文脈から順に） */
export const PREDICT_TIMING_MAX_LINES = 2;

export function buildPredictTimingAdviceV1(
  input: PredictTimingAdviceV1Input
): {
  /** 最優先 1 件（後方互換） */
  advice: PredictTimingAdvice | null;
  /** 強い文脈から最大 PREDICT_TIMING_MAX_LINES 件 */
  advices: PredictTimingAdvice[];
  evals: TimingRuleEval[];
} {
  const evals = explainPredictTimingAdviceV1(input);
  const advices = evals
    .filter((row) => row.hit && row.advice)
    .slice(0, PREDICT_TIMING_MAX_LINES)
    .map((row) => row.advice!);
  return { advice: advices[0] ?? null, advices, evals };
}
