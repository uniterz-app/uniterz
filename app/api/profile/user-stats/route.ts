// app/api/profile/user-stats/route.ts
// ロールアップキャッシュで Firestore read を抑える

import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import {
  buildWindowCacheForUserFromSnapshots,
  isWindowCacheStale,
} from "@/lib/profile/buildUserStatsWindowCache";
import { resolveUidByHandleCached } from "@/lib/profile/resolveUidByHandleCached";
import type { ProfileDailyTrendRow } from "@/lib/profile/profileDailyTrendRow";
import {
  aggregateRecentWindowsFromDailySnaps,
  buildDailyTrendFromDailySnaps,
  dateKeyJSTIntl,
} from "@/lib/profile/userStatsV2ProfileRollup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StatsPart = "stats" | "7d" | "30d" | "all" | "trend";

const ALL_PARTS: StatsPart[] = ["stats", "7d", "30d", "all", "trend"];

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

function windowCacheHasProfileRollup(w: Record<string, unknown> | null | undefined): boolean {
  if (!w) return false;
  if (typeof w.recent3Posts !== "number") return false;
  if (!Array.isArray(w.dailyTrend)) return false;
  const s7 = w["7d"];
  const s30 = w["30d"];
  return (
    s7 != null &&
    typeof s7 === "object" &&
    s30 != null &&
    typeof s30 === "object"
  );
}

function parsePartsParam(raw: string | null): Set<StatsPart> | null {
  if (raw == null) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const out = new Set<StatsPart>();
  for (const p of trimmed.split(",").map((s) => s.trim())) {
    if ((ALL_PARTS as readonly string[]).includes(p)) out.add(p as StatsPart);
  }
  return out.size > 0 ? out : null;
}

export async function GET(req: Request) {
  try {
    const adminDb = getAdminDb();
    const { searchParams } = new URL(req.url);
    const uidParam = searchParams.get("uid")?.trim() ?? "";
    const handleParam = searchParams.get("handle")?.trim() ?? "";
    const forceRefresh = searchParams.get("refresh") === "1";
    const parts =
      parsePartsParam(searchParams.get("parts")) ?? new Set<StatsPart>(ALL_PARTS);

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

    const wantStats = parts.has("stats") || parts.has("all");
    const wantCumulative = parts.has("all");
    const wantWindow =
      parts.has("7d") || parts.has("30d") || parts.has("trend");

    const statsSnap = wantStats
      ? await adminDb.collection("user_stats_v2").doc(uid).get()
      : null;
    const cumulativeSnap = wantCumulative
      ? await adminDb.collection("cumulative_stats").doc(uid).get()
      : null;
    const windowSnap = wantWindow
      ? await adminDb.collection("user_stats_v2_window_cache").doc(uid).get()
      : null;

    const stats = statsSnap?.exists ? statsSnap.data() : null;
    const cumulative = cumulativeSnap?.exists ? cumulativeSnap.data() : null;

    const windowData = windowSnap?.exists ? windowSnap.data() : null;
    const updatedAt = windowData?.updatedAt;
    const stale = !windowData || isWindowCacheStale(updatedAt);
    const missingRollup = !windowCacheHasProfileRollup(
      windowData as Record<string, unknown> | null | undefined
    );
    const needRebuild = wantWindow && (forceRefresh || stale || missingRollup);

    let seven: ReturnType<
      typeof aggregateRecentWindowsFromDailySnaps
    >["seven"];
    let thirty: ReturnType<
      typeof aggregateRecentWindowsFromDailySnaps
    >["thirty"];
    let recent3Posts: number;
    let dailyTrend: ProfileDailyTrendRow[];

    if (wantWindow) {
      if (needRebuild) {
        const last30Snaps = await fetchLast30DailySnapshots(adminDb, uid);
        try {
          await buildWindowCacheForUserFromSnapshots(adminDb, uid, last30Snaps);
        } catch (e) {
          console.warn("[profile/user-stats] window cache rebuild failed:", e);
        }
        const agg = aggregateRecentWindowsFromDailySnaps(last30Snaps);
        seven = agg.seven;
        thirty = agg.thirty;
        recent3Posts = agg.recent3.fullPosts;
        dailyTrend = buildDailyTrendFromDailySnaps(last30Snaps);
      } else {
        const w = windowData as Record<string, unknown>;
        seven = w["7d"] as typeof seven;
        thirty = w["30d"] as typeof thirty;
        recent3Posts = w.recent3Posts as number;
        dailyTrend = w.dailyTrend as ProfileDailyTrendRow[];
      }
    } else {
      seven = undefined as unknown as typeof seven;
      thirty = undefined as unknown as typeof thirty;
      recent3Posts = 0;
      dailyTrend = [];
    }

    const allSummary = parts.has("all")
      ? summaryAllFromCumulativeAndStats(
          cumulative as Record<string, unknown> | null,
          stats as Record<string, unknown> | null
        )
      : null;

    const recent3ForOverlay = wantWindow ? recent3Posts : 0;

    const summaries: Partial<Record<"7d" | "30d" | "all", SummaryForCards>> = {};
    if (parts.has("7d") && wantWindow) {
      summaries["7d"] = { ...seven, recent3Posts };
    }
    if (parts.has("30d") && wantWindow) {
      summaries["30d"] = { ...thirty, recent3Posts };
    }
    if (parts.has("all") && allSummary) {
      summaries.all = { ...allSummary, recent3Posts: recent3ForOverlay };
    }

    const body: Record<string, unknown> = {
      ok: true,
      resolvedUid: uid,
      parts: [...parts],
    };

    if (wantStats) body.stats = stats;
    if (Object.keys(summaries).length > 0) body.summaries = summaries;
    if (parts.has("trend") && wantWindow) body.dailyTrend = dailyTrend;

    return NextResponse.json(body);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "unexpected error";
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
