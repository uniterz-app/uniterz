"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function useMonthlyGlobalStatsV2(month?: string) {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!month) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    const ref = doc(db, "monthly_global_stats_v2", month);

    getDoc(ref).then((snap) => {
      setData(snap.exists() ? snap.data() : null);
      setLoading(false);
    });
  }, [month]);

  return { data, loading };
}
