// lib/stats/useUserMonthlyListV2.ts
"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function useUserMonthlyListV2(uid?: string | null) {
  const [months, setMonths] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setMonths([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const q = query(
      collection(db, "user_stats_v2_monthly"),
      where("uid", "==", uid)
    );

    getDocs(q).then((snap) => {
      const list = snap.docs
        .map(d => d.data().month as string)
        .filter(Boolean)
        .sort(); // 昇順（古→新）

      setMonths(list);
      setLoading(false);
    });
  }, [uid]);

  return { months, loading };
}
