// app/api/cumulative-ranking/bulk/route.ts
// 指標をまとめて取得（metrics 省略時は全5指標）。サーバー側 unstable_cache で Function 負荷を抑制。

import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";
import { CUMULATIVE_RANKING_REVALIDATE_SEC } from "@/lib/rankings/cumulativeRankingCache";
import {
  fetchBulkFromFunctions,
  type BulkRankingMetric,
} from "@/lib/rankings/server/fetchCumulativeRankingBulk";
import { mergePersonalIntoBulkByMetric } from "@/lib/rankings/server/mergePersonalBulkOverlay";
import { loadPersonalBulkOverlayFromFirestore } from "@/lib/rankings/server/loadPersonalBulkOverlay";
import { loadMyRankMetricValueDeltas } from "@/lib/rankings/server/loadMyRankMetricValueDeltas";
import type { MyRankMetricValueDeltas } from "@/lib/rankings/myRankMetricValueDeltas";
import {
  isRankingLeagueSource,
  type RankingLeagueSource,
} from "@/lib/rankings/rankingLeagueSource";
import {
  isWcRankingStage,
  type WcRankingStage,
} from "@/lib/rankings/wcRankingStage";
import { loadRankingSnapshotGenerationKey } from "@/lib/rankings/server/loadRankingSnapshotGeneration";
import { mergeUserPlansIntoBulkByMetric } from "@/lib/rankings/mergeUserPlanIntoRankingPayload";
import { parseRankingDivision } from "@/lib/rankings/rankingDivision";
import { assertProUser } from "@/lib/rankings/server/fetchRankGapAnalysis";
import {
  buildNbaOpenSeasonRankingFromCumulative,
  readNbaOpenSeasonRankingSnapshots,
} from "@/lib/rankings/server/readNbaOpenSeasonRanking";
import { getAdminAuth } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

const BULK_METRICS = [
  "totalPoints",
  "totalUpset",
  "winRate",
  "totalGoalScorerHits",
] as const satisfies readonly BulkRankingMetric[];

const WC_BULK_METRICS = [
  "totalPoints",
  "totalExactHits",
  "totalUpset",
  "activeWinStreak",
  "winRate",
  "totalGoalScorerHits",
] as const satisfies readonly BulkRankingMetric[];

const METRIC_SET = new Set<string>([
  ...BULK_METRICS,
  "totalGoalScorerHits",
  "totalExactHits",
]);

function dateKeyJST(now: Date = new Date()): string {
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const y = jst.getUTCFullYear();
  const m = String(jst.getUTCMonth() + 1).padStart(2, "0");
  const d = String(jst.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseMetricsParam(
  raw: string | null,
  wcStage: WcRankingStage | null
): BulkRankingMetric[] {
  const defaults = wcStage ? [...WC_BULK_METRICS] : [...BULK_METRICS];
  if (!raw?.trim()) return defaults;
  const parts = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const picked: BulkRankingMetric[] = [];
  for (const p of parts) {
    if (METRIC_SET.has(p)) picked.push(p as BulkRankingMetric);
  }
  if (picked.length === 0) return defaults;
  return [...new Set(picked)].sort() as BulkRankingMetric[];
}

function metricsToKey(metrics: BulkRankingMetric[]): string {
  return [...new Set(metrics)].sort().join(",");
}

function wcStageCacheKey(wc: WcRankingStage | null): string {
  return wc ?? "__no_wc__";
}

async function uidFromBearer(req: Request): Promise<string | null> {
  const authz =
    req.headers.get("authorization") || req.headers.get("Authorization");
  const token = authz?.startsWith("Bearer ") ? authz.slice(7) : null;
  if (!token) return null;
  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    return decoded.uid;
  } catch {
    return null;
  }
}

const getCachedBulk = unstable_cache(
  async (
    uidKey: string,
    metricsKey: string,
    wcStageKey: string,
    snapshotGenerationKey: string
  ) => {
    const uid = uidKey === "__anon__" ? undefined : uidKey;
    const parts = metricsKey
      .split(",")
      .filter((m): m is BulkRankingMetric => METRIC_SET.has(m));
    const defaults =
      wcStageKey !== "__no_wc__" ? [...WC_BULK_METRICS] : [...BULK_METRICS];
    const metrics = (parts.length ? parts : defaults) as BulkRankingMetric[];
    const wcStage: WcRankingStage | null =
      wcStageKey === "__no_wc__"
        ? null
        : isWcRankingStage(wcStageKey)
          ? wcStageKey
          : null;
    void snapshotGenerationKey;
    return fetchBulkFromFunctions(uid, metrics, wcStage);
  },
  ["cumulative-ranking-bulk-v14"],
  {
    revalidate: CUMULATIVE_RANKING_REVALIDATE_SEC,
    tags: ["cumulative-ranking"],
  }
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const uidParam = searchParams.get("uid") ?? undefined;
    const division = parseRankingDivision(searchParams.get("division"));
    const personalOnly =
      searchParams.get("personalOnly") === "1" ||
      searchParams.get("personalOnly") === "true";
    const rawWcStage = searchParams.get("wcStage");
    const wcStage: WcRankingStage | null = isWcRankingStage(rawWcStage)
      ? rawWcStage
      : null;
    const metricsList = parseMetricsParam(searchParams.get("metrics"), wcStage);
    const metricsKey = metricsToKey(metricsList);
    const snapshotGeneration =
      (await loadRankingSnapshotGenerationKey(wcStage)) ??
      `fallback:${dateKeyJST()}`;

    /** 無差別級シーズン（Pro 限定・NBA のみ） */
    if (division === "open") {
      if (wcStage) {
        return NextResponse.json(
          { ok: false, error: "open division is NBA only" },
          { status: 400 }
        );
      }
      const bearerUid = await uidFromBearer(req);
      const uid = bearerUid ?? uidParam;
      if (!uid) {
        return NextResponse.json(
          { ok: false, error: "pro_required" },
          { status: 403 }
        );
      }
      // Bearer があるときは必ずその uid を使い、クエリ改ざんを防ぐ
      const gatedUid = bearerUid ?? uid;
      if (!(await assertProUser(gatedUid))) {
        return NextResponse.json(
          { ok: false, error: "pro_required" },
          { status: 403 }
        );
      }

      const metricNames = metricsList.map(String);
      const snapshot = await readNbaOpenSeasonRankingSnapshots({
        uid: gatedUid,
        metrics: metricNames,
      });
      const payload =
        snapshot ??
        (await buildNbaOpenSeasonRankingFromCumulative({
          uid: gatedUid,
          metrics: metricNames,
        }));

      return NextResponse.json(
        {
          ok: true,
          division: "open",
          wcStage: null,
          snapshotGeneration,
          byMetric: payload.byMetric,
          myMetricValueDeltas: null,
        },
        {
          status: 200,
          headers: {
            "Cache-Control": "private, max-age=0, must-revalidate",
          },
        }
      );
    }

    const uid = uidParam;

    /** YOUR RANK 用 — Firestore snapshotRanks のみ（Functions / 一覧キャッシュ不要） */
    if (personalOnly) {
      if (!uid) {
        return NextResponse.json(
          { ok: false, error: "uid required for personalOnly" },
          { status: 400 }
        );
      }
      const personal = await loadPersonalBulkOverlayFromFirestore(
        uid,
        metricsList,
        wcStage
      );
      await mergeUserPlansIntoBulkByMetric(personal);
      return NextResponse.json(
        {
          ok: true,
          wcStage,
          snapshotGeneration,
          byMetric: personal,
          myMetricValueDeltas: null,
        },
        {
          status: 200,
          headers: {
            "Cache-Control": "private, max-age=0, must-revalidate",
          },
        }
      );
    }

    const baseUrl =
      process.env.CUMULATIVE_RANKING_FUNCTION_URL ??
      process.env.NEXT_PUBLIC_CUMULATIVE_RANKING_FUNCTION_URL;

    if (!baseUrl) {
      return NextResponse.json(
        { ok: false, error: "CUMULATIVE_RANKING_FUNCTION_URL is not set" },
        { status: 500 }
      );
    }

    /**
     * 一覧は anon キャッシュ（スナップショットそのまま）。
     * uid 付きは一覧を再利用し、Functions の myRank / myRow のみ上書き。
     */
    const listSource = await getCachedBulk(
      "__anon__",
      metricsKey,
      wcStageCacheKey(wcStage),
      snapshotGeneration
    );

    const data =
      typeof structuredClone === "function"
        ? structuredClone(listSource)
        : (JSON.parse(JSON.stringify(listSource)) as typeof listSource);

    // plan / country / Pro Skin を users から上書き（スナップショット古さ・スキン変更に追従）
    await mergeUserPlansIntoBulkByMetric(data.byMetric);

    if (uid) {
      const personal = await loadPersonalBulkOverlayFromFirestore(
        uid,
        metricsList,
        wcStage
      );
      mergePersonalIntoBulkByMetric(
        data.byMetric,
        personal,
        metricsList,
        uid
      );
    }

    let myMetricValueDeltas: MyRankMetricValueDeltas | null = null;

    if (uid && data.byMetric?.totalPoints?.myRow) {
      myMetricValueDeltas = await loadMyRankMetricValueDeltas(
        uid,
        data.byMetric.totalPoints.myRow as {
          totalPoints?: number;
          totalPrecision?: number;
          totalUpset?: number;
          winRate?: number;
        },
        {
          wcStage,
          rankingLeague: isRankingLeagueSource(searchParams.get("league"))
            ? (searchParams.get("league") as RankingLeagueSource)
            : wcStage
              ? "worldcup"
              : "nba",
        }
      ).catch(() => null);
    }

    const cacheControl = uid
      ? `private, max-age=60, stale-while-revalidate=${CUMULATIVE_RANKING_REVALIDATE_SEC}`
      : `public, max-age=0, s-maxage=${CUMULATIVE_RANKING_REVALIDATE_SEC}, stale-while-revalidate=${CUMULATIVE_RANKING_REVALIDATE_SEC * 4}`;

    return NextResponse.json(
      {
        ...data,
        division: "standard",
        wcStage,
        snapshotGeneration,
        myMetricValueDeltas,
      },
      {
        status: 200,
        headers: { "Cache-Control": cacheControl },
      }
    );
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "unexpected error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
