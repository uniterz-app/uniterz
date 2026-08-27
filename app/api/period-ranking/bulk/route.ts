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
import {
  listNbaPeriodLabels,
  readNbaPeriodRankingSnapshots,
} from "@/lib/rankings/server/readNbaPeriodRankingSnapshots";
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

    const currentLabel = currentRankingPeriodLabel(period);
    const labelRaw = url.searchParams.get("label");
    const label =
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
      { revalidate: CUMULATIVE_RANKING_REVALIDATE_SEC }
    )();

    const payload = await unstable_cache(
      async () => loadSharedPayload(period, label, division),
      [`nba-period-ranking-shared-v2-${period}-${label}-${division}`],
      { revalidate: CUMULATIVE_RANKING_REVALIDATE_SEC }
    )();

    const availableLabels = await labelsPromise;
    if (!availableLabels.includes(currentLabel)) {
      availableLabels.unshift(currentLabel);
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
        },
        { headers: { "Cache-Control": cacheControl } }
      );
    }

    return NextResponse.json(
      { ...payload, label, division, availableLabels },
      { headers: { "Cache-Control": cacheControl } }
    );
  } catch (e: unknown) {
    console.error("[api/period-ranking/bulk]", e);
    return NextResponse.json(
      { ok: false, error: "internal" },
      { status: 500 }
    );
  }
}
