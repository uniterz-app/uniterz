/**
 * 週次・月次ランキング／Unit 付与／レポート共通の期間時計。
 * 全員共通で America/New_York（US Eastern、DST あり）。
 */
import {
  TIMEZONE_ET,
  getZonedYMD,
  toDateKeyInTimeZone,
  zonedTimeToUtcMs,
} from "@/lib/time/zonedTime";

export const RANKING_PERIOD_TIMEZONE = TIMEZONE_ET;

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function addDaysToDateKey(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const base = new Date(Date.UTC(y, m - 1, d + days));
  return `${base.getUTCFullYear()}-${pad2(base.getUTCMonth() + 1)}-${pad2(
    base.getUTCDate()
  )}`;
}

/** Eastern 暦の今日 YYYY-MM-DD */
export function rankingPeriodTodayKey(now: Date = new Date()): string {
  return toDateKeyInTimeZone(now, RANKING_PERIOD_TIMEZONE);
}

/** dateKey（Eastern 暦日）の月曜=0 … 日曜=6 */
export function rankingPeriodWeekdayMon0(dateKey: string): number {
  const [y, m, d] = dateKey.split("-").map(Number);
  const noonMs = zonedTimeToUtcMs({
    year: y,
    month: m,
    day: d,
    hour: 12,
    timeZone: RANKING_PERIOD_TIMEZONE,
  });
  const short = new Intl.DateTimeFormat("en-US", {
    timeZone: RANKING_PERIOD_TIMEZONE,
    weekday: "short",
  }).format(new Date(noonMs));
  const map: Record<string, number> = {
    Mon: 0,
    Tue: 1,
    Wed: 2,
    Thu: 3,
    Fri: 4,
    Sat: 5,
    Sun: 6,
  };
  return map[short] ?? 0;
}

/** 今週の開始（Eastern 月曜） */
export function rankingPeriodWeekStartKey(now: Date = new Date()): string {
  const today = rankingPeriodTodayKey(now);
  return addDaysToDateKey(today, -rankingPeriodWeekdayMon0(today));
}

/** 今月ラベル YYYY-MM（Eastern 暦月） */
export function rankingPeriodMonthLabel(now: Date = new Date()): string {
  const { year, month } = getZonedYMD(now, RANKING_PERIOD_TIMEZONE);
  return `${year}-${pad2(month)}`;
}

/** tip-off 瞬間 → Eastern 暦日キー（user_stats_v2_daily.date） */
export function tipOffToRankingDateKey(tipOff: Date): string {
  return toDateKeyInTimeZone(tipOff, RANKING_PERIOD_TIMEZONE);
}

/** Eastern 暦日の [start, end] 瞬間（Firestore tip-off 範囲用） */
export function rankingPeriodDayBoundsUtc(dateKey: string): {
  start: Date;
  end: Date;
} {
  const [y, m, d] = dateKey.split("-").map(Number);
  const startMs = zonedTimeToUtcMs({
    year: y,
    month: m,
    day: d,
    timeZone: RANKING_PERIOD_TIMEZONE,
    hour: 0,
    minute: 0,
    second: 0,
  });
  const next = addDaysToDateKey(dateKey, 1);
  const [ny, nm, nd] = next.split("-").map(Number);
  const nextStartMs = zonedTimeToUtcMs({
    year: ny,
    month: nm,
    day: nd,
    timeZone: RANKING_PERIOD_TIMEZONE,
    hour: 0,
    minute: 0,
    second: 0,
  });
  return {
    start: new Date(startMs),
    end: new Date(nextStartMs - 1),
  };
}
