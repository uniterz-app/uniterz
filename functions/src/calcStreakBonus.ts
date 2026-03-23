export function calcStreakBonus(activeWinStreak: number): number {
  if (!Number.isFinite(activeWinStreak) || activeWinStreak < 3) return 0;
  if (activeWinStreak >= 7) return 3;
  if (activeWinStreak >= 5) return 2;
  return 1;
}