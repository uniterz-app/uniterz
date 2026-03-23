// app/api/profile/user-stats/route.ts
// ロールアップキャッシュ利用で Firestore read を削減

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import {
  buildWindowCacheForUser,
  isWindowCacheStale,
} from "@/lib/profile/buildUserStatsWindowCache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

type SummaryForCards = {
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

function safeInt(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

function safeNum(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function computeForCards(b: Bucket): Omit<SummaryForCards, "fullPosts"> {
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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get("uid");
    const forceRefresh = searchParams.get("refresh") === "1";

    if (!uid || typeof uid !== "string") {
      return NextResponse.json(
        { ok: false, error: "uid is required" },
        { status: 400 }
      );
    }

    const [statsSnap, allSnap, windowSnap] = await Promise.all([
      adminDb.collection("user_stats_v2").doc(uid).get(),
      adminDb.collection("user_stats_v2_all_cache").doc(uid).get(),
      adminDb.collection("user_stats_v2_window_cache").doc(uid).get(),
    ]);

    const stats = statsSnap.exists ? statsSnap.data() : null;

    const allRaw = allSnap.exists
      ? (allSnap.data() as Partial<Bucket>)
      : {};
    const allBucket: Bucket = { ...empty(), ...(allRaw as Record<string, unknown>) };
    const allComputed = computeForCards(allBucket);

    const windowData = windowSnap.exists ? windowSnap.data() : null;
    const updatedAt = windowData?.updatedAt;
    const needRebuild =
      forceRefresh || !windowData || isWindowCacheStale(updatedAt);

    let seven: SummaryForCards;
    let thirty: SummaryForCards;

    if (needRebuild) {
      await buildWindowCacheForUser(adminDb, uid);
      const refreshed = await adminDb
        .collection("user_stats_v2_window_cache")
        .doc(uid)
        .get();
      const data = refreshed.exists ? refreshed.data() : null;
      seven = (data?.["7d"] as SummaryForCards) ?? {
        fullPosts: 0,
        posts: 0,
        wins: 0,
        winRate: 0,
        scorePrecisionSum: 0,
        upsetPointsSum: 0,
        pointsSumV3: 0,
        upsetChanceCount: 0,
        upsetHitCount: 0,
      };
      thirty =
        (data?.["30d"] as SummaryForCards) ?? { ...seven, fullPosts: 0 };
    } else {
      seven = (windowData?.["7d"] as SummaryForCards) ?? {
        fullPosts: 0,
        posts: 0,
        wins: 0,
        winRate: 0,
        scorePrecisionSum: 0,
        upsetPointsSum: 0,
        pointsSumV3: 0,
        upsetChanceCount: 0,
        upsetHitCount: 0,
      };
      thirty =
        (windowData?.["30d"] as SummaryForCards) ?? { ...seven, fullPosts: 0 };
    }

    const summaries = {
      "7d": seven,
      "30d": thirty,
      all: { fullPosts: allComputed.posts, ...allComputed },
    };

    return NextResponse.json({
      ok: true,
      stats,
      summaries,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "unexpected error";
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
