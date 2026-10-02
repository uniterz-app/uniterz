// functions/src/rankings/nbaPeriod.ts
// NBA Weekly（月曜始まり US Eastern）/ Monthly（暦月 Eastern）の期間定義。
// Next 側 lib/rankings/rankingPeriod.ts + rankingPeriodClock.ts と定義を同期すること。

export type NbaRankingPeriod = "weekly" | "monthly";

export type NbaPeriodRange = {
  period: NbaRankingPeriod;
  startKey: string;
  endKey: string;
  /** weekly: 週初め月曜の dateKey / monthly: YYYY-MM */
  labelKey: string;
};

export const RANKING_PERIOD_TIMEZONE = "America/New_York";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function getZonedYMD(date: Date, timeZone: string): {
  year: number;
  month: number;
  day: number;
} {
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
  return { year: get("year"), month: get("month"), day: get("day") };
}

function getTimeZoneOffsetMinutes(date: Date, timeZone: string): number {
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
  if ([year, month, day, hour, minute, second].some((n) => Number.isNaN(n))) {
    return 0;
  }
  const asUTCms = Date.UTC(year, month - 1, day, hour, minute, second);
  return (asUTCms - date.getTime()) / 60000;
}

function zonedTimeToUtcMs(params: {
  year: number;
  month: number;
  day: number;
  hour?: number;
  minute?: number;
  second?: number;
  timeZone: string;
}): number {
  const {
    year,
    month,
    day,
    hour = 0,
    minute = 0,
    second = 0,
    timeZone,
  } = params;
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, second);
  const offset1 = getTimeZoneOffsetMinutes(new Date(utcGuess), timeZone);
  const utc1 = utcGuess - offset1 * 60000;
  const offset2 = getTimeZoneOffsetMinutes(new Date(utc1), timeZone);
  return utcGuess - offset2 * 60000;
}

/** Eastern 暦の今日 YYYY-MM-DD（旧名 dateKeyJST 互換） */
export function dateKeyET(now: Date = new Date()): string {
  const { year, month, day } = getZonedYMD(now, RANKING_PERIOD_TIMEZONE);
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

/** @deprecated 中身は Eastern。呼び出し互換のため残す */
export function dateKeyJST(now: Date = new Date()): string {
  return dateKeyET(now);
}

export function addDaysToDateKey(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const base = new Date(Date.UTC(y, m - 1, d + days));
  return `${base.getUTCFullYear()}-${pad2(base.getUTCMonth() + 1)}-${pad2(
    base.getUTCDate()
  )}`;
}

function weekdayMon0(dateKey: string): number {
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

/** 今週の開始日（Eastern 月曜） */
export function weekStartDateKeyET(now: Date = new Date()): string {
  const todayKey = dateKeyET(now);
  return addDaysToDateKey(todayKey, -weekdayMon0(todayKey));
}

/** Eastern 暦で月曜か（週次 Unit 付与日） */
export function isEasternMonday(now: Date = new Date()): boolean {
  return weekdayMon0(dateKeyET(now)) === 0;
}

/** Eastern 暦で毎月1日か（月次 Unit 付与日） */
export function isEasternMonthStart(now: Date = new Date()): boolean {
  return dateKeyET(now).endsWith("-01");
}

/** @deprecated 中身は Eastern */
export function weekStartDateKeyJST(now: Date = new Date()): string {
  return weekStartDateKeyET(now);
}

/** 今月ラベル（YYYY-MM・Eastern） */
export function monthLabelET(now: Date = new Date()): string {
  const { year, month } = getZonedYMD(now, RANKING_PERIOD_TIMEZONE);
  return `${year}-${pad2(month)}`;
}

/** @deprecated 中身は Eastern */
export function monthLabelJST(now: Date = new Date()): string {
  return monthLabelET(now);
}

/** tip-off → Eastern 暦日（user_stats_v2_daily.date / NBA） */
export function tipOffToRankingDateKeyET(tipOff: Date): string {
  return dateKeyET(tipOff);
}

/** Eastern 暦日の [start, endExclusive) UTC Date */
export function rankingPeriodDayBoundsUtc(dateKey: string): {
  start: Date;
  endExclusive: Date;
} {
  const [y, m, d] = dateKey.split("-").map(Number);
  const startMs = zonedTimeToUtcMs({
    year: y,
    month: m,
    day: d,
    timeZone: RANKING_PERIOD_TIMEZONE,
  });
  const next = addDaysToDateKey(dateKey, 1);
  const [ny, nm, nd] = next.split("-").map(Number);
  const nextStartMs = zonedTimeToUtcMs({
    year: ny,
    month: nm,
    day: nd,
    timeZone: RANKING_PERIOD_TIMEZONE,
  });
  return {
    start: new Date(startMs),
    endExclusive: new Date(nextStartMs),
  };
}

/** labelKey から期間範囲を復元（endKey は期間終端と今日の早い方） */
export function rangeForLabel(
  period: NbaRankingPeriod,
  label: string,
  now: Date = new Date()
): NbaPeriodRange {
  const todayKey = dateKeyET(now);
  if (period === "weekly") {
    const fullEnd = addDaysToDateKey(label, 6);
    return {
      period,
      startKey: label,
      endKey: fullEnd < todayKey ? fullEnd : todayKey,
      labelKey: label,
    };
  }
  const [y, m] = label.split("-").map(Number);
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const fullEnd = `${y}-${pad2(m)}-${pad2(lastDay)}`;
  return {
    period,
    startKey: `${y}-${pad2(m)}-01`,
    endKey: fullEnd < todayKey ? fullEnd : todayKey,
    labelKey: label,
  };
}

/** 前の期間の labelKey */
export function previousLabel(
  period: NbaRankingPeriod,
  label: string
): string {
  if (period === "weekly") return addDaysToDateKey(label, -7);
  const [y, m] = label.split("-").map(Number);
  const prev = new Date(Date.UTC(y, m - 2, 1));
  return `${prev.getUTCFullYear()}-${pad2(prev.getUTCMonth() + 1)}`;
}

/** 期間内の最小投稿数（一覧参加） */
export function periodMinPosts(period: NbaRankingPeriod): number {
  return period === "weekly" ? 1 : 10;
}

/** 勝率タブの最小投稿数 */
export function periodWinRateMinPosts(period: NbaRankingPeriod): number {
  return period === "weekly" ? 3 : 10;
}

/**
 * 期間開始直後の猶予日数（0 = なし）。
 * 0 のとき: 新しい週／月に入った最初の日に前期間を最終スナップショットし、
 * そのまま Unit / Pro Skin 付与する（遅延精算待ちなし）。
 * 1 以上のとき: 開始日からその日数以内は前期間を再集計し、付与は猶予明け。
 */
export const PERIOD_FINALIZE_GRACE_DAYS = 0;
