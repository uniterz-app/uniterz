/** user_reports を確定 ID で getDoc（全件 where uid は使わない） */

import { doc, getDoc, type Firestore } from "firebase/firestore";
import {
  partitionUserReportDocs,
  type UserReportListItem,
} from "@/lib/reports/partitionUserReports";
import {
  recentMonthlyReportDocIds,
  recentWeeklyReportDocIds,
} from "@/lib/reports/reportDelivery";

export async function fetchUserReportsArchive(
  db: Firestore,
  uid: string,
  now: Date = new Date()
): Promise<{ weeklies: UserReportListItem[]; monthlies: UserReportListItem[] }> {
  const ids = [
    ...recentWeeklyReportDocIds(uid, now),
    ...recentMonthlyReportDocIds(uid, now),
  ];
  const snaps = await Promise.all(
    ids.map((id) => getDoc(doc(db, "user_reports", id)))
  );
  return partitionUserReportDocs(
    snaps
      .filter((s) => s.exists())
      .map((s) => ({ id: s.id, data: s.data() }))
  );
}
