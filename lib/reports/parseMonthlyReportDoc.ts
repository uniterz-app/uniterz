/** Firestore user_reports 月次 doc の id / ゆるいパース。 */

import type { MonthlyReport } from "@/lib/reports/monthlyReportTypes";
import { monthlyReportDocId } from "@/lib/reports/reportDelivery";

export { monthlyReportDocId };

/** Firestore doc → MonthlyReport。不正なら null（UI 向けのゆるいガード） */
export function parseMonthlyReportDoc(raw: unknown): MonthlyReport | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Record<string, unknown>;
  if (d.league !== "nba") return null;
  if (typeof d.monthKey !== "string" || !/^\d{4}-\d{2}$/.test(d.monthKey)) {
    return null;
  }
  if (typeof d.rank !== "number" || !Number.isFinite(d.rank)) return null;
  // builder 完了形をそのまま信じる（フィールド欠落は View 側で耐える）
  return d as unknown as MonthlyReport;
}

export function isWeeklyReportDocId(id: string): boolean {
  return /_weekly_\d{4}-\d{2}-\d{2}$/.test(id);
}

export function isMonthlyReportDocId(id: string): boolean {
  return /_monthly_\d{4}-\d{2}$/.test(id);
}
