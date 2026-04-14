/** 枠走光の色分け（3連勝以上。5・7・10 の区切りでティア切り替え） */
export type StreakCyberTier = 1 | 2 | 3 | 4;

/**
 * activeWinStreak から走光ティアを返す。
 * - 3〜4: 1
 * - 5〜6: 2
 * - 7〜9: 3
 * - 10以上: 4
 */
export function activeWinStreakToCyberTier(
  streak: unknown
): StreakCyberTier | null {
  const v =
    typeof streak === "number" && Number.isFinite(streak)
      ? Math.floor(streak)
      : 0;
  if (v < 3) return null;
  if (v >= 10) return 4;
  if (v >= 7) return 3;
  if (v >= 5) return 2;
  return 1;
}
