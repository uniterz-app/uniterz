"use client";

import {
  collection,
  documentId,
  getDocs,
  limit,
  orderBy,
  query,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import { coerceTotalPointsRank } from "@/lib/profile/resolvePlayoffTotalPointsRank";

const RANK_TREND_CLIENT_MAX = 10;

export type NbaSeasonRankTrendPoint = {
  dateKey: string;
  rank: number;
  labelShort: string;
  date: string;
};

function shortLabel(dateKey: string): string {
  const parts = dateKey.split("-");
  if (parts.length >= 3) return `${Number(parts[1])}/${Number(parts[2])}`;
  return dateKey;
}

/**
 * 本人のみ: rankSnapshotHistory を現行シーズンキーだけで読む。
 * 26-27 が無ければ []（前シーズンフォールバックなし）。
 */
export async function fetchNbaSeasonRankTrendFirestore(
  uid: string
): Promise<NbaSeasonRankTrendPoint[]> {
  const user = auth.currentUser;
  if (!user || user.uid !== uid) return [];
  try {
    await user.getIdToken();
  } catch {
    return [];
  }

  try {
    const q = query(
      collection(db, "cumulative_stats", uid, "rankSnapshotHistory"),
      orderBy(documentId(), "desc"),
      limit(RANK_TREND_CLIENT_MAX)
    );
    const snap = await getDocs(q);
    const points: NbaSeasonRankTrendPoint[] = [];
    for (const d of snap.docs) {
      const data = d.data() as {
        seasons?: Record<string, Record<string, unknown>>;
      };
      const rank = coerceTotalPointsRank(
        data.seasons?.[CURRENT_NBA_SEASON_KEY]?.totalPoints
      );
      if (rank == null) continue;
      const dk = d.id;
      points.push({
        dateKey: dk,
        rank,
        labelShort: shortLabel(dk),
        date: dk,
      });
    }
    return points.sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  } catch {
    return [];
  }
}
