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
  mergeDailyTrendWithSnap,
  resolveProfileDailyTrendContext,
} from "@/lib/profile/userStatsV2ProfileRollup";
import { getPastDateKeysInTimeZone, TIMEZONE_JST } from "@/lib/time/zonedTime";
import {
  isRankingLeagueSource,
  type RankingLeagueSource,
} from "@/lib/rankings/rankingLeagueSource";
import { fetchProfileSummaryRanks } from "@/lib/rankings/server/fetchProfileSummaryRanks";
import { isWcRankingStage, type WcRankingStage } from "@/lib/rankings/wcRankingStage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StatsPart = "stats" | "phase" | "trend" | "ranks";
type RankingPhase = "play_in" | "playoffs";

const ALL_PARTS: StatsPart[] = ["stats", "phase", "trend", "ranks"];

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
  activeWinStreak?: number;
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
    activeWinStreak: safeInt(r.activeWinStreak),
  };
}

function summaryFromWcStageRanking(
  cumulative: Record<string, unknown> | null,
  wcStage: WcRankingStage
): SummaryForCards {
  const byWcStage = ((cumulative?.rankingByWcStage as Record<string, unknown>) ??
    {}) as Record<string, Record<string, unknown> | undefined>;
  const r = byWcStage[wcStage] ?? {};
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
    activeWinStreak: safeInt(r.activeWinStreak),
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

function hasWcStageBonusFields(
  cumulative: Record<string, unknown> | null,
  wcStage: WcRankingStage
): boolean {
  const byWcStage = ((cumulative?.rankingByWcStage as Record<string, unknown>) ??
    {}) as Record<string, Record<string, unknown> | undefined>;
  const r = byWcStage[wcStage] ?? {};
  return (
    Object.prototype.hasOwnProperty.call(r, "upsetBonusSum") &&
    Object.prototype.hasOwnProperty.call(r, "streakBonusSum")
  );
}

async function summaryFromDailyPhaseFallback(
  adminDb: ReturnType<typeof getAdminDb>,
  uid: string,
  phase: RankingPhase,
  wcStage?: WcRankingStage
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
    const byWc = (data.rankingByWcStage ?? {}) as Record<string, unknown>;
    const row = wcStage
      ? ((byWc[wcStage] ?? {}) as Record<string, unknown>)
      : ((byPhase[phase] ?? {}) as Record<string, unknown>);
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
    activeWinStreak: 0,
  };
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
    const rawLeague = searchParams.get("league");
    const rankingLeague: RankingLeagueSource = isRankingLeagueSource(rawLeague)
      ? rawLeague
      : "nba";
    const rawWcStage = searchParams.get("wcStage");
    const wcStage: WcRankingStage | undefined =
      rankingLeague === "worldcup" && isWcRankingStage(rawWcStage)
        ? rawWcStage
        : rankingLeague === "worldcup"
          ? "overall"
          : undefined;
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
    const wantRanks = parts.has("ranks");
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

    const dailyTrendCtx = resolveProfileDailyTrendContext(
      rankingLeague,
      wcStage
    );
    /** WC は window_cache の dailyTrend（NBA 合算）を使わず日次スナップショットから組み立てる */
    const wcStageSpecificTrend = rankingLeague === "worldcup";

    let dailyTrend: ProfileDailyTrendRow[] = [];

    if (wantWindow) {
      let last30Snaps: Awaited<ReturnType<typeof fetchLast30DailySnapshots>> | null =
        null;

      if (wcStageSpecificTrend || needRebuild) {
        last30Snaps = await fetchLast30DailySnapshots(adminDb, uid);
      }

      if (wcStageSpecificTrend && last30Snaps) {
        dailyTrend = buildDailyTrendFromDailySnaps(last30Snaps, dailyTrendCtx);
      } else if (needRebuild && last30Snaps) {
        try {
          await buildWindowCacheForUserFromSnapshots(adminDb, uid, last30Snaps);
        } catch (e) {
          console.warn("[profile/user-stats] window cache rebuild failed:", e);
        }
        dailyTrend = buildDailyTrendFromDailySnaps(last30Snaps, dailyTrendCtx);
      } else if (!wcStageSpecificTrend) {
        const w = windowData as Record<string, unknown>;
        const raw = w.dailyTrend;
        dailyTrend = Array.isArray(raw) ? (raw as ProfileDailyTrendRow[]) : [];
      }

      const todayKeys = getPastDateKeysInTimeZone(new Date(), TIMEZONE_JST, 1);
      const todayKey = todayKeys[0];
      if (todayKey) {
        const todaySnap = await adminDb
          .doc(`user_stats_v2_daily/${uid}_${todayKey}`)
          .get();
        dailyTrend = mergeDailyTrendWithSnap(dailyTrend, todaySnap, dailyTrendCtx);
      }
    }

    let summary = wantPhase
      ? rankingLeague === "worldcup" && wcStage
        ? summaryFromWcStageRanking(cumulative as Record<string, unknown> | null, wcStage)
        : summaryFromPhaseRanking(
            cumulative as Record<string, unknown> | null,
            phase
          )
      : null;
    if (wantPhase) {
      const missingBonus =
        rankingLeague === "worldcup" && wcStage
          ? !hasWcStageBonusFields(cumulative as Record<string, unknown> | null, wcStage)
          : !hasPhaseBonusFields(cumulative as Record<string, unknown> | null, phase);
      if (missingBonus) {
        summary = await summaryFromDailyPhaseFallback(
          adminDb,
          uid,
          phase,
          wcStage
        );
      }
    }
    // 連勝はリーグ／WC ステージ単位（クライアントで投稿から算出）。グローバル streak は混ぜない。
    /** Overview の順位は Functions 取得のため `ranks` パートで分離（`phase` だけなら高速） */
    let summaryRanks: SummaryRanks | null = null;
    if (wantRanks) {
      summaryRanks = await fetchProfileSummaryRanks(
        uid,
        phase,
        rankingLeague === "worldcup" ? wcStage : undefined
      );
    }

    const body: Record<string, unknown> = {
      ok: true,
      resolvedUid: uid,
      parts: [...parts],
      phase,
      rankingLeague,
      wcStage: wcStage ?? null,
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
