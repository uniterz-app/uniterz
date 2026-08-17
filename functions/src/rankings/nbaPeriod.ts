// functions/src/rankings/nbaPeriod.ts
// NBA Weekly（月曜始まり JST）/ Monthly（暦月 JST）の期間定義。
// Next 側 lib/rankings/rankingPeriod.ts と定義を同期すること。

export type NbaRankingPeriod = "weekly" | "monthly";

export type NbaPeriodRange = {
  period: NbaRankingPeriod;
  startKey: string;
  endKey: string;
  /** weekly: 週初め月曜の dateKey / monthly: YYYY-MM */
  labelKey: string;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function dateKeyJST(now: Date = new Date()): string {
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return `${jst.getUTCFullYear()}-${pad2(jst.getUTCMonth() + 1)}-${pad2(
    jst.getUTCDate()
  )}`;
}

export function addDaysToDateKey(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const base = new Date(Date.UTC(y, m - 1, d + days));
  return `${base.getUTCFullYear()}-${pad2(base.getUTCMonth() + 1)}-${pad2(
    base.getUTCDate()
  )}`;
}

/** 今週の開始日（直近の月曜・当日が月曜なら当日） */
export function weekStartDateKeyJST(now: Date = new Date()): string {
  const todayKey = dateKeyJST(now);
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const daysSinceMonday = (jst.getUTCDay() + 6) % 7;
  return addDaysToDateKey(todayKey, -daysSinceMonday);
}

/** 今月ラベル（YYYY-MM） */
export function monthLabelJST(now: Date = new Date()): string {
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return `${jst.getUTCFullYear()}-${pad2(jst.getUTCMonth() + 1)}`;
}

/** labelKey から期間範囲を復元（endKey は期間終端と今日の早い方） */
export function rangeForLabel(
  period: NbaRankingPeriod,
  label: string,
  now: Date = new Date()
): NbaPeriodRange {
  const todayKey = dateKeyJST(now);
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
 * 期間開始直後の猶予日数。前期間の遅延精算（期間最終日の試合が
 * 翌日 JST に確定するケース）を拾うため、この日数以内なら前期間も再集計する。
 */
export const PERIOD_FINALIZE_GRACE_DAYS = 2;
