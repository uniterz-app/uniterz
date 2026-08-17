/** user_reports 一覧の仕分け（週次 / 月次）。 */

import type { MonthlyReport } from "@/lib/reports/monthlyReportTypes";
import type { WeeklyReport } from "@/lib/reports/weeklyReportTypes";
import { parseMonthlyReportDoc } from "@/lib/reports/parseMonthlyReportDoc";
import { parseWeeklyReportDoc } from "@/lib/reports/parseWeeklyReportDoc";

export type UserReportListItem =
  | {
      kind: "weekly";
      id: string;
      periodKey: string;
      report: WeeklyReport;
      preview?: boolean;
    }
  | {
      kind: "monthly";
      id: string;
      periodKey: string;
      report: MonthlyReport;
      preview?: boolean;
    };

export function partitionUserReportDocs(
  docs: Array<{ id: string; data: unknown }>
): { weeklies: UserReportListItem[]; monthlies: UserReportListItem[] } {
  const weeklies: UserReportListItem[] = [];
  const monthlies: UserReportListItem[] = [];

  for (const entry of docs) {
    const weekly = parseWeeklyReportDoc(entry.data);
    if (weekly) {
      weeklies.push({
        kind: "weekly",
        id: entry.id,
        periodKey: weekly.label,
        report: weekly,
      });
      continue;
    }
    const monthly = parseMonthlyReportDoc(entry.data);
    if (monthly) {
      monthlies.push({
        kind: "monthly",
        id: entry.id,
        periodKey: monthly.monthKey,
        report: monthly,
      });
    }
  }

  weeklies.sort((a, b) => b.periodKey.localeCompare(a.periodKey));
  monthlies.sort((a, b) => b.periodKey.localeCompare(a.periodKey));
  return { weeklies, monthlies };
}
