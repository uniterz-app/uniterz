"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function useUserMonthlyStatsV2(
  uid?: string | null,
  month?: string
) {
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid || !month) {
      setStats(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    const ref = doc(db, "user_stats_v2_monthly", `${uid}_${month}`);

    getDoc(ref).then((snap) => {
      setStats(snap.exists() ? snap.data() : null);
      setLoading(false);
    });
  }, [uid, month]);

  return { stats, loading };
}
