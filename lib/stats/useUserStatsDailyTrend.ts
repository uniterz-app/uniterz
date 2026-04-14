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

type DailyTrendRow = {
  date: string;
  posts: number;
  wins: number;
  pointsV3: number;
  upsetPoints: number;
  winRate: number;
  scorePrecision: number;
};

export function useUserStatsDailyTrend(uid?: string, enabled: boolean = true) {
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

      const rows: DailyTrendRow[] = snap.docs.map((doc) => {
        const d = doc.data();
        const all = d.applied_posts?.all ?? d.applied_posts ?? d.all;

        const posts = all?.posts ?? 0;
        const wins = all?.wins ?? 0;
        const pointsV3 = all?.pointsSumV3 ?? 0;
        const upsetPoints = all?.upsetPointsSum ?? 0;
        const scorePrecisionSum = all?.scorePrecisionSum ?? 0;

        return {
          date: d.date,
          posts,
          wins,
          pointsV3,
          upsetPoints,
          winRate: posts > 0 ? wins / posts : 0,
          scorePrecision: scorePrecisionSum,
        };
      });

      setData(rows);
      setLoading(false);
    }

    fetchDaily();
  }, [uid, enabled]);

  return { data, loading };
}
