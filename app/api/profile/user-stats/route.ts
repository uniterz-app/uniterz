// app/api/profile/user-stats/route.ts
// ロールアップキャッシュで Firestore read を抑える

import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import {
  buildWindowCacheForUserFromSnapshots,
  isWindowCacheStale,
} from "@/lib/profile/buildUserStatsWindowCache";
import { resolveUidByHandleCached } from "@/lib/profile/resolveUidByHandleCached";
import {
  aggregateRecentWindowsFromDailySnaps,
  buildDailyTrendFromDailySnaps,
  dateKeyJSTIntl,
} from "@/lib/profile/userStatsV2ProfileRollup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SummaryForCards = {
  posts: number;
  fullPosts: number;
  recent3Posts: number;
  wins: number;
  winRate: number;
  scorePrecisionSum: number;
  upsetPointsSum: number;
  pointsSumV3: number;
  upsetChanceCount: number;
  upsetHitCount: number;
  /** bonus breakdown (finalizePost / updateUserStatsV2) */
  upsetBonusSum: number;
  streakBonusSum: number;
  basePointsSum: number;
};

function safeInt(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

function safeNum(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function summaryAllFromCumulativeAndStats(
  cumulative: Record<string, unknown> | null,
  stats: Record<string, unknown> | null
): SummaryForCards {
  const c = cumulative ?? {};
  const s = stats ?? {};
  const posts = safeInt(c.totalPosts);
  const wins = safeInt(c.totalWins);
  const pointsSumV3 = safeNum(c.totalPoints);
  const upsetPointsSum = safeNum(c.totalUpset);
  const scorePrecisionSum = safeNum(c.totalPrecision);
  const upsetBonusSum = safeNum(s.upsetBonusSum);
  const streakBonusSum = safeNum(s.streakBonusSum);
  const basePointsSum = Math.max(
    0,
    pointsSumV3 - upsetBonusSum - streakBonusSum
  );
  return {
    posts,
    fullPosts: posts,
    recent3Posts: 0,
    wins,
    winRate: posts ? wins / posts : 0,
    scorePrecisionSum,
    upsetPointsSum,
    pointsSumV3,
    upsetChanceCount: safeInt(s.upsetOpportunityCount),
    upsetHitCount: safeInt(s.upsetHitCount),
    upsetBonusSum,
    streakBonusSum,
    basePointsSum,
  };
}

async function fetchLast30DailySnapshots(adminDb: ReturnType<typeof getAdminDb>, uid: string) {
  const today = new Date();
  const dates = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    return d;
  });
  return Promise.all(
    dates.map((d) =>
      adminDb.doc(`user_stats_v2_daily/${uid}_${dateKeyJSTIntl(d)}`).get()
    )
  );
}

export async function GET(req: Request) {
  try {
    const adminDb = getAdminDb();
    const { searchParams } = new URL(req.url);
    const uidParam = searchParams.get("uid")?.trim() ?? "";
    const handleParam = searchParams.get("handle")?.trim() ?? "";
    const forceRefresh = searchParams.get("refresh") === "1";

    let resolvedUid = uidParam;
    if (!resolvedUid && handleParam) {
      resolvedUid = (await resolveUidByHandleCached(adminDb, handleParam)) ?? "";
    }

    if (!resolvedUid) {
      if (handleParam) {
        return NextResponse.json(
          { ok: false, error: "user not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { ok: false, error: "uid or handle is required" },
        { status: 400 }
      );
    }

    const uid = resolvedUid;

    const [statsSnap, cumulativeSnap, windowSnap, last30Snaps] = await Promise.all([
      adminDb.collection("user_stats_v2").doc(uid).get(),
      adminDb.collection("cumulative_stats").doc(uid).get(),
      adminDb.collection("user_stats_v2_window_cache").doc(uid).get(),
      fetchLast30DailySnapshots(adminDb, uid),
    ]);

    const stats = statsSnap.exists ? statsSnap.data() : null;
    const cumulative = cumulativeSnap.exists ? cumulativeSnap.data() : null;

    const windowData = windowSnap.exists ? windowSnap.data() : null;
    const updatedAt = windowData?.updatedAt;
    const needRebuild =
      forceRefresh || !windowData || isWindowCacheStale(updatedAt);

    if (needRebuild) {
      try {
        await buildWindowCacheForUserFromSnapshots(adminDb, uid, last30Snaps);
      } catch (e) {
        console.warn("[profile/user-stats] window cache rebuild failed:", e);
      }
    }

    const { recent3, seven, thirty } =
      aggregateRecentWindowsFromDailySnaps(last30Snaps);
    const dailyTrend = buildDailyTrendFromDailySnaps(last30Snaps);
    const allSummary = summaryAllFromCumulativeAndStats(
      cumulative as Record<string, unknown> | null,
      stats as Record<string, unknown> | null
    );

    const recent3Posts = recent3.fullPosts;

    const summaries = {
      "7d": { ...seven, recent3Posts },
      "30d": { ...thirty, recent3Posts },
      all: { ...allSummary, recent3Posts },
    };

    return NextResponse.json({
      ok: true,
      resolvedUid: uid,
      stats,
      summaries,
      dailyTrend,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "unexpected error";
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
