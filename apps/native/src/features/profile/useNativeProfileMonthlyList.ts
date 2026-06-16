import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../lib/firebase";

/** Web `useUserMonthlyListV2` 相当 */
export function useNativeProfileMonthlyList(uid: string | undefined) {
  const [months, setMonths] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!uid) {
      setMonths([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void (async () => {
      try {
        const q = query(collection(db, "user_stats_v2_monthly"), where("uid", "==", uid));
        const snap = await getDocs(q);
        if (cancelled) return;
        const list = snap.docs
          .map((d) => {
            const month = d.data().month;
            if (typeof month === "string" && month.trim()) return month.trim();
            const tail = d.id.match(/_(\d{4}-\d{2})$/);
            return tail ? tail[1]! : "";
          })
          .filter(Boolean)
          .sort();
        setMonths(list);
      } catch {
        if (!cancelled) setMonths([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [uid]);

  return { months, loading };
}
