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
import type { ProfileDailyTrendRow } from "@/lib/profile/profileDailyTrendRow";
import {
  buildDailyTrendFromDailySnaps,
  dateKeyJSTIntl,
} from "@/lib/profile/userStatsV2ProfileRollup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StatsPart = "stats" | "phase" | "trend";
type RankingPhase = "play_in" | "playoffs";

const ALL_PARTS: StatsPart[] = ["stats", "phase", "trend"];

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

type SummaryRanks = {
  totalPrecision: number | null;
  totalUpset: number | null;
  totalPoints: number | null;
};

function safeInt(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

function safeNum(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function parsePhase(raw: string | null): RankingPhase {
  return raw === "play_in" ? "play_in" : "playoffs";
}

function summaryFromPhaseRanking(
  cumulative: Record<string, unknown> | null,
  phase: RankingPhase
): SummaryForCards {
  const byPhase = ((cumulative?.rankingByPhase as Record<string, unknown>) ??
    {}) as Record<string, Record<string, unknown> | undefined>;
  const r = byPhase[phase] ?? {};
  const posts = safeInt(r.totalPosts);
  const wins = safeInt(r.totalWins);
  const pointsSumV3 = safeNum(r.totalPoints);
  const upsetPointsSum = safeNum(r.totalUpset);
  const scorePrecisionSum = safeNum(r.totalPrecision);
  const upsetBonusSum = safeNum(r.upsetBonusSum);
  const streakBonusSum = safeNum(r.streakBonusSum);
  const basePointsSum = Math.max(0, pointsSumV3 - upsetBonusSum - streakBonusSum);
  return {
    posts,
    fullPosts: posts,
    recent3Posts: 0,
    wins,
    winRate: posts > 0 ? wins / posts : 0,
    scorePrecisionSum,
    upsetPointsSum,
    pointsSumV3,
    upsetChanceCount: safeInt(r.upsetOpportunityCount),
    upsetHitCount: safeInt(r.upsetHitCount),
    upsetBonusSum,
    streakBonusSum,
    basePointsSum,
  };
}

function hasPhaseBonusFields(
  cumulative: Record<string, unknown> | null,
  phase: RankingPhase
): boolean {
  const byPhase = ((cumulative?.rankingByPhase as Record<string, unknown>) ??
    {}) as Record<string, Record<string, unknown> | undefined>;
  const r = byPhase[phase] ?? {};
  return (
    Object.prototype.hasOwnProperty.call(r, "upsetBonusSum") &&
    Object.prototype.hasOwnProperty.call(r, "streakBonusSum")
  );
}

async function summaryFromDailyPhaseFallback(
  adminDb: ReturnType<typeof getAdminDb>,
  uid: string,
  phase: RankingPhase
): Promise<SummaryForCards> {
  const start = `${uid}_`;
  const end = `${uid}_\uf8ff`;
  const snap = await adminDb
    .collection("user_stats_v2_daily")
    .where(FieldPath.documentId(), ">=", start)
    .where(FieldPath.documentId(), "<=", end)
    .get();

  let posts = 0;
  let wins = 0;
  let scorePrecisionSum = 0;
  let upsetPointsSum = 0;
  let pointsSumV3 = 0;
  let upsetChanceCount = 0;
  let upsetHitCount = 0;
  let upsetBonusSum = 0;
  let streakBonusSum = 0;

  for (const d of snap.docs) {
    const data = d.data() as Record<string, unknown>;
    const byPhase = (data.rankingByPhase ?? {}) as Record<string, unknown>;
    const row = (byPhase[phase] ?? {}) as Record<string, unknown>;
    posts += safeInt(row.posts);
    wins += safeInt(row.wins);
    scorePrecisionSum += safeNum(row.scorePrecisionSum);
    upsetPointsSum += safeNum(row.upsetPointsSum);
    pointsSumV3 += safeNum(row.pointsSumV3);
    upsetChanceCount += safeInt(row.upsetOpportunityCount);
    upsetHitCount += safeInt(row.upsetHitCount);
    upsetBonusSum += safeNum(row.upsetBonusSum);
    streakBonusSum += safeNum(row.streakBonusSum);
  }

  return {
    posts,
    fullPosts: posts,
    recent3Posts: 0,
    wins,
    winRate: posts > 0 ? wins / posts : 0,
    scorePrecisionSum,
    upsetPointsSum,
    pointsSumV3,
    upsetChanceCount,
    upsetHitCount,
    upsetBonusSum,
    streakBonusSum,
    basePointsSum: Math.max(0, pointsSumV3 - upsetBonusSum - streakBonusSum),
  };
}

function safeRank(v: unknown): number | null {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return null;
  const i = Math.floor(n);
  return i > 0 ? i : null;
}

function summaryRanksFromSnapshot(
  cumulative: Record<string, unknown> | null,
  phase: RankingPhase
): SummaryRanks {
  const snapshotRanks = (cumulative?.snapshotRanks ?? {}) as Record<
    string,
    Record<string, unknown> | undefined
  >;
  const byPhase = snapshotRanks[phase] ?? {};
  return {
    totalPrecision: safeRank(byPhase.totalPrecision),
    totalUpset: safeRank(byPhase.totalUpset),
    totalPoints: safeRank(byPhase.totalPoints),
  };
}

async function summaryRanksFromRankingBulk(
  uid: string,
  phase: RankingPhase
): Promise<SummaryRanks> {
  const baseUrl =
    process.env.CUMULATIVE_RANKING_FUNCTION_URL ??
    process.env.NEXT_PUBLIC_CUMULATIVE_RANKING_FUNCTION_URL;
  if (!baseUrl) {
    return { totalPrecision: null, totalUpset: null, totalPoints: null };
  }

  const url = new URL(baseUrl);
  url.searchParams.set("uid", uid);
  url.searchParams.set("phase", phase);
  url.searchParams.set("round", "overall");
  url.searchParams.set("metrics", "totalPrecision,totalUpset,totalPoints");

  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      cache: "no-store",
    });
    const json = await res.json();
    if (!res.ok || !json?.ok || typeof json.byMetric !== "object") {
      return { totalPrecision: null, totalUpset: null, totalPoints: null };
    }
    const byMetric = json.byMetric as Record<
      string,
      { myRank?: unknown } | undefined
    >;
    return {
      totalPrecision: safeRank(byMetric.totalPrecision?.myRank),
      totalUpset: safeRank(byMetric.totalUpset?.myRank),
      totalPoints: safeRank(byMetric.totalPoints?.myRank),
    };
  } catch {
    return { totalPrecision: null, totalUpset: null, totalPoints: null };
  }
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
    const phase = parsePhase(searchParams.get("phase"));
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

    const wantStats = parts.has("stats");
    const wantPhase = parts.has("phase");
    const wantWindow = parts.has("trend");

    const statsSnap = wantStats
      ? await adminDb.collection("user_stats_v2").doc(uid).get()
      : null;
    const cumulativeSnap = wantPhase
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

    let dailyTrend: ProfileDailyTrendRow[];

    if (wantWindow) {
      if (needRebuild) {
        const last30Snaps = await fetchLast30DailySnapshots(adminDb, uid);
        try {
          await buildWindowCacheForUserFromSnapshots(adminDb, uid, last30Snaps);
        } catch (e) {
          console.warn("[profile/user-stats] window cache rebuild failed:", e);
        }
        dailyTrend = buildDailyTrendFromDailySnaps(last30Snaps);
      } else {
        const w = windowData as Record<string, unknown>;
        dailyTrend = w.dailyTrend as ProfileDailyTrendRow[];
      }
    } else {
      dailyTrend = [];
    }

    let summary = wantPhase
      ? summaryFromPhaseRanking(
          cumulative as Record<string, unknown> | null,
          phase
        )
      : null;
    if (
      wantPhase &&
      !hasPhaseBonusFields(cumulative as Record<string, unknown> | null, phase)
    ) {
      summary = await summaryFromDailyPhaseFallback(adminDb, uid, phase);
    }
    const summaryRanks = wantPhase
      ? await summaryRanksFromRankingBulk(uid, phase)
      : null;

    const body: Record<string, unknown> = {
      ok: true,
      resolvedUid: uid,
      parts: [...parts],
      phase,
    };

    if (wantStats) body.stats = stats;
    if (summary) body.summary = summary;
    if (summaryRanks) body.summaryRanks = summaryRanks;
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
