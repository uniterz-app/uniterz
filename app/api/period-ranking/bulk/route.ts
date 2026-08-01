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
import {
  parseRankingDivision,
  type RankingDivision,
} from "@/lib/rankings/rankingDivision";
import { buildNbaPeriodRankingBulk } from "@/lib/rankings/server/buildNbaPeriodRankingFromDaily";
import {
  listNbaPeriodLabels,
  readNbaPeriodRankingSnapshots,
} from "@/lib/rankings/server/readNbaPeriodRankingSnapshots";
import { mergeUserPlansIntoBulkByMetric } from "@/lib/rankings/mergeUserPlanIntoRankingPayload";
import { assertProUser } from "@/lib/rankings/server/fetchRankGapAnalysis";
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

async function loadPayload(
  period: PeriodOnly,
  label: string,
  uid: string | null,
  division: RankingDivision
) {
  const snapshot = await readNbaPeriodRankingSnapshots({
    period,
    label,
    uid,
    division,
  });
  if (snapshot) {
    await mergeUserPlansIntoBulkByMetric(snapshot.byMetric);
    return snapshot;
  }
  // cron 未実行（当日/移行期）はライブ集計にフォールバック。過去ラベルは空を返す
  const currentLabel = currentRankingPeriodLabel(period);
  if (label !== currentLabel) return null;
  return buildNbaPeriodRankingBulk({ period, uid, division });
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

    const currentLabel = currentRankingPeriodLabel(period);
    const labelRaw = url.searchParams.get("label");
    const label =
      labelRaw && isValidPeriodLabel(period, labelRaw) && labelRaw <= currentLabel
        ? labelRaw
        : currentLabel;

    const labelsPromise: Promise<string[]> = unstable_cache(
      async (): Promise<string[]> =>
        listNbaPeriodLabels(period, 26, division).catch(() => [] as string[]),
      [`nba-period-ranking-labels-${period}-${division}`],
      { revalidate: CUMULATIVE_RANKING_REVALIDATE_SEC }
    )();

    // 無差別級は Pro 限定のためキャッシュしない。通常はログイン時 myRank 付き / 匿名は cache
    const payload =
      division === "open" || uid
        ? await loadPayload(period, label, uid, division)
        : await unstable_cache(
            async () => loadPayload(period, label, null, division),
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
        division,
        range: null,
        byMetric: {},
        availableLabels,
      });
    }

    return NextResponse.json({ ...payload, label, division, availableLabels });
  } catch (e: unknown) {
    const err = e as { message?: string };
    return NextResponse.json(
      { ok: false, error: err?.message ?? "period ranking failed" },
      { status: 500 }
    );
  }
}
