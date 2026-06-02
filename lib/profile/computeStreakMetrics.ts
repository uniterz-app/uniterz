export type StreakMetrics = {
  /** 直近の確定結果時点の連勝（負け直後は 0） */
  currentStreak: number;
  /** スコープ内の最大連勝 */
  maxWinStreak: number;
};

/**
 * 古い順に並んだ勝敗から、現在連勝と最大連勝を算出する。
 */
export function computeStreakMetricsFromResults(
  resultsOldestFirst: readonly boolean[]
): StreakMetrics {
  let run = 0;
  let maxWin = 0;

  for (const isWin of resultsOldestFirst) {
    if (isWin) {
      run += 1;
      if (run > maxWin) maxWin = run;
    } else {
      run = 0;
    }
  }

  return {
    currentStreak: run,
    maxWinStreak: maxWin,
  };
}
