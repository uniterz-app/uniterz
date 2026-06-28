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
  resolveWcProfileSummaryLive,
  resolveNbaProfileSummaryLive,
  type ProfileSummaryForCards,
} from "@/lib/profile/resolveLiveProfileSummary";
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
import {
  loadMyRankMetricValueDeltas,
  loadPriorSnapshotMetrics,
} from "@/lib/rankings/server/loadMyRankMetricValueDeltas";
import type { MyRankMetricValueDeltas } from "@/lib/rankings/myRankMetricValueDeltas";
import { isWcRankingStage, type WcRankingStage } from "@/lib/rankings/wcRankingStage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StatsPart = "stats" | "phase" | "trend" | "ranks";
type RankingPhase = "play_in" | "playoffs";

const ALL_PARTS: StatsPart[] = ["stats", "phase", "trend", "ranks"];

type SummaryForCards = ProfileSummaryForCards;

type SummaryRanks = {
  totalPrecision: number | null;
  totalUpset: number | null;
  totalPoints: number | null;
  totalPointsDenominator: number | null;
  rankDeltaPlaces: number | null;
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

async function fetchLast30DailySnapshots(adminDb: ReturnType<typeof getAdminDb>, uid: string) {
  /** JST の連続する暦日キー（サーバーの TZ に依存しない） */
  const keys = getPastDateKeysInTimeZone(new Date(), TIMEZONE_JST, 30);
  if (keys.length === 0) return [];
  const refs = keys.map((dateKey) =>
    adminDb.doc(`user_stats_v2_daily/${uid}_${dateKey}`)
  );
  /** 30 件の個別 get を 1 回のバッチ read に集約（往復削減） */
  const snaps = await adminDb.getAll(...refs);
  /** getAll の戻り順に依存せず keys 順（snaps[0]=今日）を保証する */
  const byId = new Map(snaps.map((s) => [s.id, s]));
  return keys.map((dateKey) => byId.get(`${uid}_${dateKey}`)!);
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
    const cumulativeSnap =
      wantPhase || wantRanks
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

    let summary: SummaryForCards | null = null;
    let metricValueDeltas: MyRankMetricValueDeltas | null = null;
    if (wantPhase) {
      const deltaOpts = {
        phase,
        round: "overall" as const,
        wcStage: rankingLeague === "worldcup" ? (wcStage ?? "overall") : null,
        rankingLeague,
      };
      const priorMetrics = await loadPriorSnapshotMetrics(uid, deltaOpts);

      if (rankingLeague === "worldcup" && wcStage) {
        summary = await resolveWcProfileSummaryLive(
          adminDb,
          uid,
          wcStage,
          cumulative as Record<string, unknown> | null,
          priorMetrics
        );
        /**
         * WC（football）の現在連勝・最大連勝は updateUserStreak が試合確定時に
         * user_stats_v2 へライブ保存している。WC は football 唯一なので
         * 「WC 全体（overall）の連勝」= football の連勝として確定値を採用する。
         * （クライアントは Firestore ルールで他人の user_stats_v2 を読めないため API で渡す）
         */
        if (wcStage === "overall" && summary) {
          try {
            const usSnap = await adminDb
              .collection("user_stats_v2")
              .doc(uid)
              .get();
            const us = usSnap.exists
              ? (usSnap.data() as Record<string, unknown>)
              : {};
            const curFootball = safeNum(us.streakFootball);
            const maxBySport = (us.maxWinStreakBySport ?? {}) as Record<
              string,
              unknown
            >;
            summary.activeWinStreak =
              curFootball > 0 ? Math.floor(curFootball) : 0;
            summary.maxWinStreak = safeInt(
              maxBySport.football ?? us.maxWinStreakFootball
            );
          } catch {
            /* ライブ連勝が取れなくてもサマリー自体は返す */
          }
        } else if (
          (wcStage === "qualifying" || wcStage === "main") &&
          summary
        ) {
          try {
            const usSnap = await adminDb
              .collection("user_stats_v2")
              .doc(uid)
              .get();
            const us = usSnap.exists
              ? (usSnap.data() as Record<string, unknown>)
              : {};
            const byStage = (us.activeWinStreakByWcStage ?? {}) as Record<
              string,
              unknown
            >;
            const live = safeInt(byStage[wcStage]);
            summary.activeWinStreak = live;
            const maxByStage = (us.maxWinStreakByWcStage ?? {}) as Record<
              string,
              unknown
            >;
            summary.maxWinStreak = safeInt(maxByStage[wcStage]);
          } catch {
            /* 同上 */
          }
        }
      } else {
        summary = await resolveNbaProfileSummaryLive(
          adminDb,
          uid,
          phase,
          cumulative as Record<string, unknown> | null,
          priorMetrics
        );
      }

      if (summary) {
        const winRatePct =
          summary.winRate <= 1 ? summary.winRate * 100 : summary.winRate;
        metricValueDeltas = await loadMyRankMetricValueDeltas(
          uid,
          {
            totalPoints: summary.pointsSumV3,
            totalPrecision: summary.scorePrecisionSum,
            totalUpset: summary.upsetPointsSum,
            winRate: winRatePct,
          },
          {
            ...deltaOpts,
            priorMetrics,
          }
        );
      }
    }

    /** ティアタグ用 — 日次スナップショット（Functions 不要）。phase 取得時も同梱可。 */
    let summaryRanks: SummaryRanks | null = null;
    if (wantRanks || wantPhase) {
      summaryRanks = await fetchProfileSummaryRanks(
        uid,
        phase,
        rankingLeague === "worldcup" ? wcStage : undefined,
        cumulative as Record<string, unknown> | null | undefined
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
    if (metricValueDeltas) body.metricValueDeltas = metricValueDeltas;
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
