/**
 * Shadow 週次区切り — JST 日曜始まり（日 00:00 〜 土 23:59）。
 */

import {
  dateKeyJST,
  subtractDaysFromDateKeyJST,
} from "@/lib/rankings/rankSnapshotDate";

/** 今週の開始日（直近の日曜・当日が日曜なら当日） */
export function resolveShadowWeekStartDateKey(now: Date = new Date()): string {
  const todayKey = dateKeyJST(now);
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const daysSinceSunday = jst.getUTCDay();
  return subtractDaysFromDateKeyJST(todayKey, daysSinceSunday);
}

/** 先週の開始日（帯定義用アンカー） */
export function resolveShadowBandAnchorDateKey(now: Date = new Date()): string {
  return subtractDaysFromDateKeyJST(resolveShadowWeekStartDateKey(now), 7);
}

/** 週次メトリクスの起点（今週の日曜） */
export function resolveShadowMetricAnchorDateKey(
  now: Date = new Date()
): string {
  return resolveShadowWeekStartDateKey(now);
}
