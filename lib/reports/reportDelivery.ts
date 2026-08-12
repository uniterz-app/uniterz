/**
 * Pro レポート配信スケジュール（JST）。
 * - 週次 final: 月曜 08:30 に前週を確定。未読なら以降いつ開いてもオーバーレイ。
 * - 月次 final: 毎月1日 08:00 に前月を確定。未読なら以降いつ開いてもオーバーレイ。
 * Report タブは直近の確定 ID を getDoc（全件 query しない）。
 * トライアル1回保証: lib/reports/weeklyReportTrialGuarantee.ts
 */

import { subtractDaysFromDateKeyJST } from "@/lib/rankings/rankSnapshotDate";
import { resolveRankingWeekStartDateKey } from "@/lib/rankings/rankingPeriod";
import { getZonedYMD, TIMEZONE_JST } from "@/lib/time/zonedTime";
import { weeklyReportDocId } from "@/lib/reports/parseWeeklyReportDoc";

export type ReportDeliveryKind = "weekly" | "monthly";

export type ReportDeliveryCandidate = {
  kind: ReportDeliveryKind;
  /** week label (月曜 dateKey) または monthKey (YYYY-MM) */
  periodKey: string;
  reportId: string;
};

export const ARCHIVE_WEEKLY_COUNT = 16;
export const ARCHIVE_MONTHLY_COUNT = 12;

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function addDaysToDateKeyJST(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const base = new Date(Date.UTC(y, m - 1, d));
  base.setUTCDate(base.getUTCDate() + Math.max(0, Math.floor(days)));
  return `${base.getUTCFullYear()}-${pad2(base.getUTCMonth() + 1)}-${pad2(base.getUTCDate())}`;
}

function previousMonthKeyFrom(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  if (!y || !m) return monthKey;
  if (m === 1) return `${y - 1}-12`;
  return `${y}-${pad2(m - 1)}`;
}

/** JST で月曜か */
export function isMondayJST(now: Date = new Date()): boolean {
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return jst.getUTCDay() === 1;
}

/** JST で毎月1日か */
export function isFirstOfMonthJST(now: Date = new Date()): boolean {
  return getZonedYMD(now, TIMEZONE_JST).day === 1;
}

/** 確定配信対象の前週ラベル（どの曜日でも「直近の確定週」） */
export function previousWeekLabelForMondayDelivery(now: Date = new Date()): string {
  const thisMonday = resolveRankingWeekStartDateKey(now);
  return subtractDaysFromDateKeyJST(thisMonday, 7);
}

/** 直前に完了した暦月の monthKey */
export function previousMonthKeyJST(now: Date = new Date()): string {
  const { year, month } = getZonedYMD(now, TIMEZONE_JST);
  if (month === 1) return `${year - 1}-12`;
  return `${year}-${pad2(month - 1)}`;
}

/** 確定配信対象の前月 monthKey */
export function previousMonthKeyForFirstDelivery(now: Date = new Date()): string {
  return previousMonthKeyJST(now);
}

export function monthlyReportDocId(uid: string, monthKey: string): string {
  return `${uid}_monthly_${monthKey}`;
}

/** Report タブ用: 直近の確定週次 doc id（新しい順） */
export function recentWeeklyReportDocIds(
  uid: string,
  now: Date = new Date(),
  count: number = ARCHIVE_WEEKLY_COUNT
): string[] {
  let label = previousWeekLabelForMondayDelivery(now);
  const ids: string[] = [];
  const n = Math.max(0, Math.floor(count));
  for (let i = 0; i < n; i++) {
    ids.push(weeklyReportDocId(uid, label));
    label = subtractDaysFromDateKeyJST(label, 7);
  }
  return ids;
}

/** Report タブ用: 直近の確定月次 doc id（新しい順） */
export function recentMonthlyReportDocIds(
  uid: string,
  now: Date = new Date(),
  count: number = ARCHIVE_MONTHLY_COUNT
): string[] {
  let key = previousMonthKeyJST(now);
  const ids: string[] = [];
  const n = Math.max(0, Math.floor(count));
  for (let i = 0; i < n; i++) {
    ids.push(monthlyReportDocId(uid, key));
    key = previousMonthKeyFrom(key);
  }
  return ids;
}

/**
 * 未読ならいつ開いても出す（月曜/1日限定にしない）。
 * cron 前は doc が無くスキップされる。月次 → 週次の順。
 */
export function buildReportDeliveryCandidates(
  uid: string,
  now: Date = new Date()
): ReportDeliveryCandidate[] {
  const monthlyKey = previousMonthKeyJST(now);
  const weeklyKey = previousWeekLabelForMondayDelivery(now);
  return [
    {
      kind: "monthly",
      periodKey: monthlyKey,
      reportId: monthlyReportDocId(uid, monthlyKey),
    },
    {
      kind: "weekly",
      periodKey: weeklyKey,
      reportId: weeklyReportDocId(uid, weeklyKey),
    },
  ];
}

/** 一覧用: 今週の進行中週次 doc id */
export function currentWeeklyReportDocId(uid: string, now: Date = new Date()): string {
  return weeklyReportDocId(uid, resolveRankingWeekStartDateKey(now));
}

export function formatReportPeriodLabel(
  kind: ReportDeliveryKind,
  periodKey: string,
  lang: "ja" | "en"
): string {
  if (kind === "monthly") {
    const [y, m] = periodKey.split("-");
    return lang === "ja" ? `${y}年${Number(m)}月` : `${y}.${m}`;
  }
  const end = addDaysToDateKeyJST(periodKey, 6);
  const md = (k: string) => {
    const [, m, d] = k.split("-");
    return `${Number(m)}/${Number(d)}`;
  };
  return `${md(periodKey)} – ${md(end)}`;
}

/** デバッグ・プレビュー用（本番カレンダー以外で強制） */
export function buildForcedDeliveryCandidates(
  uid: string,
  kinds: ReportDeliveryKind[],
  now: Date = new Date()
): ReportDeliveryCandidate[] {
  const out: ReportDeliveryCandidate[] = [];
  for (const kind of kinds) {
    if (kind === "monthly") {
      const periodKey = previousMonthKeyJST(now);
      out.push({
        kind: "monthly",
        periodKey,
        reportId: monthlyReportDocId(uid, periodKey),
      });
    } else {
      const periodKey = previousWeekLabelForMondayDelivery(now);
      out.push({
        kind: "weekly",
        periodKey,
        reportId: weeklyReportDocId(uid, periodKey),
      });
    }
  }
  return out;
}
