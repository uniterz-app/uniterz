/**
 * Web `ResultImpactStreakTag` 相当。リザルトカード左上 IMPACT 連勝タグ。
 */
import { ImpactTag } from "./resultBadgeDesignPreviewPatterns";
import { streakTagLabel, streakTagTone } from "@/lib/result/streakTagTone";
import { normalizeWinStreak } from "@/lib/ui/normalizeWinStreak";

export default function ResultImpactStreakTagNative({
  winStreak,
}: {
  winStreak: number;
}) {
  const n = normalizeWinStreak(winStreak);
  if (n < 3) return null;
  return <ImpactTag label={streakTagLabel(n)} color={streakTagTone(n).accent} />;
}
