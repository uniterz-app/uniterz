"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function useUserMonthlyStatsV2(
  uid?: string | null,
  month?: string,
  prevMonth?: string
) {
  const [current, setCurrent] = useState<any | null>(null);
  const [prev, setPrev] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid || !month) {
      setCurrent(null);
      setPrev(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    const currentRef = doc(db, "user_stats_v2_monthly", `${uid}_${month}`);
    const prevRef =
      prevMonth
        ? doc(db, "user_stats_v2_monthly", `${uid}_${prevMonth}`)
        : null;

    Promise.all([
      getDoc(currentRef),
      prevRef ? getDoc(prevRef) : Promise.resolve(null),
    ]).then(([currentSnap, prevSnap]) => {
      setCurrent(currentSnap.exists() ? currentSnap.data() : null);
      setPrev(
        prevSnap && "exists" in prevSnap && prevSnap.exists()
          ? prevSnap.data()
          : null
      );
      setLoading(false);
    });
  }, [uid, month, prevMonth]);

  return {
    stats: current,   // 今月
    prevStats: prev,  // 先月
    loading,
  };
}
