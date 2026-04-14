// app/api/profile/user-stats/route.ts
// ロールアップキャッシュで Firestore read を抑える

import { NextResponse } from "next/server";
import { FieldPath } from "firebase-admin/firestore";
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

type Bucket = {
  posts: number;
  wins: number;
  scoreErrorSum: number;
  upsetHitCount: number;
  upsetOpportunityCount: number;
  upsetPointsSum: number;
  scorePrecisionSum: number;
  pointsSumV3: number;
  upsetBonusSum: number;
  streakBonusSum: number;
};

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

const empty = (): Bucket => ({
  posts: 0,
  wins: 0,
  scoreErrorSum: 0,
  upsetHitCount: 0,
  upsetOpportunityCount: 0,
  upsetPointsSum: 0,
  scorePrecisionSum: 0,
  pointsSumV3: 0,
  upsetBonusSum: 0,
  streakBonusSum: 0,
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
  const pointsSumV3 = safeNum(b.pointsSumV3);
  const upsetBonusSum = safeNum(b.upsetBonusSum);
  const streakBonusSum = safeNum(b.streakBonusSum);
  const basePointsSum = Math.max(
    0,
    pointsSumV3 - upsetBonusSum - streakBonusSum
  );
  return {
    posts,
    recent3Posts: 0,
    wins,
    winRate: posts ? wins / posts : 0,
    scorePrecisionSum: safeNum(b.scorePrecisionSum),
    upsetPointsSum: safeNum(b.upsetPointsSum),
    pointsSumV3,
    upsetChanceCount: safeInt(b.upsetOpportunityCount),
    upsetHitCount: safeInt(b.upsetHitCount),
    upsetBonusSum,
    streakBonusSum,
    basePointsSum,
  };
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
  base.upsetBonusSum += safeNum(v.upsetBonusSum);
  base.streakBonusSum += safeNum(v.streakBonusSum);
  return base;
}

/** 全期間：日次 `all` の合算 */
async function aggregateAllFromDaily(uid: string): Promise<SummaryForCards> {
  const adminDb = getAdminDb();
  const snap = await adminDb
    .collection("user_stats_v2_daily")
    .where(FieldPath.documentId(), ">=", `${uid}_`)
    .where(FieldPath.documentId(), "<", `${uid}_\uf8ff`)
    .get();

  const bucket = empty();
  snap.forEach((doc) => {
    const raw = doc.data()?.all as Partial<Bucket> | undefined;
    mergeBucket(bucket, raw ?? null);
  });

  const computed = computeForCards(bucket);
  return { fullPosts: computed.posts, ...computed };
}

const ALL_SUMMARY_TTL_MS = 45_000;
const allSummaryCache = new Map<string, { at: number; summary: SummaryForCards }>();

function getCachedAllSummary(uid: string): SummaryForCards | null {
  const hit = allSummaryCache.get(uid);
  if (!hit) return null;
  if (Date.now() - hit.at >= ALL_SUMMARY_TTL_MS) {
    allSummaryCache.delete(uid);
    return null;
  }
  return hit.summary;
}

function setCachedAllSummary(uid: string, summary: SummaryForCards) {
  allSummaryCache.set(uid, { at: Date.now(), summary });
}

async function aggregateAllFromDailyCached(uid: string): Promise<SummaryForCards> {
  const cached = getCachedAllSummary(uid);
  if (cached) return cached;
  const summary = await aggregateAllFromDaily(uid);
  setCachedAllSummary(uid, summary);
  return summary;
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

    const [statsSnap, windowSnap, last30Snaps] = await Promise.all([
      adminDb.collection("user_stats_v2").doc(uid).get(),
      adminDb.collection("user_stats_v2_window_cache").doc(uid).get(),
      fetchLast30DailySnapshots(adminDb, uid),
    ]);

    const stats = statsSnap.exists ? statsSnap.data() : null;

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
    const allSummary = forceRefresh
      ? await aggregateAllFromDaily(uid).then((s) => {
          setCachedAllSummary(uid, s);
          return s;
        })
      : await aggregateAllFromDailyCached(uid);

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
