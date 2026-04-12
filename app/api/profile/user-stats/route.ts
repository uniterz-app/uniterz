// app/api/profile/user-stats/route.ts
// ロールアップキャッシュ利用で Firestore read を削減

import { NextResponse } from "next/server";
import { FieldPath } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebaseAdmin";
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
  /** 総合得点内訳（finalizePost / updateUserStatsV2 と一致） */
  upsetBonusSum: number;
  streakBonusSum: number;
  basePointsSum: number;
};

function dateKeyJST(d: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);

  const yyyy = parts.find((p) => p.type === "year")?.value ?? "1970";
  const mm = parts.find((p) => p.type === "month")?.value ?? "01";
  const dd = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${yyyy}-${mm}-${dd}`;
}

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

async function aggregateFromDaily(uid: string, days: number): Promise<SummaryForCards> {
  const adminDb = getAdminDb();
  const today = new Date();
  const dates = Array.from({ length: days }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    return d;
  });

  const snaps = await Promise.all(
    dates.map((d) =>
      adminDb.doc(`user_stats_v2_daily/${uid}_${dateKeyJST(d)}`).get()
    )
  );

  const bucket = snaps.reduce((acc, snap) => {
    const raw = snap.exists
      ? (snap.data()?.all as Partial<Bucket> | undefined)
      : undefined;
    return mergeBucket(acc, raw ?? null);
  }, empty());

  const computed = computeForCards(bucket);
  return { fullPosts: computed.posts, ...computed };
}

/** 全期間：日次 `all` の合算（user_stats_v2_all_cache は未整備のため使わない） */
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

export async function GET(req: Request) {
  try {
    const adminDb = getAdminDb();
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get("uid");
    const forceRefresh = searchParams.get("refresh") === "1";

    if (!uid || typeof uid !== "string") {
      return NextResponse.json(
        { ok: false, error: "uid is required" },
        { status: 400 }
      );
    }

    const [statsSnap, windowSnap] = await Promise.all([
      adminDb.collection("user_stats_v2").doc(uid).get(),
      adminDb.collection("user_stats_v2_window_cache").doc(uid).get(),
    ]);

    const stats = statsSnap.exists ? statsSnap.data() : null;

    const windowData = windowSnap.exists ? windowSnap.data() : null;
    const updatedAt = windowData?.updatedAt;
    const needRebuild =
      forceRefresh || !windowData || isWindowCacheStale(updatedAt);

    if (needRebuild) {
      try {
        await buildWindowCacheForUser(adminDb, uid);
      } catch (e) {
        // 再構築に失敗しても、下の daily 実集計レスポンスは返す
        console.warn("[profile/user-stats] window cache rebuild failed:", e);
      }
    }

    // window cache は更新トリガー用途に留め、レスポンスは daily 実集計を返す
    // （7d 初回だけ 0 になる不整合を防ぐ）
    // all も日次 all の合算（キャッシュ doc は未整備で空になりがちなため）
    const [recent3, seven, thirty, allSummary] = await Promise.all([
      aggregateFromDaily(uid, 3),
      aggregateFromDaily(uid, 7),
      aggregateFromDaily(uid, 30),
      aggregateAllFromDaily(uid),
    ]);

    const recent3Posts = recent3.fullPosts;

    const summaries = {
      "7d": { ...seven, recent3Posts },
      "30d": { ...thirty, recent3Posts },
      all: { ...allSummary, recent3Posts },
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
