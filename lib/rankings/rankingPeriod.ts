/**
 * NBA ランキング期間: Season（累計）/ Weekly（月曜始まり JST）/ Monthly（暦月 JST）
 * functions/src/rankings/nbaPeriod.ts と定義を同期すること。
 */

import {
  dateKeyJST,
  subtractDaysFromDateKeyJST,
} from "@/lib/rankings/rankSnapshotDate";

export type RankingPeriod = "season" | "weekly" | "monthly";

export const RANKING_PERIODS: readonly RankingPeriod[] = [
  "season",
  "weekly",
  "monthly",
] as const;

export function isRankingPeriod(
  v: string | null | undefined
): v is RankingPeriod {
  return (
    v === "season" || v === "weekly" || v === "monthly"
  );
}

export type RankingPeriodRange = {
  period: Exclude<RankingPeriod, "season">;
  startKey: string;
  endKey: string;
  /** 期間の識別子（weekly: 週初め月曜の dateKey / monthly: YYYY-MM） */
  labelKey: string;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function addDaysToDateKey(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const base = new Date(Date.UTC(y, m - 1, d + days));
  return `${base.getUTCFullYear()}-${pad2(base.getUTCMonth() + 1)}-${pad2(
    base.getUTCDate()
  )}`;
}

/** 今週の開始日（直近の月曜・当日が月曜なら当日） */
export function resolveRankingWeekStartDateKey(
  now: Date = new Date()
): string {
  const todayKey = dateKeyJST(now);
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const daysSinceMonday = (jst.getUTCDay() + 6) % 7;
  return subtractDaysFromDateKeyJST(todayKey, daysSinceMonday);
}

/** 今週（月曜始まり）の日付範囲 */
export function resolveWeeklyRankingRange(
  now: Date = new Date()
): RankingPeriodRange {
  const startKey = resolveRankingWeekStartDateKey(now);
  const endKey = dateKeyJST(now);
  return {
    period: "weekly",
    startKey,
    endKey,
    labelKey: startKey,
  };
}

/** 今月（JST 暦月）の日付範囲 */
export function resolveMonthlyRankingRange(
  now: Date = new Date()
): RankingPeriodRange {
  const endKey = dateKeyJST(now);
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const y = jst.getUTCFullYear();
  const m = jst.getUTCMonth() + 1;
  const startKey = `${y}-${pad2(m)}-01`;
  return {
    period: "monthly",
    startKey,
    endKey,
    labelKey: `${y}-${pad2(m)}`,
  };
}

export function resolveRankingPeriodRange(
  period: Exclude<RankingPeriod, "season">,
  now: Date = new Date()
): RankingPeriodRange {
  return period === "weekly"
    ? resolveWeeklyRankingRange(now)
    : resolveMonthlyRankingRange(now);
}

/** 現在期間の labelKey（weekly: 今週月曜 / monthly: 今月 YYYY-MM） */
export function currentRankingPeriodLabel(
  period: Exclude<RankingPeriod, "season">,
  now: Date = new Date()
): string {
  return resolveRankingPeriodRange(period, now).labelKey;
}

/** labelKey の形式チェック（weekly: YYYY-MM-DD / monthly: YYYY-MM） */
export function isValidPeriodLabel(
  period: Exclude<RankingPeriod, "season">,
  label: string
): boolean {
  return period === "weekly"
    ? /^\d{4}-\d{2}-\d{2}$/.test(label)
    : /^\d{4}-\d{2}$/.test(label);
}

/**
 * 過去も含む任意の labelKey から日付範囲を復元する。
 * endKey は「期間終端」と「今日」の早い方。
 */
export function resolveRankingPeriodRangeForLabel(
  period: Exclude<RankingPeriod, "season">,
  label: string,
  now: Date = new Date()
): RankingPeriodRange {
  const todayKey = dateKeyJST(now);
  if (period === "weekly") {
    const startKey = label;
    const fullEnd = addDaysToDateKey(startKey, 6);
    return {
      period,
      startKey,
      endKey: fullEnd < todayKey ? fullEnd : todayKey,
      labelKey: label,
    };
  }
  const [y, m] = label.split("-").map(Number);
  const startKey = `${y}-${pad2(m)}-01`;
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const fullEnd = `${y}-${pad2(m)}-${pad2(lastDay)}`;
  return {
    period,
    startKey,
    endKey: fullEnd < todayKey ? fullEnd : todayKey,
    labelKey: label,
  };
}

/** 期間内の最小投稿数（一覧参加） */
export function periodMinPosts(
  period: Exclude<RankingPeriod, "season">
): number {
  return period === "weekly" ? 1 : 10;
}

/** 勝率タブの最小投稿数 */
export function periodWinRateMinPosts(
  period: Exclude<RankingPeriod, "season">
): number {
  return period === "weekly" ? 3 : 10;
}

/** start〜end の dateKey を列挙（両端含む） */
export function enumerateDateKeysInclusive(
  startKey: string,
  endKey: string
): string[] {
  if (startKey > endKey) return [];
  const out: string[] = [];
  let cur = startKey;
  let guard = 0;
  while (cur <= endKey && guard < 400) {
    out.push(cur);
    if (cur === endKey) break;
    cur = addDaysToDateKey(cur, 1);
    guard += 1;
  }
  return out;
}

export { subtractDaysFromDateKeyJST, dateKeyJST };
