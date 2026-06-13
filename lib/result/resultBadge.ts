import type { PredictionPostV2 } from "@/types/prediction-post-v2";
import type { ResultCardBadge } from "@/lib/result/resultGlass";
import { getWinStreakBadge, normalizeWinStreak, type WinStreakBadgeStyle } from "@/lib/ui/winStreakBadge";
import type { Language } from "@/lib/i18n/language";

function toInt(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? Math.round(v) : null;
}

type PerfectScoreCheckInput = {
  stats?: {
    isWin?: boolean | null;
    scoreError?: number | null;
  } | null;
  prediction?: {
    score?: { home?: number; away?: number };
  } | null;
  result?: {
    home?: number;
    away?: number;
  } | null;
};

/** 予想スコアと結果スコアが完全一致（scoreError === 0） */
export function isPerfectScoreHit(post: PerfectScoreCheckInput): boolean {
  if (post.stats?.isWin !== true) return false;

  const scoreError = post.stats?.scoreError;
  if (typeof scoreError === "number" && Number.isFinite(scoreError)) {
    return scoreError === 0;
  }

  const pred = post.prediction?.score;
  const actual = post.result;
  if (
    pred &&
    actual &&
    typeof pred.home === "number" &&
    typeof pred.away === "number" &&
    typeof actual.home === "number" &&
    typeof actual.away === "number"
  ) {
    return pred.home === actual.home && pred.away === actual.away;
  }

  return false;
}

export type ResolveResultOutcomeInput = PerfectScoreCheckInput & {
  upsetHit?: boolean;
  isWin?: boolean | null;
  activeWinStreak?: unknown;
};

/** リザルト outcome バッジの優先順: PERFECT → UPSET → 連勝 → HIT → MISS */
export function resolveResultOutcomeBadge(
  input: ResolveResultOutcomeInput
): ResultCardBadge {
  if (isPerfectScoreHit(input)) return "perfect";
  if (input.upsetHit) return "upset";
  if (normalizeWinStreak(input.activeWinStreak) >= 3) return "streak";
  if (input.isWin === true || input.stats?.isWin === true) return "hit";
  if (input.isWin === false || input.stats?.isWin === false) return "miss";
  return null;
}

export type ResolvedResultBadge = {
  badge: ResultCardBadge;
  activeWinStreak: number;
  streakBadge: WinStreakBadgeStyle | null;
};

/** リザルトカード／MatchCard 統合表示で共通のバッジ判定 */
export function resolveResultCardBadge(
  post: PredictionPostV2,
  language: Language
): ResolvedResultBadge {
  const activeWinStreak =
    toInt((post.stats as { pointsV3Detail?: { activeWinStreak?: unknown } })
      ?.pointsV3Detail?.activeWinStreak) ?? 0;
  const streakBadge = getWinStreakBadge(activeWinStreak, language);

  const badge = resolveResultOutcomeBadge({
    stats: post.stats,
    prediction: post.prediction,
    result: post.result,
    upsetHit: Boolean(post.stats?.upsetHit),
    isWin: post.stats?.isWin,
    activeWinStreak,
  });

  return { badge, activeWinStreak, streakBadge };
}
