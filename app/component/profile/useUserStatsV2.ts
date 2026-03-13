// app/lib/stats/useUserStatsV2.ts
"use client";

import { useEffect, useRef, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

/* ========= Bucket 型（Firestore: user_stats_v2_daily/{uid_date}.all と揃える） ========= */
type Bucket = {
  posts: number;
  wins: number;

  scoreErrorSum: number;
  brierSum: number;

  // upset
  upsetHitCount: number; // 少数派Upset的中数（count）
  upsetOpportunityCount: number; // upsetGameの母数（hadUpsetGame）
  upsetPointsSum: number; // Upset独立ポイント合計（0〜10/試合の合計）

  // score precision
  scorePrecisionSum: number; // 合計（表示も合計にする）

  // total points
  pointsSumV3: number; // 総合得点合計（pointsV3）
};

export type SummaryForCardsV2 = {
  posts: number;
  fullPosts: number;

  // 的中数（AnalysisWinCard用）
  wins: number;

  // ① 勝率
  winRate: number;

  // ② スコア精度（期間合計）
  scorePrecisionSum: number;

  // ③ 確率精度（Brier 平均。表示側で (1-avgBrier)*100 にしてOK）
  avgBrier: number;

  // ④ アップセット得点（期間合計）
  upsetPointsSum: number;

  // ⑤ 総合得点（期間合計）
  pointsSumV3: number;

  // Upset（カード参照用：このhookで確実に供給）
  upsetChanceCount: number; // = upsetOpportunityCount
  upsetHitCount: number;
};

export type DailyTrendStat = {
  date: string;
  posts: number;
  winRate: number;
  accuracy: number; // 0..1
  scorePrecision: number; // 0..10（平均）
};

/* ========= 初期値 ========= */
const empty = (): Bucket => ({
  posts: 0,
  wins: 0,
  scoreErrorSum: 0,
  brierSum: 0,
  upsetHitCount: 0,
  upsetOpportunityCount: 0,
  upsetPointsSum: 0,
  scorePrecisionSum: 0,
  pointsSumV3: 0,
});

/* ========= 再計算（サマリーカード用） ========= */
function computeForCards(b: Bucket): Omit<SummaryForCardsV2, "fullPosts"> {
  const posts = safeInt(b.posts);
  const wins = safeInt(b.wins);

  const scorePrecisionSum = safeNum(b.scorePrecisionSum);
  const upsetPointsSum = safeNum(b.upsetPointsSum);
  const pointsSumV3 = safeNum(b.pointsSumV3);

  const brierSum = safeNum(b.brierSum);

  const upsetChanceCount = safeInt(b.upsetOpportunityCount);
  const upsetHitCount = safeInt(b.upsetHitCount);

  return {
    posts,
    wins,
    winRate: posts ? wins / posts : 0,

    scorePrecisionSum,
    avgBrier: posts ? brierSum / posts : NaN,

    upsetPointsSum,
    pointsSumV3,

    upsetChanceCount,
    upsetHitCount,
  };
}

function safeNum(v: any): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function safeInt(v: any): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

function dateKey(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function useUserStatsV2(uid?: string | null) {
  const [loading, setLoading] = useState(true);
  const [summaries, setSummaries] = useState<
    Record<"7d" | "30d" | "all", SummaryForCardsV2> | null
  >(null);
  const [stats, setStats] = useState<any>(null);
  const [dailyTrend, setDailyTrend] = useState<DailyTrendStat[]>([]);

  const prevUidRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!uid) {
      setSummaries(null);
      setStats(null);
      setDailyTrend([]);
      setLoading(false);
      prevUidRef.current = null;
      return;
    }

    if (prevUidRef.current === uid) return;
    prevUidRef.current = uid;

    const safeUid = uid;

    async function run() {
      try {
        setLoading(true);

        // stats 本体
        {
          const statsRef = doc(db, "user_stats_v2", safeUid);
          const statsSnap = await getDoc(statsRef);
          if (cancelled) return;
          setStats(statsSnap.exists() ? statsSnap.data() : null);
        }

        // ALL: キャッシュ
        const allBucket: Bucket = await (async () => {
          const allRef = doc(db, "user_stats_v2_all_cache", safeUid);
          const allSnap = await getDoc(allRef);
          const raw = allSnap.exists() ? (allSnap.data() as Partial<Bucket>) : {};
          return { ...empty(), ...(raw as any) };
        })();

        const allComputed = computeForCards(allBucket);

        // 日別トレンド（30日）
        const today = new Date();
        const dailyRows: DailyTrendStat[] = [];

        for (let i = 0; i < 30; i++) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);

          const key = `${safeUid}_${dateKey(d)}`;
          const snap = await getDoc(doc(db, "user_stats_v2_daily", key));
          if (!snap.exists()) continue;

          const v = snap.data()?.all as Partial<Bucket> | undefined;
          if (!v) continue;

          const posts = safeInt(v.posts);
          const wins = safeInt(v.wins);
          const brierSum = safeNum(v.brierSum);
          const scorePrecisionSum = safeNum(v.scorePrecisionSum);

          dailyRows.push({
            date: dateKey(d),
            posts,
            winRate: posts ? wins / posts : 0,
            accuracy: posts ? 1 - brierSum / posts : 0,
            scorePrecision: posts ? scorePrecisionSum / posts : 0,
          });
        }

        dailyRows.reverse();
        if (cancelled) return;
        setDailyTrend(dailyRows);

        // 7d / 30d 集計（Bucket を合算）
        async function loadRange(days: number) {
          let b: Bucket = empty();

          for (let i = 0; i < days; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);

            const key = `${safeUid}_${dateKey(d)}`;
            const snap = await getDoc(doc(db, "user_stats_v2_daily", key));
            if (!snap.exists()) continue;

            const v = snap.data()?.all as Partial<Bucket> | undefined;
            if (!v) continue;

            b.posts += safeInt(v.posts);
            b.wins += safeInt(v.wins);

            b.scoreErrorSum += safeNum(v.scoreErrorSum);
            b.brierSum += safeNum(v.brierSum);

            b.upsetHitCount += safeInt(v.upsetHitCount);
            b.upsetOpportunityCount += safeInt(v.upsetOpportunityCount);
            b.upsetPointsSum += safeNum(v.upsetPointsSum);

            b.scorePrecisionSum += safeNum(v.scorePrecisionSum);
            b.pointsSumV3 += safeNum(v.pointsSumV3);
          }

          return computeForCards(b);
        }

        const seven = await loadRange(7);
        const thirty = await loadRange(30);
        if (cancelled) return;

        setSummaries({
          "7d": { fullPosts: seven.posts, ...seven },
          "30d": { fullPosts: thirty.posts, ...thirty },
          "all": { fullPosts: allComputed.posts, ...allComputed },
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [uid]);

  return { loading, summaries, stats, dailyTrend };
}