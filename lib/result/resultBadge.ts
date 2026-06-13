import type { PredictionPostV2 } from "@/types/prediction-post-v2";
import type { ResultCardBadge } from "@/lib/result/resultGlass";
import { getWinStreakBadge, type WinStreakBadgeStyle } from "@/lib/ui/winStreakBadge";
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

/** 勝利時の HIT / PERFECT（未勝利は null） */
export function resolveWinOutcomeBadge(
  post: PerfectScoreCheckInput
): "hit" | "perfect" | null {
  if (post.stats?.isWin !== true) return null;
  return isPerfectScoreHit(post) ? "perfect" : "hit";
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

  let badge: ResultCardBadge = null;
  const winBadge = resolveWinOutcomeBadge(post);
  if (winBadge) badge = winBadge;
  else if (post.stats?.upsetHit) badge = "upset";
  else if (streakBadge) badge = "streak";
  else if (post.stats && post.stats.isWin === false) badge = "miss";

  return { badge, activeWinStreak, streakBadge };
}
