"use client";

import { useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, Timestamp } from "firebase/firestore";

/* ========= Bucket 型 ========= */
type Bucket = {
  posts: number;
  wins: number;
  scoreErrorSum: number;
  brierSum: number;
  upsetScoreSum: number;
  scorePrecisionSum: number;
  calibrationErrorSum: number;
  calibrationCount: number;
};
// ★ SummaryCardsV2 / ProfilePageBaseV2 が必要とする型
export type SummaryForCardsV2 = {
  posts: number;
  fullPosts: number;
  winRate: number;
  avgPrecision: number;
 avgBrier: number;
  avgUpset: number;
  avgCalibration: number | null;
};


/* ========= 初期値 ========= */
const empty = (): Bucket => ({
  posts: 0,
  wins: 0,
  scoreErrorSum: 0,
  brierSum: 0,
  upsetScoreSum: 0,
  scorePrecisionSum: 0,
  calibrationErrorSum: 0,  // ← 追加
    calibrationCount: 0,      // ← 追加
});

/* ========= 再計算 ========= */
function compute(b: Bucket) {
  return {
    posts: b.posts,
    winRate: b.posts ? b.wins / b.posts : 0,
    avgPrecision: b.posts ? b.scorePrecisionSum / b.posts : NaN,
    avgBrier: b.posts ? b.brierSum / b.posts : NaN,
    avgUpset: b.wins ? b.upsetScoreSum / b.wins : NaN,
    avgCalibration: b.calibrationCount > 0
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

  useEffect(() => {
    if (!uid) {
      setSummaries(null);
      setLoading(false);
      return;
    }

    async function run() {
      setLoading(true);

        const statsRef = doc(db, "user_stats_v2", uid!);
  const statsSnap = await getDoc(statsRef);
  setStats(statsSnap.exists() ? statsSnap.data() : null);

      /* ------------------------------
         ALL: キャッシュを1回読むだけ
      ------------------------------ */
      const allRef = doc(db, "user_stats_v2_all_cache", uid!);
      const allSnap = await getDoc(allRef);
      const all = allSnap.exists() ? (allSnap.data() as Bucket) : empty();
      const allComputed = compute(all);

      /* ------------------------------
         7d / 30d: daily を合算
      ------------------------------ */
      const today = new Date();

      async function loadRange(days: number) {
        let b: Bucket = empty();

        for (let i = 0; i < days; i++) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);

          const key = `${uid!}_${dateKey(d)}`;
const snap = await getDoc(doc(db, "user_stats_v2_daily", key));
          if (!snap.exists()) continue;

          const v = snap.data().all;
          if (!v) continue;

          b.posts += v.posts ?? 0;
          b.wins += v.wins ?? 0;
          b.scoreErrorSum += v.scoreErrorSum ?? 0;
          b.brierSum += v.brierSum ?? 0;
          b.upsetScoreSum += v.upsetScoreSum ?? 0;
          b.scorePrecisionSum += v.scorePrecisionSum ?? 0;
          b.calibrationErrorSum += v.calibrationErrorSum ?? 0;
b.calibrationCount += v.calibrationCount ?? 0;
        }

        return compute(b);
      }

      const seven = await loadRange(7);
      const thirty = await loadRange(30);

      setSummaries({
        "7d": { fullPosts: seven.posts, ...seven },
        "30d": { fullPosts: thirty.posts, ...thirty },
        "all": { fullPosts: all.posts, ...allComputed },
      });

      setLoading(false);
    }

    run();
  }, [uid]);

  return { loading, summaries, stats };
}
