/**
 * NBA ランキング期間: Season（累計）/ Weekly（月曜始まり JST）/ Monthly（暦月 JST）
 * functions/src/rankings/nbaPeriod.ts と定義を同期すること。
 */

import {
  dateKeyJST,
  subtractDaysFromDateKeyJST,
} from "@/lib/rankings/rankSnapshotDate";
import { nbaSeasonKeyFromDateJST } from "@/lib/rankings/nbaSeason";

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

/** NBA シーズン開始日（10/1 JST） */
export function nbaSeasonCalendarStartKey(seasonKey: string): string {
  const startYear = Number.parseInt(seasonKey.slice(0, 4), 10);
  if (!Number.isFinite(startYear)) return `${seasonKey}-10-01`;
  return `${startYear}-10-01`;
}

/**
 * プロフィール / ランキング用 — 現シーズン内の選択可能ラベル（新しい順）。
 * weekly: 週初め月曜 / monthly: YYYY-MM
 */
export function listRankingPeriodLabels(
  period: Exclude<RankingPeriod, "season">,
  opts?: { seasonKey?: string; now?: Date; limit?: number }
): string[] {
  const now = opts?.now ?? new Date();
  const seasonKey = opts?.seasonKey ?? nbaSeasonKeyFromDateJST(now);
  const limit = opts?.limit ?? 52;
  const current = currentRankingPeriodLabel(period, now);
  const labels: string[] = [];

  if (period === "monthly") {
    const startYear = Number.parseInt(seasonKey.slice(0, 4), 10);
    let y = startYear;
    let m = 10;
    const [cy, cm] = current.split("-").map(Number);
    while (y < cy || (y === cy && m <= cm)) {
      labels.push(`${y}-${pad2(m)}`);
      m += 1;
      if (m > 12) {
        m = 1;
        y += 1;
      }
      if (labels.length > limit + 4) break;
    }
  } else {
    const seasonStart = nbaSeasonCalendarStartKey(seasonKey);
    let weekStart = resolveRankingWeekStartDateKey(
      new Date(`${seasonStart}T12:00:00+09:00`)
    );
    if (weekStart < seasonStart) {
      weekStart = addDaysToDateKey(weekStart, 7);
    }
    while (weekStart <= current && labels.length < limit + 4) {
      labels.push(weekStart);
      weekStart = addDaysToDateKey(weekStart, 7);
    }
  }

  const uniq = [...new Set(labels)].filter((l) => l <= current);
  uniq.sort((a, b) => (a < b ? 1 : -1));
  return uniq.slice(0, limit);
}

function weekEndLabelFromStart(startKey: string): string {
  return addDaysToDateKey(startKey, 6);
}

/** プロフィールカード用の期間表示（週次 / 月次） */
export function formatRankingPeriodDisplay(
  period: Exclude<RankingPeriod, "season">,
  label: string,
  language: "ja" | "en"
): string {
  if (period === "weekly") {
    const [, m1, d1] = label.split("-");
    const [, m2, d2] = weekEndLabelFromStart(label).split("-");
    return `${Number(m1)}/${Number(d1)} – ${Number(m2)}/${Number(d2)}`;
  }
  const [y, m] = label.split("-").map(Number);
  if (language === "en") {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return `${months[m - 1]} ${y}`;
  }
  return `${y}年${m}月`;
}

export { subtractDaysFromDateKeyJST, dateKeyJST };
