// lib/stats/useUserMonthlyTrendV2.ts
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect, useState } from "react";

export function useUserMonthlyTrendV2(uid?: string) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;

    async function fetch() {
      setLoading(true);

      const q = query(
        collection(db, "user_stats_v2_monthly"),
        where("uid", "==", uid),
        orderBy("month", "asc")
      );

      const snap = await getDocs(q);

      const rows = snap.docs.map(doc => {
        const d = doc.data();
        const r = d.raw;

       return {
  month: d.month,
  posts: r.posts ?? 0,
  winRate: r.winRate ?? 0,
  accuracy: r.accuracy ?? 0,
  avgPrecision: r.avgPrecision ?? 0,
};
      });

      setData(rows);
      setLoading(false);
    }

    fetch();
  }, [uid]);

  return { data, loading };
}
