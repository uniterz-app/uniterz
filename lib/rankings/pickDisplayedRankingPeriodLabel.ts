/**
 * 週間・月間ランキングの「表示中の期間」。
 * カレンダー上は新期間でも、その期間の最初の試合日の全試合が settle するまでは前期間を出す。
 *（Unit 付与はカレンダー基準のまま。表示だけ遅らせる）
 */

export function pickDisplayedRankingPeriodLabel(opts: {
  calendarLabel: string;
  previousLabel: string | null;
  /** 新期間内で最初に tip-off がある Eastern 暦日。試合がまだ無いときは null */
  firstGameDayKey: string | null;
  /** その試合日の全試合が resultComputedAtV2 済み */
  firstGameDaySettled: boolean;
}): string {
  const prev = opts.previousLabel?.trim() || null;
  if (!prev) return opts.calendarLabel;
  if (!opts.firstGameDayKey || !opts.firstGameDaySettled) return prev;
  return opts.calendarLabel;
}
