/** user_reports を uid+type で一覧（存在しない ID への空振り getDoc をしない） */

import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
  type Firestore,
} from "firebase/firestore";
import {
  partitionUserReportDocs,
  type UserReportListItem,
} from "@/lib/reports/partitionUserReports";
import {
  ARCHIVE_MONTHLY_COUNT,
  ARCHIVE_WEEKLY_COUNT,
} from "@/lib/reports/reportDelivery";

const CACHE_TTL_MS = 2 * 60 * 1000;

type CacheEntry = {
  at: number;
  weeklies: UserReportListItem[];
  monthlies: UserReportListItem[];
};

const cache = new Map<string, CacheEntry>();
const inflight = new Map<
  string,
  Promise<{ weeklies: UserReportListItem[]; monthlies: UserReportListItem[] }>
>();

export async function fetchUserReportsArchive(
  db: Firestore,
  uid: string,
  _now: Date = new Date()
): Promise<{ weeklies: UserReportListItem[]; monthlies: UserReportListItem[] }> {
  const hit = cache.get(uid);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
    return { weeklies: hit.weeklies, monthlies: hit.monthlies };
  }

  const pending = inflight.get(uid);
  if (pending) return pending;

  const task = (async () => {
    const [weeklySnap, monthlySnap] = await Promise.all([
      getDocs(
        query(
          collection(db, "user_reports"),
          where("uid", "==", uid),
          where("type", "==", "weekly"),
          orderBy("label", "desc"),
          limit(ARCHIVE_WEEKLY_COUNT)
        )
      ),
      getDocs(
        query(
          collection(db, "user_reports"),
          where("uid", "==", uid),
          where("type", "==", "monthly"),
          orderBy("monthKey", "desc"),
          limit(ARCHIVE_MONTHLY_COUNT)
        )
      ),
    ]);

    const partitioned = partitionUserReportDocs([
      ...weeklySnap.docs.map((s) => ({ id: s.id, data: s.data() })),
      ...monthlySnap.docs.map((s) => ({ id: s.id, data: s.data() })),
    ]);

    cache.set(uid, {
      at: Date.now(),
      weeklies: partitioned.weeklies,
      monthlies: partitioned.monthlies,
    });
    return partitioned;
  })();

  inflight.set(uid, task);
  try {
    return await task;
  } finally {
    inflight.delete(uid);
  }
}

export function invalidateUserReportsArchiveCache(uid?: string) {
  if (uid) {
    cache.delete(uid);
    inflight.delete(uid);
    return;
  }
  cache.clear();
  inflight.clear();
}
