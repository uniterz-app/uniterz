"use client";

import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  documentId,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { TIMEZONE_JST, toDateKeyInTimeZone } from "@/lib/time/zonedTime";
import {
  pickNbaPlayoffsDailyIncBucket,
  pickNbaSeasonKeyDailyIncBucket,
} from "@/lib/rankings/pickNbaStatsBucket";
import { filterDailyTrendToSeasonActivity } from "@/lib/profile/dailyTrendSeasonActivity";
import { resolveProfileDailyTrendContext } from "@/lib/profile/userStatsV2ProfileRollup";
import type { RankingLeagueSource } from "@/lib/rankings/rankingLeagueSource";

type DailyTrendRow = {
  date: string;
  posts: number;
  wins: number;
  pointsV3: number;
  upsetPoints: number;
  winRate: number;
  exactHitCount: number;
};

export function useUserStatsDailyTrend(
  uid?: string,
  enabled: boolean = true,
  context?: { rankingLeague?: RankingLeagueSource; wcStage?: unknown }
) {
  const [data, setData] = useState<DailyTrendRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!enabled) {
      setData([]);
      setLoading(false);
      return;
    }

    if (!uid) {
      setData([]);
      setLoading(false);
      return;
    }

    async function fetchDaily() {
      setLoading(true);

      const now = new Date();
      const end = toDateKeyInTimeZone(now, TIMEZONE_JST);
      const startDt = new Date(now.getTime() - 29 * 86400000);
      const start = toDateKeyInTimeZone(startDt, TIMEZONE_JST);

      const q = query(
        collection(db, "user_stats_v2_daily"),
        where(documentId(), ">=", `${uid}_${start}`),
        where(documentId(), "<=", `${uid}_${end}`),
        orderBy(documentId())
      );

      const snap = await getDocs(q);

      const trendCtx = resolveProfileDailyTrendContext(
        context?.rankingLeague ?? "nba",
        context?.wcStage,
        "season"
      );

      const rows: DailyTrendRow[] = snap.docs.map((doc) => {
        const d = doc.data() as Record<string, unknown>;
        let bucket: Record<string, unknown>;
        if (trendCtx.nbaPeriod === "playoffs") {
          bucket = pickNbaPlayoffsDailyIncBucket(d);
        } else {
          bucket = pickNbaSeasonKeyDailyIncBucket(d);
        }

        const posts = Number(bucket.posts ?? 0);
        const wins = Number(bucket.wins ?? 0);
        const pointsV3 = Number(bucket.pointsSumV3 ?? 0);
        const upsetPoints = Number(bucket.upsetPointsSum ?? 0);

        return {
          date: typeof d.date === "string" ? d.date : String(d.date ?? ""),
          posts,
          wins,
          pointsV3,
          upsetPoints,
          winRate: posts > 0 ? wins / posts : 0,
          exactHitCount: 0,
        };
      });

      setData(filterDailyTrendToSeasonActivity(rows));
      setLoading(false);
    }

    fetchDaily();
  }, [context?.rankingLeague, context?.wcStage, uid, enabled]);

  return { data, loading };
}
