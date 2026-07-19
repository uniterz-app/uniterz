export const runtime = "nodejs";

import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";
import { CUMULATIVE_RANKING_REVALIDATE_SEC } from "@/lib/rankings/cumulativeRankingCache";
import {
  currentRankingPeriodLabel,
  isRankingPeriod,
  isValidPeriodLabel,
  type RankingPeriod,
} from "@/lib/rankings/rankingPeriod";
import { buildNbaPeriodRankingBulk } from "@/lib/rankings/server/buildNbaPeriodRankingFromDaily";
import {
  listNbaPeriodLabels,
  readNbaPeriodRankingSnapshots,
} from "@/lib/rankings/server/readNbaPeriodRankingSnapshots";
import { mergeUserPlansIntoBulkByMetric } from "@/lib/rankings/mergeUserPlanIntoRankingPayload";
import { getAdminAuth } from "@/lib/firebaseAdmin";

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

async function loadPayload(period: PeriodOnly, label: string, uid: string | null) {
  const snapshot = await readNbaPeriodRankingSnapshots({ period, label, uid });
  if (snapshot) {
    await mergeUserPlansIntoBulkByMetric(snapshot.byMetric);
    return snapshot;
  }
  // cron 未実行（当日/移行期）はライブ集計にフォールバック。過去ラベルは空を返す
  const currentLabel = currentRankingPeriodLabel(period);
  if (label !== currentLabel) return null;
  return buildNbaPeriodRankingBulk({ period, uid });
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

    const currentLabel = currentRankingPeriodLabel(period);
    const labelRaw = url.searchParams.get("label");
    const label =
      labelRaw && isValidPeriodLabel(period, labelRaw) && labelRaw <= currentLabel
        ? labelRaw
        : currentLabel;

    const uid = await optionalUid(req);

    const labelsPromise: Promise<string[]> = unstable_cache(
      async (): Promise<string[]> =>
        listNbaPeriodLabels(period).catch(() => [] as string[]),
      [`nba-period-ranking-labels-${period}`],
      { revalidate: CUMULATIVE_RANKING_REVALIDATE_SEC }
    )();

    // ログイン時は myRank 付き。匿名は unstable_cache。
    const payload = uid
      ? await loadPayload(period, label, uid)
      : await unstable_cache(
          async () => loadPayload(period, label, null),
          [`nba-period-ranking-${period}-${label}-anon`],
          { revalidate: CUMULATIVE_RANKING_REVALIDATE_SEC }
        )();

    const availableLabels = await labelsPromise;
    if (!availableLabels.includes(currentLabel)) {
      availableLabels.unshift(currentLabel);
    }

    if (!payload) {
      return NextResponse.json({
        ok: true,
        period,
        label,
        range: null,
        byMetric: {},
        availableLabels,
      });
    }

    return NextResponse.json({ ...payload, label, availableLabels });
  } catch (e: unknown) {
    const err = e as { message?: string };
    return NextResponse.json(
      { ok: false, error: err?.message ?? "period ranking failed" },
      { status: 500 }
    );
  }
}
