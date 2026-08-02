// app/api/cumulative-ranking/bulk/route.ts
// 指標をまとめて取得（metrics 省略時は全5指標）。サーバー側 unstable_cache で Function 負荷を抑制。

import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";
import { CUMULATIVE_RANKING_REVALIDATE_SEC } from "@/lib/rankings/cumulativeRankingCache";
import {
  fetchBulkFromFunctions,
  type BulkRankingMetric,
} from "@/lib/rankings/server/fetchCumulativeRankingBulk";
import { loadPersonalBulkOverlayFromFirestore } from "@/lib/rankings/server/loadPersonalBulkOverlay";
import { loadRankingSnapshotGenerationKey } from "@/lib/rankings/server/loadRankingSnapshotGeneration";
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

function parseMetricsParam(raw: string | null): BulkRankingMetric[] {
  const defaults = [...BULK_METRICS];
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
    snapshotGenerationKey: string
  ) => {
    const uid = uidKey === "__anon__" ? undefined : uidKey;
    const parts = metricsKey
      .split(",")
      .filter((m): m is BulkRankingMetric => METRIC_SET.has(m));
    const metrics = (parts.length ? parts : [...BULK_METRICS]) as BulkRankingMetric[];
    void snapshotGenerationKey;
    return fetchBulkFromFunctions(uid, metrics);
  },
  ["cumulative-ranking-bulk-v16-nba"],
  {
    revalidate: CUMULATIVE_RANKING_REVALIDATE_SEC,
    tags: ["cumulative-ranking"],
  }
);

const getCachedOpenSeasonBulk = unstable_cache(
  async (metricsKey: string, snapshotGenerationKey: string) => {
    void snapshotGenerationKey;
    const parts = metricsKey
      .split(",")
      .filter((m): m is BulkRankingMetric => METRIC_SET.has(m));
    const metrics = (parts.length ? parts : [...BULK_METRICS]).map(String);
    const snapshot = await readNbaOpenSeasonRankingSnapshots({
      uid: null,
      metrics,
    });
    return (
      snapshot ??
      (await buildNbaOpenSeasonRankingFromCumulative({
        uid: null,
        metrics,
      }))
    );
  },
  ["cumulative-ranking-open-season-v1"],
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
    const metricsList = parseMetricsParam(searchParams.get("metrics"));
    const metricsKey = metricsToKey(metricsList);
    const snapshotGeneration =
      (await loadRankingSnapshotGenerationKey()) ??
      `fallback:${dateKeyJST()}`;

    /** 無差別級シーズン（Pro 限定・NBA のみ） */
    if (division === "open") {
      const bearerUid = await uidFromBearer(req);
      const uid = bearerUid ?? uidParam;
      if (!uid) {
        return NextResponse.json(
          { ok: false, error: "pro_required" },
          { status: 403 }
        );
      }
      const gatedUid = bearerUid ?? uid;
      if (!(await assertProUser(gatedUid))) {
        return NextResponse.json(
          { ok: false, error: "pro_required" },
          { status: 403 }
        );
      }

      void gatedUid;
      const payload = await getCachedOpenSeasonBulk(
        metricsKey,
        snapshotGeneration
      );

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
            "Cache-Control": `private, max-age=60, stale-while-revalidate=${CUMULATIVE_RANKING_REVALIDATE_SEC}`,
          },
        }
      );
    }

    const uid = uidParam;

    if (personalOnly) {
      if (!uid) {
        return NextResponse.json(
          { ok: false, error: "uid required for personalOnly" },
          { status: 400 }
        );
      }
      const personal = await loadPersonalBulkOverlayFromFirestore(
        uid,
        metricsList
      );
      return NextResponse.json(
        {
          ok: true,
          wcStage: null,
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

    void uid;
    const listSource = await getCachedBulk(
      "__anon__",
      metricsKey,
      snapshotGeneration
    );

    const data =
      typeof structuredClone === "function"
        ? structuredClone(listSource)
        : (JSON.parse(JSON.stringify(listSource)) as typeof listSource);

    const cacheControl = `public, max-age=0, s-maxage=${CUMULATIVE_RANKING_REVALIDATE_SEC}, stale-while-revalidate=${CUMULATIVE_RANKING_REVALIDATE_SEC * 4}`;

    return NextResponse.json(
      {
        ...data,
        division: "standard",
        wcStage: null,
        snapshotGeneration,
        myMetricValueDeltas: null,
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
