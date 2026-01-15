"use client";

import { useEffect, useRef, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

/* ========= Bucket 型 ========= */
type Bucket = {
  posts: number;
  wins: number;
  scoreErrorSum: number;
  brierSum: number;
  upsetHitCount: number;
  upsetOpportunityCount: number;
  scorePrecisionSum: number;
  calibrationErrorSum: number;
  calibrationCount: number;
};

export type SummaryForCardsV2 = {
  posts: number;
  fullPosts: number;
  winRate: number;
  avgPrecision: number;
  avgBrier: number;
  upsetHitRate: number;   // ★ ここ
  avgCalibration: number | null;
};

/* ========= 初期値 ========= */
const empty = (): Bucket => ({
  posts: 0,
  wins: 0,
  scoreErrorSum: 0,
  brierSum: 0,
  upsetHitCount: 0,
  upsetOpportunityCount: 0,
  scorePrecisionSum: 0,
  calibrationErrorSum: 0,
  calibrationCount: 0,
});

/* ========= 再計算 ========= */
function compute(b: Bucket) {
  return {
    posts: b.posts,
    winRate: b.posts ? b.wins / b.posts : 0,
    avgPrecision: b.posts ? b.scorePrecisionSum / b.posts : NaN,
    avgBrier: b.posts ? b.brierSum / b.posts : NaN,
    upsetHitRate:
  b.upsetOpportunityCount > 0
    ? b.upsetHitCount / b.upsetOpportunityCount
    : 0,
    avgCalibration:
      b.calibrationCount > 0
        ? b.calibrationErrorSum / b.calibrationCount
        : null,
  };
}

function dateKey(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/* ========= main hook ========= */
export function useUserStatsV2(uid?: string | null) {
  const [loading, setLoading] = useState(true);
  const [summaries, setSummaries] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);

  // 同じ uid での再実行を防ぐ
  const prevUidRef = useRef<string | null>(null);

  useEffect(() => {
    if (!uid) {
      setSummaries(null);
      setStats(null);
      setLoading(false);
      prevUidRef.current = null;
      return;
    }

    if (prevUidRef.current === uid) return;
    prevUidRef.current = uid;

    const safeUid: string = uid; // ★ 型確定

    let cancelled = false;

    async function run() {
      /* ------------------------------
         stats 本体
      ------------------------------ */
      const statsRef = doc(db, "user_stats_v2", safeUid);
      const statsSnap = await getDoc(statsRef);
      if (cancelled) return;
      setStats(statsSnap.exists() ? statsSnap.data() : null);

      /* ------------------------------
         ALL: キャッシュ
      ------------------------------ */
      const allRef = doc(db, "user_stats_v2_all_cache", safeUid);
      const allSnap = await getDoc(allRef);
      const all = allSnap.exists() ? (allSnap.data() as Bucket) : empty();
      const allComputed = compute(all);

      /* ------------------------------
         7d / 30d
      ------------------------------ */
      const today = new Date();

      async function loadRange(days: number) {
        let b: Bucket = empty();

        for (let i = 0; i < days; i++) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);

          const key = `${safeUid}_${dateKey(d)}`;
          const snap = await getDoc(doc(db, "user_stats_v2_daily", key));
          if (!snap.exists()) continue;

          const v = snap.data().all;
          if (!v) continue;

          b.posts += v.posts ?? 0;
          b.wins += v.wins ?? 0;
          b.scoreErrorSum += v.scoreErrorSum ?? 0;
          b.brierSum += v.brierSum ?? 0;
          b.upsetHitCount += v.upsetHitCount ?? 0;
b.upsetOpportunityCount += v.upsetOpportunityCount ?? 0;
          b.scorePrecisionSum += v.scorePrecisionSum ?? 0;
          b.calibrationErrorSum += v.calibrationErrorSum ?? 0;
          b.calibrationCount += v.calibrationCount ?? 0;
        }

        return compute(b);
      }

      const seven = await loadRange(7);
      const thirty = await loadRange(30);
      if (cancelled) return;

      setSummaries({
        "7d": { fullPosts: seven.posts, ...seven },
        "30d": { fullPosts: thirty.posts, ...thirty },
        "all": { fullPosts: all.posts, ...allComputed },
      });

      setLoading(false);
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [uid]);

  return { loading, summaries, stats };
}
