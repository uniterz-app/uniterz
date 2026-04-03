export const TIMEZONE_ET = "America/New_York";
export const TIMEZONE_JST = "Asia/Tokyo";

type YMD = { year: number; month: number; day: number };

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function getZonedYMD(date: Date, timeZone: string): YMD {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const get = (type: string) => {
    const p = parts.find((x) => x.type === type);
    return p?.value ? Number(p.value) : NaN;
  };

  const year = get("year");
  const month = get("month");
  const day = get("day");

  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
    // Should never happen, but keep the function safe.
    return { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() };
  }

  return { year, month, day };
}

function getTimeZoneOffsetMinutes(date: Date, timeZone: string): number {
  // Offset is computed as:
  // (interpreting the timeZone-wall-clock parts as if they were UTC) - (the actual instant)
  // Example: New York at UTC-4 => offsetMinutes will be about -240.
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: string) => {
    const p = parts.find((x) => x.type === type);
    return p?.value ? Number(p.value) : NaN;
  };

  const year = get("year");
  const month = get("month");
  const day = get("day");
  const hour = get("hour");
  const minute = get("minute");
  const second = get("second");

  if (
    [year, month, day, hour, minute, second].some((n) => Number.isNaN(n))
  ) {
    return 0;
  }

  const asUTCms = Date.UTC(year, month - 1, day, hour, minute, second);
  return (asUTCms - date.getTime()) / 60000;
}

/**
 * Convert a wall-clock time (year-month-day in `timeZone`) to the UTC instant (ms).
 * Handles DST by applying offset twice.
 */
export function zonedTimeToUtcMs(params: {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  hour?: number;
  minute?: number;
  second?: number;
  timeZone: string;
}): number {
  const {
    year,
    month,
    day,
    timeZone,
    hour = 0,
    minute = 0,
    second = 0,
  } = params;

  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, second);
  const guessDate = new Date(utcGuess);
  const offset1 = getTimeZoneOffsetMinutes(guessDate, timeZone);
  const utc1 = utcGuess - offset1 * 60000;

  const guessDate2 = new Date(utc1);
  const offset2 = getTimeZoneOffsetMinutes(guessDate2, timeZone);
  return utcGuess - offset2 * 60000;
}

export function toDateKeyInTimeZone(date: Date, timeZone: string): string {
  const { year, month, day } = getZonedYMD(date, timeZone);
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

export function parseDateKeyInTimeZone(dateKey: string, timeZone: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (!year || !month || !day) return null;

  const ms = zonedTimeToUtcMs({ year, month, day, timeZone });
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export function getTodayKeyInTimeZone(timeZone: string, now = new Date()): string {
  return toDateKeyInTimeZone(now, timeZone);
}

/**
 * リーダーボードの「最新として扱う確定月」キー（YYYY-MM）。
 * 日本時間の「今日」の直前の暦月（例: JST で 4 月なら 2026-03）。
 */
export function getLeaderboardLatestMonthKey(now: Date = new Date()): string {
  const { year, month } = getZonedYMD(now, TIMEZONE_JST);
  if (month === 1) return `${year - 1}-12`;
  return `${year}-${pad2(month - 1)}`;
}

/** YYYY-MM の JST 暦月の日付キー範囲（user_stats_v2_daily.date 用） */
export function getJstMonthDateKeyRange(monthKey: string): {
  startKey: string;
  endKey: string;
} {
  const m = /^(\d{4})-(\d{2})$/.exec(monthKey);
  if (!m) throw new Error(`invalid monthKey: ${monthKey}`);
  const y = Number(m[1]);
  const mo = Number(m[2]);
  if (mo < 1 || mo > 12) throw new Error(`invalid monthKey: ${monthKey}`);

  const startKey = `${monthKey}-01`;
  const lastDay = new Date(y, mo, 0).getDate();
  return { startKey, endKey: `${monthKey}-${pad2(lastDay)}` };
}

function addDaysToYmd(ymd: YMD, days: number): YMD {
  const dt = new Date(Date.UTC(ymd.year, ymd.month - 1, ymd.day));
  dt.setUTCDate(dt.getUTCDate() + days);
  return { year: dt.getUTCFullYear(), month: dt.getUTCMonth() + 1, day: dt.getUTCDate() };
}

export function getDayRangeInTimeZone(date: Date, timeZone: string): { start: Date; end: Date } {
  const ymd = getZonedYMD(date, timeZone);
  const next = addDaysToYmd(ymd, 1);

  const startMs = zonedTimeToUtcMs({
    year: ymd.year,
    month: ymd.month,
    day: ymd.day,
    timeZone,
    hour: 0,
    minute: 0,
    second: 0,
  });

  const endMs = zonedTimeToUtcMs({
    year: next.year,
    month: next.month,
    day: next.day,
    timeZone,
    hour: 0,
    minute: 0,
    second: 0,
  });

  return { start: new Date(startMs), end: new Date(endMs) };
}

