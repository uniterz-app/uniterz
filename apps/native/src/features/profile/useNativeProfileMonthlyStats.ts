/**
 * Web `useUserMonthlyStatsV2` のネイティブ版（Firestore 月次 doc 直読）。
 */
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";

export function useNativeProfileMonthlyStats(
  uid: string | undefined,
  month: string | undefined,
  prevMonth?: string,
  prevPrevMonth?: string
) {
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [prevStats, setPrevStats] = useState<Record<string, unknown> | null>(null);
  const [prevPrevStats, setPrevPrevStats] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!uid || !month) {
      setStats(null);
      setPrevStats(null);
      setPrevPrevStats(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void (async () => {
      try {
        const [currentSnap, prevSnap, prevPrevSnap] = await Promise.all([
          getDoc(doc(db, "user_stats_v2_monthly", `${uid}_${month}`)),
          prevMonth
            ? getDoc(doc(db, "user_stats_v2_monthly", `${uid}_${prevMonth}`))
            : Promise.resolve(null),
          prevPrevMonth
            ? getDoc(doc(db, "user_stats_v2_monthly", `${uid}_${prevPrevMonth}`))
            : Promise.resolve(null),
        ]);
        if (cancelled) return;
        setStats(currentSnap.exists() ? (currentSnap.data() as Record<string, unknown>) : null);
        setPrevStats(
          prevSnap && "exists" in prevSnap && prevSnap.exists()
            ? (prevSnap.data() as Record<string, unknown>)
            : null
        );
        setPrevPrevStats(
          prevPrevSnap && "exists" in prevPrevSnap && prevPrevSnap.exists()
            ? (prevPrevSnap.data() as Record<string, unknown>)
            : null
        );
      } catch {
        if (cancelled) return;
        setStats(null);
        setPrevStats(null);
        setPrevPrevStats(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [uid, month, prevMonth, prevPrevMonth]);

  return { stats, prevStats, prevPrevStats, loading };
}

/** 直近の月次 doc キー（YYYY-MM）を推定 */
export function currentMonthKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function previousMonthKey(monthKey: string): string | undefined {
  const m = /^(\d{4})-(\d{2})$/.exec(monthKey);
  if (!m) return undefined;
  let y = Number(m[1]);
  let mo = Number(m[2]) - 1;
  if (mo <= 0) {
    mo = 12;
    y -= 1;
  }
  return `${y}-${String(mo).padStart(2, "0")}`;
}
