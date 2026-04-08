"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function useUserMonthlyStatsV2(
  uid?: string | null,
  month?: string,
  prevMonth?: string,
  /** 先月サマリーの前月比用（選択月の2つ前） */
  prevPrevMonth?: string
) {
  const [current, setCurrent] = useState<any | null>(null);
  const [prev, setPrev] = useState<any | null>(null);
  const [prevPrev, setPrevPrev] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid || !month) {
      setCurrent(null);
      setPrev(null);
      setPrevPrev(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    const currentRef = doc(db, "user_stats_v2_monthly", `${uid}_${month}`);
    const prevRef = prevMonth
      ? doc(db, "user_stats_v2_monthly", `${uid}_${prevMonth}`)
      : null;
    const prevPrevRef = prevPrevMonth
      ? doc(db, "user_stats_v2_monthly", `${uid}_${prevPrevMonth}`)
      : null;

    Promise.all([
      getDoc(currentRef),
      prevRef ? getDoc(prevRef) : Promise.resolve(null),
      prevPrevRef ? getDoc(prevPrevRef) : Promise.resolve(null),
    ]).then(([currentSnap, prevSnap, prevPrevSnap]) => {
      setCurrent(currentSnap.exists() ? currentSnap.data() : null);
      setPrev(
        prevSnap && "exists" in prevSnap && prevSnap.exists()
          ? prevSnap.data()
          : null
      );
      setPrevPrev(
        prevPrevSnap &&
          "exists" in prevPrevSnap &&
          prevPrevSnap.exists()
          ? prevPrevSnap.data()
          : null
      );
      setLoading(false);
    });
  }, [uid, month, prevMonth, prevPrevMonth]);

  return {
    stats: current,
    prevStats: prev,
    prevPrevStats: prevPrev,
    loading,
  };
}
