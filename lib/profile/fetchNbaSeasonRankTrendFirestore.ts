"use client";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { profileChartsDocId } from "@/lib/profile/profileChartsDivision";
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

export type RankTrendDivision = "pickup" | "open";

/**
 * 本人のみ: rankSnapshotHistory を現行シーズンキーだけで読む。
 * open は PRO LEAGUE（openSeasons）。26-27 が無ければ []。
 */
export async function fetchNbaSeasonRankTrendFirestore(
  uid: string,
  division: RankTrendDivision = "pickup"
): Promise<NbaSeasonRankTrendPoint[]> {
  const user = auth.currentUser;
  if (!user || user.uid !== uid) return [];
  try {
    await user.getIdToken();
  } catch {
    return [];
  }

  try {
    // documentId 順はサブコレクショングループの索引が要るため dateKey で取る
    const q = query(
      collection(db, "cumulative_stats", uid, "rankSnapshotHistory"),
      orderBy("dateKey", "desc"),
      limit(RANK_TREND_CLIENT_MAX)
    );
    const snap = await getDocs(q);
    const points: NbaSeasonRankTrendPoint[] = [];
    for (const d of snap.docs) {
      const data = d.data() as {
        seasons?: Record<string, Record<string, unknown>>;
        openSeasons?: Record<string, Record<string, unknown>>;
      };
      const block = division === "open" ? data.openSeasons : data.seasons;
      const rank = coerceTotalPointsRank(
        block?.[CURRENT_NBA_SEASON_KEY]?.totalPoints
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
    if (division === "open") {
      const chartSnap = await getDoc(
        doc(
          db,
          "cumulative_stats",
          uid,
          "profileCharts",
          profileChartsDocId(CURRENT_NBA_SEASON_KEY, "open")
        )
      );
      const raw = chartSnap.data()?.rankTrend;
      if (Array.isArray(raw)) {
        const seen = new Set(points.map((p) => p.dateKey));
        for (const item of raw) {
          if (!item || typeof item !== "object") continue;
          const dateKey = (item as { dateKey?: unknown }).dateKey;
          const rank = coerceTotalPointsRank((item as { rank?: unknown }).rank);
          if (typeof dateKey !== "string" || rank == null || seen.has(dateKey)) {
            continue;
          }
          seen.add(dateKey);
          points.push({
            dateKey,
            rank,
            labelShort: shortLabel(dateKey),
            date: dateKey,
          });
        }
      }
    }
    return points
      .sort((a, b) => a.dateKey.localeCompare(b.dateKey))
      .slice(-RANK_TREND_CLIENT_MAX);
  } catch {
    return [];
  }
}
