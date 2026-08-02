// app/api/profile/user-stats/route.ts
// ロールアップキャッシュで Firestore read を抑える

import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { withFirestoreTransientRetry } from "@/lib/firebase/isTransientFirestoreError";
import { resolveUidByHandleCached } from "@/lib/profile/resolveUidByHandleCached";
import type { ProfileDailyTrendRow } from "@/lib/profile/profileDailyTrendRow";
import {
  resolveWcProfileSummaryLive,
  resolveNbaProfileSummaryLive,
  type ProfileSummaryForCards,
} from "@/lib/profile/resolveLiveProfileSummary";
import { resolveNbaMonthlyProfileSummary } from "@/lib/profile/resolveNbaMonthlyProfileSummary";
import {
  buildDailyTrendFromDailySnaps,
  resolveProfileDailyTrendContext,
} from "@/lib/profile/userStatsV2ProfileRollup";
import { getPastDateKeysInTimeZone, TIMEZONE_JST } from "@/lib/time/zonedTime";
import {
  isRankingLeagueSource,
  type RankingLeagueSource,
} from "@/lib/rankings/rankingLeagueSource";
import {
  currentRankingPeriodLabel,
  isValidPeriodLabel,
} from "@/lib/rankings/rankingPeriod";
import { fetchProfileSummaryRanks } from "@/lib/rankings/server/fetchProfileSummaryRanks";
import {
  buildRankPlayoffTrendPoints,
  type RankPlayoffTrendPoint,
} from "@/lib/rankings/server/buildRankPlayoffTrendPoints";
import {
  loadMyRankMetricValueDeltas,
  loadPriorSnapshotMetrics,
} from "@/lib/rankings/server/loadMyRankMetricValueDeltas";
import type { MyRankMetricValueDeltas } from "@/lib/rankings/myRankMetricValueDeltas";
import { isWcRankingStage, type WcRankingStage } from "@/lib/rankings/wcRankingStage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StatsPart = "stats" | "phase" | "trend" | "ranks" | "rankTrend";

const ALL_PARTS: StatsPart[] = ["stats", "phase", "trend", "ranks", "rankTrend"];

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

async function buildUserStatsResponse(req: Request) {
  const adminDb = getAdminDb();
  const { searchParams } = new URL(req.url);
  const uidParam = searchParams.get("uid")?.trim() ?? "";
  const handleParam = searchParams.get("handle")?.trim() ?? "";
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
  /** NBA のみ: playoffs / season（現行キー） / monthly（互換） */
  const rawPeriod = searchParams.get("period")?.trim() ?? "";
  const nbaScope: "playoffs" | "season" | null =
    rankingLeague === "nba" &&
    (rawPeriod === "playoffs" || rawPeriod === "season")
      ? rawPeriod
      : null;
  const wantMonthly =
    rankingLeague === "nba" && rawPeriod === "monthly";
  const rawMonthLabel = searchParams.get("month")?.trim() ?? "";
  const monthLabel =
    wantMonthly && isValidPeriodLabel("monthly", rawMonthLabel)
      ? rawMonthLabel
      : wantMonthly
        ? currentRankingPeriodLabel("monthly")
        : null;
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
  const wantTrend = parts.has("trend");
  const wantRankTrend = parts.has("rankTrend");

  const dailyTrendCtx = resolveProfileDailyTrendContext(
    rankingLeague,
    wcStage,
    rankingLeague === "nba" ? (nbaScope ?? "season") : undefined
  );

  const needCumulative = !wantMonthly && (wantPhase || wantRanks);

  const [statsSnap, cumulativeSnap, last30Snaps, rankTrendPoints] =
    await Promise.all([
      wantStats
        ? adminDb.collection("user_stats_v2").doc(uid).get()
        : Promise.resolve(null),
      needCumulative
        ? adminDb.collection("cumulative_stats").doc(uid).get()
        : Promise.resolve(null),
      wantTrend
        ? fetchLast30DailySnapshots(adminDb, uid)
        : Promise.resolve([] as Awaited<
            ReturnType<typeof fetchLast30DailySnapshots>
          >),
      wantRankTrend
        ? buildRankPlayoffTrendPoints(uid, {
            rankingLeague,
            wcStage: wcStage ?? "overall",
          })
        : Promise.resolve([] as RankPlayoffTrendPoint[]),
    ]);

  const stats = statsSnap?.exists ? statsSnap.data() : null;
  const cumulative = cumulativeSnap?.exists ? cumulativeSnap.data() : null;

  const dailyTrend: ProfileDailyTrendRow[] = wantTrend
    ? buildDailyTrendFromDailySnaps(last30Snaps, dailyTrendCtx)
    : [];

  let summary: SummaryForCards | null = null;
  let metricValueDeltas: MyRankMetricValueDeltas | null = null;
  let monthlyResolvedLabel: string | null = null;
  let monthlySummaryRanks: SummaryRanks | null = null;
  if (wantMonthly && monthLabel && (wantPhase || wantRanks)) {
    const monthly = await resolveNbaMonthlyProfileSummary(
      adminDb,
      uid,
      monthLabel
    );
    monthlyResolvedLabel = monthly.monthLabel;
    monthlySummaryRanks = monthly.summaryRanks;
    if (wantPhase) {
      summary = monthly.summary;
      // 月次は前日比デルタを出さない（シーズン累計スナップショット基準のため）
      metricValueDeltas = null;
    }
  } else if (wantPhase) {
    const deltaOpts = {
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
        cumulative as Record<string, unknown> | null,
        priorMetrics,
        nbaScope ?? undefined
      );
    }

    if (summary) {
      if (nbaScope === "playoffs") {
        // プレーオフはシーズン前日比スナップショットとスコープが違うのでデルタなし
        metricValueDeltas = null;
      } else {
        const winRatePct =
          summary.winRate <= 1 ? summary.winRate * 100 : summary.winRate;
        metricValueDeltas = await loadMyRankMetricValueDeltas(
          uid,
          {
            totalPoints: summary.pointsSumV3,
            totalPrecision:
              rankingLeague === "worldcup" ? summary.exactHitCount : 0,
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
  }

  /** ティアタグ用 — 日次スナップショット（Functions 不要）。phase 取得時も同梱可。 */
  let summaryRanks: SummaryRanks | null = null;
  if (wantMonthly && monthlySummaryRanks) {
    summaryRanks = monthlySummaryRanks;
  } else if (nbaScope === "playoffs") {
    // プレーオフ専用ボードは廃止済み — 順位は出さない
    summaryRanks = {
      totalPrecision: null,
      totalUpset: null,
      totalPoints: null,
      totalPointsDenominator: null,
      rankDeltaPlaces: null,
    };
  } else if (wantRanks || wantPhase) {
    summaryRanks = await fetchProfileSummaryRanks(
      uid,
      rankingLeague === "worldcup" ? wcStage : undefined,
      cumulative as Record<string, unknown> | null | undefined
    );
  }

  const body: Record<string, unknown> = {
    ok: true,
    resolvedUid: uid,
    parts: [...parts],
    rankingLeague,
    wcStage: wcStage ?? null,
    period: wantMonthly
      ? "monthly"
      : nbaScope === "playoffs"
        ? "playoffs"
        : "season",
    monthLabel: monthlyResolvedLabel,
  };

  if (wantStats) body.stats = stats;
  if (summary) body.summary = summary;
  if (metricValueDeltas) body.metricValueDeltas = metricValueDeltas;
  if (summaryRanks) body.summaryRanks = summaryRanks;
  if (wantTrend) body.dailyTrend = dailyTrend;
  if (wantRankTrend) body.rankTrend = rankTrendPoints;

  return NextResponse.json(body);

}

export async function GET(req: Request) {
  try {
    return await withFirestoreTransientRetry(() => buildUserStatsResponse(req));
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "unexpected error";
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
