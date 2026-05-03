/**
 * Last20 Tracker（連勝チャート）の Web / ネイティブ共通レイアウト。
 */

/** Y軸スケールの下限。データの最大が小さいときも上下各5ブロックの目盛りに揃える */
export const STREAK_TRACKER_CHART_MIN_ABS = 5;

/** チャート描画用の |Y| 最大値（実データと下限の大きい方） */
export function streakChartLayoutMaxAbs(
  rows: readonly { streakAfter: number }[]
): number {
  let m = 1;
  for (const r of rows) {
    m = Math.max(m, Math.abs(r.streakAfter));
  }
  return Math.max(STREAK_TRACKER_CHART_MIN_ABS, m);
}

/**
 * 確定日時が端末ローカルタイムゾーンの「今日」と同一カレンダー日か。
 * Last20 Tracker の横軸インデックスで当日列だけ強調するために使う。
 */
export function streakPointSettledAtIsLocalToday(
  settledAtMs: number,
  nowMs: number = Date.now()
): boolean {
  if (!Number.isFinite(settledAtMs) || !Number.isFinite(nowMs)) return false;
  const a = new Date(settledAtMs);
  const b = new Date(nowMs);
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
