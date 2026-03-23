// app/component/profile/useUserStatsV2.ts
"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

/* ========= Bucket 型（user_stats_v2_daily/{uid_date}.all と揃える） ========= */
type Bucket = {
  posts: number;
  wins: number;
  scoreErrorSum: number;
  upsetHitCount: number;
  upsetOpportunityCount: number;
  upsetPointsSum: number;
  scorePrecisionSum: number;
  pointsSumV3: number;
};

export type SummaryForCardsV2 = {
  posts: number;
  fullPosts: number;
  wins: number;
  winRate: number;
  scorePrecisionSum: number;
  upsetPointsSum: number;
  pointsSumV3: number;
  upsetChanceCount: number;
  upsetHitCount: number;
};

/* ========= 初期値 ========= */
const empty = (): Bucket => ({
  posts: 0,
  wins: 0,
  scoreErrorSum: 0,
  upsetHitCount: 0,
  upsetOpportunityCount: 0,
  upsetPointsSum: 0,
  scorePrecisionSum: 0,
  pointsSumV3: 0,
});

function safeNum(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function safeInt(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

function dateKeyJST(d: Date): string {
  const j = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const yyyy = j.getUTCFullYear();
  const mm = String(j.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(j.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function mergeBucket(base: Bucket, v?: Partial<Bucket> | null): Bucket {
  if (!v) return base;
  base.posts += safeInt(v.posts);
  base.wins += safeInt(v.wins);
  base.scoreErrorSum += safeNum(v.scoreErrorSum);
  base.upsetHitCount += safeInt(v.upsetHitCount);
  base.upsetOpportunityCount += safeInt(v.upsetOpportunityCount);
  base.upsetPointsSum += safeNum(v.upsetPointsSum);
  base.scorePrecisionSum += safeNum(v.scorePrecisionSum);
  base.pointsSumV3 += safeNum(v.pointsSumV3);
  return base;
}

function computeForCards(b: Bucket): Omit<SummaryForCardsV2, "fullPosts"> {
  const posts = safeInt(b.posts);
  const wins = safeInt(b.wins);
  return {
    posts,
    wins,
    winRate: posts ? wins / posts : 0,
    scorePrecisionSum: safeNum(b.scorePrecisionSum),
    upsetPointsSum: safeNum(b.upsetPointsSum),
    pointsSumV3: safeNum(b.pointsSumV3),
    upsetChanceCount: safeInt(b.upsetOpportunityCount),
    upsetHitCount: safeInt(b.upsetHitCount),
  };
}

export function useUserStatsV2(uid?: string | null) {
  const [loading, setLoading] = useState(true);
  const [summaries, setSummaries] = useState<
    Record<"7d" | "30d" | "all", SummaryForCardsV2> | null
  >(null);
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!uid) {
      setSummaries(null);
      setStats(null);
      setLoading(false);
      return;
    }

    const safeUid = uid;

    async function run() {
      try {
        setLoading(true);

        const statsRef = doc(db, "user_stats_v2", safeUid);
        const allRef = doc(db, "user_stats_v2_all_cache", safeUid);

        const [statsSnap, allSnap] = await Promise.all([
          getDoc(statsRef),
          getDoc(allRef),
        ]);

        if (cancelled) return;

        setStats(statsSnap.exists() ? statsSnap.data() : null);

        const allRaw = allSnap.exists()
          ? (allSnap.data() as Partial<Bucket>)
          : ({} as Partial<Bucket>);
        const allBucket: Bucket = { ...empty(), ...(allRaw as Record<string, unknown>) };
        const allComputed = computeForCards(allBucket);

        const today = new Date();
        const dates = Array.from({ length: 30 }, (_, i) => {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          return d;
        });

        const dailySnaps = await Promise.all(
          dates.map((d) =>
            getDoc(doc(db, "user_stats_v2_daily", `${safeUid}_${dateKeyJST(d)}`))
          )
        );

        if (cancelled) return;

        const dailyDocs = dates.map((d, index) => {
          const snap = dailySnaps[index];
          const raw = snap.exists()
            ? (snap.data()?.all as Partial<Bucket> | undefined)
            : undefined;
          return {
            bucket: raw ? ({ ...empty(), ...raw } as Bucket) : null,
          };
        });

        const sevenBucket = dailyDocs
          .slice(0, 7)
          .reduce((acc, row) => mergeBucket(acc, row.bucket), empty());

        const thirtyBucket = dailyDocs
          .slice(0, 30)
          .reduce((acc, row) => mergeBucket(acc, row.bucket), empty());

        const seven = computeForCards(sevenBucket);
        const thirty = computeForCards(thirtyBucket);

        if (cancelled) return;

        setSummaries({
          "7d": { fullPosts: seven.posts, ...seven },
          "30d": { fullPosts: thirty.posts, ...thirty },
          all: { fullPosts: allComputed.posts, ...allComputed },
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

  return { loading, summaries, stats };
}
