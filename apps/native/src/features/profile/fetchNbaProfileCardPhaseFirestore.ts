/**
 * cumulative_stats 直読でカード phase を返す（公開読取前提）。
 * 試合確定のたびに Functions が更新 → クライアントは API 不要。
 */
import { doc, getDoc } from "firebase/firestore";
import { summaryFromNbaScopeRanking } from "../../../../../lib/profile/resolveLiveProfileSummary";
import type { ProfileKinetikMetricsPeriod } from "../../../../../lib/profile/useNbaKinetikMonthlyStats";
import { readStoredRankFromSnapshotRanks } from "../../../../../lib/rankings/server/readSnapshotRanksFromCumulative";
import { db } from "../../lib/firebase";
import type { ProfileSummaryNative, ProfileSummaryRanksNative } from "./profileApi";

export type NbaProfileCardPhaseFirestore = {
  summary: ProfileSummaryNative;
  summaryRanks: ProfileSummaryRanksNative;
};

export async function fetchNbaProfileCardPhaseFirestore(
  uid: string,
  period: ProfileKinetikMetricsPeriod
): Promise<NbaProfileCardPhaseFirestore | null> {
  const safeUid = uid.trim();
  if (!safeUid) return null;

  try {
    const snap = await getDoc(doc(db, "cumulative_stats", safeUid));
    const data = snap.exists()
      ? (snap.data() as Record<string, unknown>)
      : null;
    const summary = summaryFromNbaScopeRanking(data, period);
    return {
      summary,
      summaryRanks: {
        totalPrecision: readStoredRankFromSnapshotRanks(
          data,
          "totalPrecision",
          null
        ),
        totalUpset: readStoredRankFromSnapshotRanks(data, "totalUpset", null),
        totalPoints: readStoredRankFromSnapshotRanks(data, "totalPoints", null),
        totalPointsDenominator: null,
        rankDeltaPlaces: null,
      },
    };
  } catch {
    return null;
  }
}
