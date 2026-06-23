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
    exactMatch?: boolean | null;
    pointsV3Detail?: { exactMatch?: boolean | null } | null;
  } | null;
  prediction?: {
    score?: { home?: number; away?: number };
  } | null;
  result?: {
    home?: number;
    away?: number;
  } | null;
};

function hasStoredExactMatch(
  stats: PerfectScoreCheckInput["stats"]
): boolean {
  if (stats?.exactMatch === true) return true;
  if (stats?.pointsV3Detail?.exactMatch === true) return true;
  return false;
}

/** 予想スコアと結果スコアが完全一致（WC: stats.exactMatch / NBA: scoreError === 0） */
export function isPerfectScoreHit(post: PerfectScoreCheckInput): boolean {
  if (hasStoredExactMatch(post.stats)) return true;

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

export type ResultOutcomeOnlyBadge = Exclude<ResultCardBadge, "streak">;

/** HIT / PERFECT / UPSET / MISS のみ（連勝は含めない） */
export function resolveResultOutcomeOnlyBadge(
  input: ResolveResultOutcomeInput
): ResultOutcomeOnlyBadge {
  if (isPerfectScoreHit(input)) return "perfect";
  if (input.upsetHit) return "upset";
  if (input.isWin === true || input.stats?.isWin === true) return "hit";
  if (input.isWin === false || input.stats?.isWin === false) return "miss";
  return null;
}

/** カード枠・FX 用（従来どおり連勝が outcome より優先） */
export function resolveResultFrameBadge(
  input: ResolveResultOutcomeInput
): ResultCardBadge {
  if (isPerfectScoreHit(input)) return "perfect";
  if (input.upsetHit) return "upset";
  if (normalizeWinStreak(input.activeWinStreak) >= 3) return "streak";
  if (input.isWin === true || input.stats?.isWin === true) return "hit";
  if (input.isWin === false || input.stats?.isWin === false) return "miss";
  return null;
}

export type ResultBadgeDisplay = {
  /** カード枠・FX 用 */
  frameBadge: ResultCardBadge;
  outcomeBadge: ResultOutcomeOnlyBadge;
  showStreakBadge: boolean;
  /** PERFECT / UPSET を連勝バッジの左に横並び */
  stackBadges: boolean;
};

/** バッジ表示レイアウト（枠色は frameBadge を使う） */
export function resolveResultBadgeDisplay(
  input: ResolveResultOutcomeInput
): ResultBadgeDisplay {
  const outcomeBadge = resolveResultOutcomeOnlyBadge(input);
  const showStreakBadge = normalizeWinStreak(input.activeWinStreak) >= 3;
  const stackBadges =
    showStreakBadge &&
    (outcomeBadge === "perfect" || outcomeBadge === "upset");

  return {
    frameBadge: resolveResultFrameBadge(input),
    outcomeBadge,
    showStreakBadge,
    stackBadges,
  };
}

/** @deprecated 互換用 — frameBadge と同義 */
export function resolveResultOutcomeBadge(
  input: ResolveResultOutcomeInput
): ResultCardBadge {
  return resolveResultFrameBadge(input);
}

export type ResolvedResultBadge = ResultBadgeDisplay & {
  /** frameBadge の別名（既存呼び出し向け） */
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
  const streakBadge = getWinStreakBadge(activeWinStreak, language, {
    subtle: true,
  });

  const display = resolveResultBadgeDisplay({
    stats: post.stats,
    prediction: post.prediction,
    result: post.result,
    upsetHit: Boolean(post.stats?.upsetHit),
    isWin: post.stats?.isWin,
    activeWinStreak,
  });

  return {
    ...display,
    badge: display.frameBadge,
    activeWinStreak,
    streakBadge,
  };
}
