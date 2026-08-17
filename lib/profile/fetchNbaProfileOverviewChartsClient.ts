/**
 * Overview グラフ — profileCharts subcollection 1 read のみ（親 cumulative は読まない）。
 * 移行期のみ nested フォールバック可。
 */
import type { Firestore } from "firebase/firestore";
import {
  isProfileChartsComplete,
  type ProfileChartsBundle,
} from "@/lib/profile/profileChartsBundle";
import { loadProfileChartsBundleClient } from "@/lib/profile/profileChartsStorage";
import { profileOverviewSeasonKey } from "@/lib/profile/profileOverviewSeason";
import {
  chartsFromLoadedBundle,
  loadCumulativeDataClient,
} from "@/lib/profile/fetchNbaProfileCardPhaseClient";

export type NbaProfileOverviewChartsClient = {
  profileCharts: ProfileChartsBundle | null;
  chartsPath: "complete" | "empty-season" | "missing";
  overviewSeasonKey: string;
};

export async function fetchNbaProfileOverviewChartsClient(
  db: Firestore,
  uid: string,
  options?: {
    /** users.profileHeroSnapshot 等からシーズン活動あり */
    hasNbaSeasonActivity?: boolean;
    /** subcol 空時、親 nested 確認のため cumulative 1 read（移行期のみ） */
    allowNestedFallback?: boolean;
  }
): Promise<NbaProfileOverviewChartsClient> {
  const safeUid = uid.trim();
  const overviewSeasonKey = profileOverviewSeasonKey();
  if (!safeUid) {
    return {
      profileCharts: null,
      chartsPath: "missing",
      overviewSeasonKey,
    };
  }

  let loaded = await loadProfileChartsBundleClient(
    db,
    safeUid,
    overviewSeasonKey
  );

  let cumulative: Record<string, unknown> | null = null;
  const needsNested =
    options?.allowNestedFallback &&
    !isProfileChartsComplete(loaded);

  if (needsNested && loaded == null) {
    cumulative = await loadCumulativeDataClient(db, safeUid);
    loaded = await loadProfileChartsBundleClient(
      db,
      safeUid,
      overviewSeasonKey,
      cumulative
    );
  }

  const { profileCharts, chartsPath } = chartsFromLoadedBundle(
    cumulative,
    loaded,
    options?.hasNbaSeasonActivity
  );

  return { profileCharts, chartsPath, overviewSeasonKey };
}
