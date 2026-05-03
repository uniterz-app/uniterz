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
  buildDailyTrendFromDailySnaps,
  mergeDailyTrendWithSnap,
} from "@/lib/profile/userStatsV2ProfileRollup";
import { getPastDateKeysInTimeZone, TIMEZONE_JST } from "@/lib/time/zonedTime";

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
  return {
    posts,
    fullPosts: posts,
    recent3Posts: 0,
    wins,
    winRate: posts > 0 ? wins / posts : 0,
    scorePrecisionSum,
    upsetPointsSum,
    pointsSumV3,
    upsetChanceCount: 0,
    upsetHitCount: 0,
    upsetBonusSum: 0,
    streakBonusSum: 0,
    basePointsSum: pointsSumV3,
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
  /** JST の連続する暦日キー（サーバーの TZ に依存しない） */
  const keys = getPastDateKeysInTimeZone(new Date(), TIMEZONE_JST, 30);
  return Promise.all(
    keys.map((dateKey) =>
      adminDb.doc(`user_stats_v2_daily/${uid}_${dateKey}`).get()
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

/** `dailyTrend` が空または未配列（キャッシュ欠落・旧形式） */
function dailyTrendFromCacheEmpty(
  w: Record<string, unknown> | null | undefined
): boolean {
  if (!w) return true;
  const raw = w.dailyTrend;
  return !Array.isArray(raw) || raw.length === 0;
}

/**
 * 7d / 30d に投稿が載っているのに `dailyTrend` が空 → ウィンドウだけ先にできた古いキャッシュ等。
 * Web は `user_stats_v2_daily` を直読するためグラフが出るが、API 経路だけ空になるのを防ぐ。
 */
function windowRollupShowsPosts(w: Record<string, unknown>): boolean {
  for (const key of ["7d", "30d"] as const) {
    const o = w[key];
    if (o != null && typeof o === "object") {
      const r = o as Record<string, unknown>;
      const posts = safeInt(r.posts ?? r.fullPosts ?? r.totalPosts);
      if (posts > 0) return true;
    }
  }
  return false;
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
    const wObj = windowData as Record<string, unknown> | null | undefined;
    const missingRollup = !windowCacheHasProfileRollup(wObj);
    const cacheTrendIncomplete =
      wantWindow &&
      !!wObj &&
      windowCacheHasProfileRollup(wObj) &&
      dailyTrendFromCacheEmpty(wObj) &&
      windowRollupShowsPosts(wObj);
    const needRebuild =
      wantWindow &&
      (forceRefresh || stale || missingRollup || cacheTrendIncomplete);

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
        const raw = w.dailyTrend;
        dailyTrend = Array.isArray(raw) ? (raw as ProfileDailyTrendRow[]) : [];
      }
    } else {
      dailyTrend = [];
    }

    /**
     * キャッシュは当日ぶんが古いことがある。また再構築パスでも Race で取りこぼしうるため、
     * 常に JST 当日ドキュメントを1読してマージする（冪等）。
     */
    if (wantWindow) {
      const todayKeys = getPastDateKeysInTimeZone(new Date(), TIMEZONE_JST, 1);
      const todayKey = todayKeys[0];
      if (todayKey) {
        const todaySnap = await adminDb
          .doc(`user_stats_v2_daily/${uid}_${todayKey}`)
          .get();
        dailyTrend = mergeDailyTrendWithSnap(dailyTrend, todaySnap);
      }
    }

    const summary = wantPhase
      ? summaryFromPhaseRanking(
          cumulative as Record<string, unknown> | null,
          phase
        )
      : null;
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
