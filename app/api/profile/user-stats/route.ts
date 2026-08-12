// app/api/profile/user-stats/route.ts
// ロールアップキャッシュで Firestore read を抑える

import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { withFirestoreTransientRetry } from "@/lib/firebase/isTransientFirestoreError";
import { resolveUidByHandleCached } from "@/lib/profile/resolveUidByHandleCached";
import type { ProfileDailyTrendRow } from "@/lib/profile/profileDailyTrendRow";
import {
  ensureProfileChartsBundle,
  isProfileChartsComplete,
} from "@/lib/profile/ensureProfileChartsBundle";
import { parseProfileChartsBundle } from "@/lib/profile/profileChartsBundle";
import {
  resolveNbaProfileSummaryLive,
  type ProfileSummaryForCards,
} from "@/lib/profile/resolveLiveProfileSummary";
import { resolveNbaWindowProfileSummary } from "@/lib/profile/resolveNbaWindowProfileSummary";
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
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import { fetchProfileSummaryRanks } from "@/lib/rankings/server/fetchProfileSummaryRanks";
import { assertProUser } from "@/lib/rankings/server/fetchRankGapAnalysis";
import {
  buildRankPlayoffTrendPoints,
  type RankPlayoffTrendPoint,
} from "@/lib/rankings/server/buildRankPlayoffTrendPoints";
import {
  loadMyRankMetricValueDeltas,
  loadPriorSnapshotMetrics,
} from "@/lib/rankings/server/loadMyRankMetricValueDeltas";
import type { MyRankMetricValueDeltas } from "@/lib/rankings/myRankMetricValueDeltas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Profile WEEK / MONTH（window）カードのキャッシュ（同一ラベル連打対策） */
const PROFILE_WINDOW_STATS_CACHE_REVALIDATE_SEC = 60;

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
  /** NBA: playoffs / season（累計）/ weekly / monthly（ウィンドウ） */
  const rawPeriod = searchParams.get("period")?.trim() ?? "";
  const nbaScope: "playoffs" | "season" | null =
    rankingLeague === "nba" &&
    (rawPeriod === "playoffs" || rawPeriod === "season")
      ? rawPeriod
      : null;
  const wantWeekly = rankingLeague === "nba" && rawPeriod === "weekly";
  const wantMonthly = rankingLeague === "nba" && rawPeriod === "monthly";
  const wantWindow = wantWeekly || wantMonthly;
  const rawBoard = searchParams.get("board")?.trim() ?? "";
  const windowBoard: "playoffs" | "season" =
    rawBoard === "playoffs" ? "playoffs" : "season";
  const rawWindowLabel =
    searchParams.get(wantWeekly ? "week" : "month")?.trim() ?? "";
  const resolvedWindowPeriod = wantWeekly ? "weekly" : "monthly";
  const requestedWindowLabelValid =
    wantWindow && isValidPeriodLabel(resolvedWindowPeriod, rawWindowLabel);
  const requestedWindowLabel =
    requestedWindowLabelValid && rawWindowLabel ? rawWindowLabel : null;
  const currentWindowLabel = wantWindow
    ? currentRankingPeriodLabel(resolvedWindowPeriod)
    : null;
  const windowLabel =
    wantWindow && requestedWindowLabel
      ? requestedWindowLabel
      : wantWindow
        ? currentWindowLabel
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
    undefined,
    rankingLeague === "nba" ? (nbaScope ?? "season") : undefined
  );

  const needCumulative =
    !wantWindow && (wantPhase || wantRanks || wantTrend || wantRankTrend);

  const [statsSnap, cumulativeSnap] = await Promise.all([
    wantStats
      ? adminDb.collection("user_stats_v2").doc(uid).get()
      : Promise.resolve(null),
    needCumulative
      ? adminDb.collection("cumulative_stats").doc(uid).get()
      : Promise.resolve(null),
  ]);

  const stats = statsSnap?.exists ? statsSnap.data() : null;
  const cumulative = cumulativeSnap?.exists
    ? (cumulativeSnap.data() as Record<string, unknown>)
    : null;

  /** NBA overview: 揃った profileCharts があれば日次30+履歴 read をスキップ */
  let chartsBundle =
    rankingLeague === "nba" && (wantTrend || wantRankTrend)
      ? parseProfileChartsBundle(cumulative, CURRENT_NBA_SEASON_KEY)
      : null;
  if (
    rankingLeague === "nba" &&
    (wantTrend || wantRankTrend) &&
    !isProfileChartsComplete(chartsBundle)
  ) {
    const ensured = await ensureProfileChartsBundle(uid, {
      seasonKey: CURRENT_NBA_SEASON_KEY,
    });
    chartsBundle = {
      v: ensured.v,
      seasonKey: ensured.seasonKey,
      dailyTrend: ensured.dailyTrend,
      rankTrend: ensured.rankTrend,
      last20: ensured.last20,
    };
  }

  const [last30Snaps, rankTrendPoints] = await Promise.all([
    wantTrend &&
    !(
      rankingLeague === "nba" &&
      isProfileChartsComplete(chartsBundle) &&
      (nbaScope ?? "season") === "season"
    )
      ? fetchLast30DailySnapshots(adminDb, uid)
      : Promise.resolve([] as Awaited<
          ReturnType<typeof fetchLast30DailySnapshots>
        >),
    wantRankTrend &&
    !(rankingLeague === "nba" && isProfileChartsComplete(chartsBundle))
      ? buildRankPlayoffTrendPoints(uid, {
          rankingLeague,
        })
      : Promise.resolve([] as RankPlayoffTrendPoint[]),
  ]);

  const dailyTrend: ProfileDailyTrendRow[] = wantTrend
    ? rankingLeague === "nba" &&
      isProfileChartsComplete(chartsBundle) &&
      (nbaScope ?? "season") === "season"
      ? chartsBundle.dailyTrend
      : buildDailyTrendFromDailySnaps(last30Snaps, dailyTrendCtx)
    : [];

  const rankTrendFromCharts: RankPlayoffTrendPoint[] | null =
    wantRankTrend &&
    rankingLeague === "nba" &&
    isProfileChartsComplete(chartsBundle)
      ? chartsBundle.rankTrend.map((p) => ({
          dateKey: p.dateKey,
          rank: p.rank,
        }))
      : null;

  let summary: SummaryForCards | null = null;
  let metricValueDeltas: MyRankMetricValueDeltas | null = null;
  let monthlyResolvedLabel: string | null = null;
  let windowResolvedLabel: string | null = null;
  let monthlySummaryRanks: SummaryRanks | null = null;
  if (wantWindow && windowLabel && (wantPhase || wantRanks)) {
    /**
     * 過去（現行以外の week/month ラベル指定）は Pro ユーザーのみ許可。
     * UI 側は `profile.plan === "pro"` のみラベルナビを出すため、
     * API まで合わせて抜け道を塞ぐ。
     */
    const isNonCurrentWindow =
      requestedWindowLabelValid &&
      requestedWindowLabel &&
      requestedWindowLabel !== currentWindowLabel;

    if (isNonCurrentWindow) {
      const isPro = await assertProUser(uid);
      if (!isPro) {
        return NextResponse.json(
          { ok: false, error: "pro_required" },
          { status: 403 }
        );
      }
    }

    const windowed = await unstable_cache(
      async () =>
        resolveNbaWindowProfileSummary(adminDb, uid, {
          board: windowBoard,
          window: wantWeekly ? "weekly" : "monthly",
          label: windowLabel,
        }),
      [
        "profile-window-stats",
        uid,
        windowBoard,
        wantWeekly ? "weekly" : "monthly",
        windowLabel,
      ],
      {
        revalidate: PROFILE_WINDOW_STATS_CACHE_REVALIDATE_SEC,
      }
    )();
    windowResolvedLabel = windowed.label;
    monthlyResolvedLabel =
      windowed.window === "monthly" ? windowed.label : null;
    monthlySummaryRanks = windowed.summaryRanks;
    if (wantPhase) {
      summary = windowed.summary;
      metricValueDeltas = null;
    }
  } else if (wantPhase) {
    const deltaOpts = {
      wcStage: null,
      rankingLeague,
    };
    const priorMetrics = await loadPriorSnapshotMetrics(uid, deltaOpts);

    summary = await resolveNbaProfileSummaryLive(
      adminDb,
      uid,
      cumulative as Record<string, unknown> | null,
      priorMetrics,
      nbaScope ?? undefined
    );

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
              0,
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
  if (wantWindow && monthlySummaryRanks) {
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
      cumulative as Record<string, unknown> | null | undefined
    );
  }

  const body: Record<string, unknown> = {
    ok: true,
    resolvedUid: uid,
    parts: [...parts],
    rankingLeague,
    wcStage: null,
    period: wantWeekly
      ? "weekly"
      : wantMonthly
        ? "monthly"
        : nbaScope === "playoffs"
          ? "playoffs"
          : "season",
    board: wantWindow ? windowBoard : nbaScope ?? "season",
    monthLabel: monthlyResolvedLabel,
    weekLabel: wantWeekly ? windowResolvedLabel : null,
    windowLabel: windowResolvedLabel,
  };

  if (wantStats) body.stats = stats;
  if (summary) body.summary = summary;
  if (metricValueDeltas) body.metricValueDeltas = metricValueDeltas;
  if (summaryRanks) body.summaryRanks = summaryRanks;
  if (wantTrend) body.dailyTrend = dailyTrend;
  if (wantRankTrend) {
    body.rankTrend = rankTrendFromCharts ?? rankTrendPoints;
  }

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
