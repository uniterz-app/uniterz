export const runtime = "nodejs";

import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";
import { CUMULATIVE_RANKING_REVALIDATE_SEC } from "@/lib/rankings/cumulativeRankingCache";
import {
  isRankingPeriod,
  isValidPeriodLabel,
  previousRankingPeriodLabel,
  type RankingPeriod,
} from "@/lib/rankings/rankingPeriod";
import {
  parseRankingDivision,
  type RankingDivision,
} from "@/lib/rankings/rankingDivision";
import {
  listNbaPeriodLabels,
  readNbaPeriodRankingSnapshots,
} from "@/lib/rankings/server/readNbaPeriodRankingSnapshots";
import { resolveDisplayedRankingPeriodLabel } from "@/lib/rankings/server/resolveDisplayedRankingPeriodLabel";
import { assertProUser } from "@/lib/rankings/server/fetchRankGapAnalysis";
import { getAdminAuth } from "@/lib/firebaseAdmin";
import { mergeUserPlansIntoBulkByMetric } from "@/lib/rankings/mergeUserPlanIntoRankingPayload";
import { RANKING_COMMENT_CDN_TAG_HEADER } from "@/lib/rankings/rankingCommentCache";
import { loadRankingSnapshotGenerationKey } from "@/lib/rankings/server/loadRankingSnapshotGeneration";

function periodPayloadHasRows(
  payload: Awaited<ReturnType<typeof loadSharedPayload>>
): boolean {
  if (!payload?.byMetric) return false;
  return Object.values(payload.byMetric).some(
    (m) => Array.isArray(m?.rows) && m.rows.length > 0
  );
}

async function optionalUid(req: Request): Promise<string | null> {
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

type PeriodOnly = Exclude<RankingPeriod, "season">;

/**
 * 一覧は全員共通。uid は付けない（My Rank は personalOnly 経路）。
 */
async function loadSharedPayload(
  period: PeriodOnly,
  label: string,
  division: RankingDivision
) {
  const snapshot = await readNbaPeriodRankingSnapshots({
    period,
    label,
    uid: null,
    division,
  });
  if (snapshot) return snapshot;
  console.warn(
    `[period-ranking/bulk] missing period snapshot; skip live daily fallback`,
    { period, label, division }
  );
  return null;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const periodRaw = url.searchParams.get("period");
    if (!isRankingPeriod(periodRaw) || periodRaw === "season") {
      return NextResponse.json(
        { ok: false, error: "period must be weekly or monthly" },
        { status: 400 }
      );
    }
    const period = periodRaw as PeriodOnly;
    const division = parseRankingDivision(url.searchParams.get("division"));
    const personalOnly =
      url.searchParams.get("personalOnly") === "1" ||
      url.searchParams.get("personalOnly") === "true";

    const uid = await optionalUid(req);

    if (division === "open") {
      if (!uid) {
        return NextResponse.json(
          { ok: false, error: "pro_required" },
          { status: 403 }
        );
      }
      const isPro = await assertProUser(uid);
      if (!isPro) {
        return NextResponse.json(
          { ok: false, error: "pro_required" },
          { status: 403 }
        );
      }
    }

    /** 新期間の初試合日が全部終わるまで前期間を「いま」にする（Unit 付与はカレンダーのまま） */
    const currentLabel = await unstable_cache(
      () => resolveDisplayedRankingPeriodLabel(period),
      [`nba-period-ranking-display-label-${period}`],
      {
        revalidate: 60,
        tags: ["period-ranking", "games-window:nba"],
      }
    )();
    const labelRaw = url.searchParams.get("label");
    let label =
      labelRaw && isValidPeriodLabel(period, labelRaw) && labelRaw <= currentLabel
        ? labelRaw
        : currentLabel;

    /**
     * My Rank overlay — 一覧の共有キャッシュは汚さない。
     * top50 外でも ranks + 自分の daily から myRank / myRow を返す。
     */
    if (personalOnly) {
      if (!uid) {
        return NextResponse.json(
          { ok: false, error: "unauthorized" },
          { status: 401 }
        );
      }
      const snapshot = await readNbaPeriodRankingSnapshots({
        period,
        label,
        uid,
        division,
      });
      if (!snapshot) {
        return NextResponse.json(
          {
            ok: true,
            period,
            label,
            division,
            personalOnly: true,
            range: null,
            byMetric: {},
          },
          {
            headers: {
              "Cache-Control": "private, max-age=0, must-revalidate",
            },
          }
        );
      }
      const byMetric: Record<string, unknown> = {};
      for (const [metric, payload] of Object.entries(snapshot.byMetric)) {
        byMetric[metric] = {
          ok: payload.ok,
          rows: [],
          count: payload.count,
          myRank: payload.myRank,
          myRow: payload.myRow,
          myRankDeltaPlaces: payload.myRankDeltaPlaces,
        };
      }
      await mergeUserPlansIntoBulkByMetric(
        byMetric as Record<string, { rows?: unknown[]; myRow?: unknown | null }>,
        { includeRankingComment: true }
      );
      return NextResponse.json(
        {
          ok: true,
          period: snapshot.period,
          label,
          division,
          personalOnly: true,
          range: snapshot.range,
          byMetric,
        },
        {
          headers: {
            "Cache-Control": "private, max-age=60, must-revalidate",
          },
        }
      );
    }

    const labelsPromise: Promise<string[]> = unstable_cache(
      async (): Promise<string[]> =>
        listNbaPeriodLabels(period, 26, division).catch(() => [] as string[]),
      [`nba-period-ranking-labels-${period}-${division}`],
      {
        revalidate: CUMULATIVE_RANKING_REVALIDATE_SEC,
        tags: ["period-ranking", "cumulative-ranking"],
      }
    )();

    const snapshotGeneration = await loadRankingSnapshotGenerationKey();

    const loadCachedPayload = (periodLabel: string) =>
      unstable_cache(
        async () => loadSharedPayload(period, periodLabel, division),
        [
          `nba-period-ranking-shared-v3-${period}-${periodLabel}-${division}`,
          snapshotGeneration,
        ],
        {
          revalidate: CUMULATIVE_RANKING_REVALIDATE_SEC,
          tags: ["period-ranking", "cumulative-ranking"],
        }
      )();

    let payload = await loadCachedPayload(label);
    /** 新期間スナップ未作成・空のときは前期間へ（NO DATA 回避） */
    if (!periodPayloadHasRows(payload) && label === currentLabel) {
      const prev = previousRankingPeriodLabel(period, label);
      if (prev && prev < label) {
        const prevPayload = await loadCachedPayload(prev);
        if (periodPayloadHasRows(prevPayload)) {
          payload = prevPayload;
          label = prev;
        }
      }
    }

    const availableLabels = (await labelsPromise).filter(
      (l) => l <= currentLabel
    );
    if (!availableLabels.includes(currentLabel)) {
      availableLabels.unshift(currentLabel);
    }
    if (label !== currentLabel && !availableLabels.includes(label)) {
      availableLabels.unshift(label);
    }

    const cacheControl =
      division === "open"
        ? `private, max-age=60, stale-while-revalidate=${CUMULATIVE_RANKING_REVALIDATE_SEC}`
        : `public, max-age=0, s-maxage=${CUMULATIVE_RANKING_REVALIDATE_SEC}, stale-while-revalidate=${CUMULATIVE_RANKING_REVALIDATE_SEC * 4}`;

    if (!payload) {
      return NextResponse.json(
        {
          ok: true,
          period,
          label,
          division,
          range: null,
          byMetric: {},
          availableLabels,
          snapshotGeneration,
        },
        { headers: { "Cache-Control": cacheControl } }
      );
    }

    const body =
      typeof structuredClone === "function"
        ? structuredClone(payload)
        : (JSON.parse(JSON.stringify(payload)) as typeof payload);
    if (body.byMetric && typeof body.byMetric === "object") {
      await mergeUserPlansIntoBulkByMetric(
        body.byMetric as Record<
          string,
          { rows?: unknown[]; myRow?: unknown | null }
        >,
        { includeRankingComment: true }
      );
    }

    return NextResponse.json(
      { ...body, label, division, availableLabels, snapshotGeneration },
      {
        headers: {
          "Cache-Control": cacheControl,
          ...RANKING_COMMENT_CDN_TAG_HEADER,
        },
      }
    );
  } catch (e: unknown) {
    console.error("[api/period-ranking/bulk]", e);
    return NextResponse.json(
      { ok: false, error: "internal" },
      { status: 500 }
    );
  }
}
