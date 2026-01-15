import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect, useState } from "react";

type DailyTrendRow = {
  date: string;
  posts: number;
  winRate: number;
  accuracy: number;
  scorePrecision: number;
};

function toDateKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function useUserDailyTrendV2(uid?: string) {
  const [data, setData] = useState<DailyTrendRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;

    async function fetchDaily() {
      setLoading(true);

      const endDate = new Date(); // 今日
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 29); // 直近30日

      const start = toDateKey(startDate);
      const end = toDateKey(endDate);

      const q = query(
        collection(db, "user_stats_v2_daily"),
        where("date", ">=", start),
        where("date", "<=", end),
        orderBy("date", "asc")
      );

      const snap = await getDocs(q);

      const rows: DailyTrendRow[] = snap.docs
        .filter(doc => doc.id.startsWith(`${uid}_`))
        .map(doc => {
          const d = doc.data();
          const all =
            d.applied_posts?.all ??
            d.applied_posts ??
            d.all;

          const posts = all?.posts ?? 0;
          const wins = all?.wins ?? 0;

          return {
            date: d.date,
            posts,
            winRate: posts > 0 ? wins / posts : 0,
            accuracy:
              posts > 0 && typeof all?.brierSum === "number"
                ? Math.max(0, 1 - all.brierSum / posts)
                : 0,
            scorePrecision:
              posts > 0 && typeof all?.scorePrecisionSum === "number"
                ? (all.scorePrecisionSum / posts) / 15
                : 0,
          };
        });

      setData(rows);
      setLoading(false);
    }

    fetchDaily();
  }, [uid]);

  return { data, loading };
}
