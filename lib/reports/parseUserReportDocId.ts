/** user_reports doc id → uid + 期間種別 + ラベル */

export type ParsedUserReportDocId = {
  uid: string;
  period: "weekly" | "monthly";
  label: string;
};

export function parseUserReportDocId(
  docId: string
): ParsedUserReportDocId | null {
  const monthly = docId.match(/^(.+)_monthly_(\d{4}-\d{2})$/);
  if (monthly) {
    return { uid: monthly[1]!, period: "monthly", label: monthly[2]! };
  }
  const weekly = docId.match(/^(.+)_weekly_(\d{4}-\d{2}-\d{2})$/);
  if (weekly) {
    return { uid: weekly[1]!, period: "weekly", label: weekly[2]! };
  }
  return null;
}
