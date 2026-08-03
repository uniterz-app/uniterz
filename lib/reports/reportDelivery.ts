/**
 * Pro レポート配信スケジュール（JST）。
 * - 月曜日 08:30: 確定した前週の週次をプロフィールオーバーレイで提示（final のみ）
 * - 毎月1日: 前月の月次を同様に提示
 * Report タブには履歴として溜まる（別途 user_reports から一覧）。
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

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function addDaysToDateKeyJST(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const base = new Date(Date.UTC(y, m - 1, d));
  base.setUTCDate(base.getUTCDate() + Math.max(0, Math.floor(days)));
  return `${base.getUTCFullYear()}-${pad2(base.getUTCMonth() + 1)}-${pad2(base.getUTCDate())}`;
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

/** 確定配信対象の前週ラベル（今日が月曜のとき = 今日−7） */
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

/** 確定配信対象の前月 monthKey（今日が1日のとき） */
export function previousMonthKeyForFirstDelivery(now: Date = new Date()): string {
  return previousMonthKeyJST(now);
}

export function monthlyReportDocId(uid: string, monthKey: string): string {
  return `${uid}_monthly_${monthKey}`;
}

/**
 * 今日開いたときに提示候補のレポート（未読フィルタは呼び出し側）。
 * 1日かつ月曜なら月次 → 週次の順。
 */
export function buildReportDeliveryCandidates(
  uid: string,
  now: Date = new Date()
): ReportDeliveryCandidate[] {
  const out: ReportDeliveryCandidate[] = [];

  if (isFirstOfMonthJST(now)) {
    const periodKey = previousMonthKeyForFirstDelivery(now);
    out.push({
      kind: "monthly",
      periodKey,
      reportId: monthlyReportDocId(uid, periodKey),
    });
  }

  if (isMondayJST(now)) {
    const periodKey = previousWeekLabelForMondayDelivery(now);
    out.push({
      kind: "weekly",
      periodKey,
      reportId: weeklyReportDocId(uid, periodKey),
    });
  }

  return out;
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
