/**
 * cumulative_stats 直読でカード phase を返す（公開読取前提）。
 * 実装本体は `lib/profile/fetchNbaProfileCardPhaseClient`（Web と共用）。
 */
import { db } from "../../lib/firebase";
import {
  fetchNbaProfileCardPhaseClient,
  invalidateCumulativeDataCacheClient,
  prefetchNbaKinetikBothPeriodsClient,
  type NbaProfileCardPhaseClient,
} from "../../../../../lib/profile/fetchNbaProfileCardPhaseClient";
import { fetchNbaProfileOverviewChartsClient } from "../../../../../lib/profile/fetchNbaProfileOverviewChartsClient";
import type { ProfileKinetikMetricsPeriod } from "../../../../../lib/profile/useNbaKinetikMonthlyStats";

export type NbaProfileCardPhaseFirestore = NbaProfileCardPhaseClient;

export async function loadCumulativeData(uid: string) {
  const { loadCumulativeDataClient } = await import(
    "../../../../../lib/profile/fetchNbaProfileCardPhaseClient"
  );
  return loadCumulativeDataClient(db, uid);
}

export async function fetchNbaProfileOverviewChartsFirestore(
  uid: string,
  options?: {
    hasNbaSeasonActivity?: boolean;
    allowNestedFallback?: boolean;
  }
) {
  return fetchNbaProfileOverviewChartsClient(db, uid, options);
}

export function invalidateProfileChartsCache(uid: string): void {
  invalidateCumulativeDataCacheClient(uid);
}

export async function fetchNbaProfileCardPhaseFirestore(
  uid: string,
  period: ProfileKinetikMetricsPeriod
): Promise<NbaProfileCardPhaseFirestore | null> {
  return fetchNbaProfileCardPhaseClient(db, uid, period);
}

export async function prefetchNbaKinetikBothPeriodsFirestore(
  uid: string
): Promise<{
  season: NbaProfileCardPhaseFirestore;
  playoffs: NbaProfileCardPhaseFirestore;
} | null> {
  return prefetchNbaKinetikBothPeriodsClient(db, uid);
}
