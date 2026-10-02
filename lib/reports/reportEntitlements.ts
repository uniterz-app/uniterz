/**
 * Pro レポート閲覧権（プラン別）。
 *
 * - Weekly: 週次のみ
 * - Monthly / Season / annual（旧）/ planType 未設定の Pro: 週次 + 月次
 * - Free: どちらも不可
 */
import {
  normalizeStoredPlanType,
  type StoredPlanType,
} from "@/lib/pro/planChangeDisplay";

export type ReportEntitlementInput = {
  plan?: string | null;
  planType?: unknown;
};

function isProPlan(plan: string | null | undefined): boolean {
  return String(plan ?? "").toLowerCase() === "pro";
}

/** Pro なら週次レポート閲覧可（全 Pro プラン） */
export function canViewWeeklyReport(input: ReportEntitlementInput): boolean {
  return isProPlan(input.plan);
}

/**
 * 月次レポート閲覧可。
 * Weekly プランのみ不可。planType 未設定の Pro は Monthly 扱い（後方互換）。
 */
export function canViewMonthlyReport(input: ReportEntitlementInput): boolean {
  if (!isProPlan(input.plan)) return false;
  const t = normalizeStoredPlanType(input.planType);
  return t !== "weekly";
}

export function resolveViewerPlanType(raw: unknown): StoredPlanType | null {
  return normalizeStoredPlanType(raw);
}
