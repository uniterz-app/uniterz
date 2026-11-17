/**
 * 週間・月間ランキングの「表示中の期間」。
 * カレンダー上は新期間でも、その期間の最初の試合日の全試合が settle するまでは前期間を出す。
 *（Unit 付与はカレンダー基準のまま。表示だけ遅らせる）
 *
 * 初日の ET 暦日がすでに昨日以前なら、settle フラグが欠けていても今期間を出す
 *（途中で 10 月に張り付くのを防ぐ。例: 11 月中は 11 月、12/1 の試合が終わるまで 11 月）。
 */

export function pickDisplayedRankingPeriodLabel(opts: {
  calendarLabel: string;
  previousLabel: string | null;
  /** 新期間内で最初に tip-off がある Eastern 暦日。試合がまだ無いときは null */
  firstGameDayKey: string | null;
  /** その試合日の全試合が resultComputedAtV2 済み */
  firstGameDaySettled: boolean;
  /** 今日の Eastern 暦日 YYYY-MM-DD */
  todayKey: string;
}): string {
  const prev = opts.previousLabel?.trim() || null;
  if (!prev) return opts.calendarLabel;

  const first = opts.firstGameDayKey?.trim() || null;
  if (!first) return prev;

  // 初日はもう過ぎた → 今期間（settle 欠落で前期間固定しない）
  if (first < opts.todayKey) return opts.calendarLabel;
  // 初日はまだ先 → 前期間
  if (first > opts.todayKey) return prev;
  // 初日＝今日 → 全試合 settle まで前期間
  return opts.firstGameDaySettled ? opts.calendarLabel : prev;
}
