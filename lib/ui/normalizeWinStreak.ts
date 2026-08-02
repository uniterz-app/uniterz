/** 連勝数を非負整数に正規化（循環 import 回避用の単体モジュール） */
export function normalizeWinStreak(activeWinStreak: unknown): number {
  return typeof activeWinStreak === "number" && Number.isFinite(activeWinStreak)
    ? Math.max(0, Math.floor(activeWinStreak))
    : 0;
}
