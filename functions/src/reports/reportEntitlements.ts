/**
 * Pro レポート閲覧権（プラン別）。
 * Keep in sync with lib/reports/reportEntitlements.ts.
 */

export type ReportEntitlementInput = {
  plan?: string | null;
  planType?: unknown;
};

function isProPlan(plan: string | null | undefined): boolean {
  return String(plan ?? "").toLowerCase() === "pro";
}

function normalizePlanType(
  raw: unknown
): "weekly" | "monthly" | "season" | "annual" | null {
  if (
    raw === "weekly" ||
    raw === "monthly" ||
    raw === "season" ||
    raw === "annual"
  ) {
    return raw;
  }
  return null;
}

export function canViewWeeklyReport(input: ReportEntitlementInput): boolean {
  return isProPlan(input.plan);
}

/** Weekly のみ月次不可。planType 未設定 Pro は月次可（後方互換）。 */
export function canViewMonthlyReport(input: ReportEntitlementInput): boolean {
  if (!isProPlan(input.plan)) return false;
  return normalizePlanType(input.planType) !== "weekly";
}
