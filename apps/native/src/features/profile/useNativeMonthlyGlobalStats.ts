/**
 * Web `useMonthlyGlobalStatsV2` のネイティブ版。
 */
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";

export function useNativeMonthlyGlobalStats(month?: string) {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!month) {
      setData(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void getDoc(doc(db, "monthly_global_stats_v2", month)).then((snap) => {
      if (cancelled) return;
      setData(snap.exists() ? (snap.data() as Record<string, unknown>) : null);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [month]);

  return { data, loading };
}

export function extractPointsSumBenchmarks(data: Record<string, unknown> | null | undefined): {
  mean: number;
  median: number;
  p90: number;
  max: number;
} | null {
  const pb = data?.pointsSumV3Benchmarks as
    | { mean: number; median: number; p90: number; max: number }
    | undefined;
  if (
    pb != null &&
    Number.isFinite(pb.mean) &&
    Number.isFinite(pb.median) &&
    Number.isFinite(pb.p90) &&
    Number.isFinite(pb.max)
  ) {
    return { mean: pb.mean, median: pb.median, p90: pb.p90, max: pb.max };
  }
  return null;
}
