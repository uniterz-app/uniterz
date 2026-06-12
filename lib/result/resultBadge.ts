import type { PredictionPostV2 } from "@/types/prediction-post-v2";
import type { ResultCardBadge } from "@/lib/result/resultGlass";
import { getWinStreakBadge, type WinStreakBadgeStyle } from "@/lib/ui/winStreakBadge";
import type { Language } from "@/lib/i18n/language";

function toInt(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? Math.round(v) : null;
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
  if (post.stats?.upsetHit) badge = "upset";
  else if (streakBadge) badge = "streak";
  else if (post.stats?.isWin) badge = "hit";
  else if (post.stats && post.stats.isWin === false) badge = "miss";

  return { badge, activeWinStreak, streakBadge };
}
