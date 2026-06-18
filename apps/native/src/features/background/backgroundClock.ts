/**
 * Web `GamesPageBackground` の `BG_CLOCK_START_MS` 相当。
 * 再マウントしてもオーロラ位相がリセットされないようモジュール読込時刻を基準にする。
 */
const BG_CLOCK_START_MS = Date.now();

/** 0〜1 の周期内進捗 */
export function backgroundCycleProgress(cycleMs: number): number {
  const elapsed = Date.now() - BG_CLOCK_START_MS;
  return (elapsed % cycleMs) / cycleMs;
}

/** Reanimated の withRepeat 前に初期値へセットする用 */
export function backgroundCycleInitialValue(cycleMs: number): number {
  return backgroundCycleProgress(cycleMs);
}
