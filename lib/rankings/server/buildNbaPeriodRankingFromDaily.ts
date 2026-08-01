/**
 * user_stats_v2_daily から NBA Weekly / Monthly ランキングを組み立てる。
 */

import { getAdminDb } from "@/lib/firebaseAdmin";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import type { RankingDivision } from "@/lib/rankings/rankingDivision";
import type { RankingApiRow } from "@/lib/rankings/rankingTransform";
import {
  periodMinPosts,
  periodWinRateMinPosts,
  resolveRankingPeriodRange,
  type RankingPeriod,
} from "@/lib/rankings/rankingPeriod";
import { mergeUserPlansIntoBulkByMetric } from "@/lib/rankings/mergeUserPlanIntoRankingPayload";

type DailyInc = {
  posts?: number;
  wins?: number;
  pointsSumV3?: number;
  upsetPointsSum?: number;
  goalScorerHitCount?: number;
};

type Agg = {
  posts: number;
  wins: number;
  totalPoints: number;
  totalUpset: number;
  totalGoalScorerHits: number;
};

export type PeriodMetricKey =
  | "totalPoints"
  | "winRate"
  | "totalUpset"
  | "totalGoalScorerHits";

const PERIOD_METRICS: PeriodMetricKey[] = [
  "totalPoints",
  "winRate",
  "totalUpset",
  "totalGoalScorerHits",
];

function emptyAgg(): Agg {
  return {
    posts: 0,
    wins: 0,
    totalPoints: 0,
    totalUpset: 0,
    totalGoalScorerHits: 0,
  };
}

function addInc(agg: Agg, inc: DailyInc | null | undefined) {
  if (!inc || typeof inc !== "object") return;
  agg.posts += Number(inc.posts ?? 0) || 0;
  agg.wins += Number(inc.wins ?? 0) || 0;
  agg.totalPoints += Number(inc.pointsSumV3 ?? 0) || 0;
  agg.totalUpset += Number(inc.upsetPointsSum ?? 0) || 0;
  agg.totalGoalScorerHits += Number(inc.goalScorerHitCount ?? 0) || 0;
}

/** シーズンスライス（rankingBySeason.<key>）優先、なければ leagues.nba */
function pickNbaInc(data: Record<string, unknown>): DailyInc | null {
  const bySeason = data.rankingBySeason as
    | Record<string, DailyInc>
    | undefined;
  const seasonInc = bySeason?.[CURRENT_NBA_SEASON_KEY];
  if (seasonInc && typeof seasonInc === "object") {
    return seasonInc;
  }
  const leagues = data.leagues as { nba?: DailyInc } | undefined;
  if (leagues?.nba && typeof leagues.nba === "object") {
    return leagues.nba;
  }
  return null;
}

function uidFromDailyDocId(docId: string, dateKey: string): string | null {
  const suffix = `_${dateKey}`;
  if (docId.endsWith(suffix)) return docId.slice(0, -suffix.length);
  const i = docId.lastIndexOf("_");
  if (i <= 0) return null;
  return docId.slice(0, i);
}

function metricValue(row: RankingApiRow, metric: PeriodMetricKey): number {
  if (metric === "winRate") {
    const posts = row.totalPosts ?? 0;
    const wins = row.totalWins ?? 0;
    return posts > 0 ? wins / posts : 0;
  }
  if (metric === "totalUpset") return row.totalUpset ?? 0;
  if (metric === "totalGoalScorerHits") return row.totalGoalScorerHits ?? 0;
  return row.totalPoints ?? 0;
}

function sortRows(
  rows: RankingApiRow[],
  metric: PeriodMetricKey,
  winRateMin: number
): RankingApiRow[] {
  const eligible =
    metric === "winRate"
      ? rows.filter((r) => (r.totalPosts ?? 0) >= winRateMin)
      : rows;
  return [...eligible].sort((a, b) => {
    const diff = metricValue(b, metric) - metricValue(a, metric);
    if (diff !== 0) return diff;
    if (metric === "winRate") {
      const postsDiff = (b.totalPosts ?? 0) - (a.totalPosts ?? 0);
      if (postsDiff !== 0) return postsDiff;
    }
    return (b.totalPoints ?? 0) - (a.totalPoints ?? 0);
  });
}

function assignRanks(
  sorted: RankingApiRow[],
  metric: PeriodMetricKey
): Array<RankingApiRow & { rank: number }> {
  let lastVal: number | null = null;
  let lastRank = 0;
  return sorted.map((row, i) => {
    const v = metricValue(row, metric);
    const rank = lastVal != null && v === lastVal ? lastRank : i + 1;
    lastVal = v;
    lastRank = rank;
    return { ...row, rank };
  });
}

export type PeriodBulkMetricPayload = {
  ok: boolean;
  rows: Array<RankingApiRow & { rank: number }>;
  count: number;
  myRank: number | null;
  myRow: (RankingApiRow & { rank: number }) | null;
  /** 前日スナップショット比。ライブ集計フォールバック時は null */
  myRankDeltaPlaces: number | null;
};

export async function buildNbaPeriodRankingBulk(opts: {
  period: Exclude<RankingPeriod, "season">;
  uid?: string | null;
  now?: Date;
  division?: RankingDivision;
}): Promise<{
  ok: true;
  period: Exclude<RankingPeriod, "season">;
  division: RankingDivision;
  range: { startKey: string; endKey: string; labelKey: string };
  byMetric: Record<PeriodMetricKey, PeriodBulkMetricPayload>;
}> {
  const division = opts.division ?? "standard";
  const range = resolveRankingPeriodRange(opts.period, opts.now ?? new Date());
  const minPosts = periodMinPosts(opts.period);
  const winRateMin = periodWinRateMinPosts(opts.period);
  const db = getAdminDb();

  const statsSnap = await db
    .collection("user_stats_v2_daily")
    .where("date", ">=", range.startKey)
    .where("date", "<=", range.endKey)
    .get();

  const map = new Map<string, Agg>();

  for (const doc of statsSnap.docs) {
    const data = doc.data() as Record<string, unknown>;
    const dateKey = String(data.date ?? "");
    const uid = uidFromDailyDocId(doc.id, dateKey);
    if (!uid) continue;
    const inc = pickNbaInc(data);
    if (!inc) continue;
    if (!map.has(uid)) map.set(uid, emptyAgg());
    addInc(map.get(uid)!, inc);
  }

  const uids = [...map.keys()].filter(
    (uid) => (map.get(uid)?.posts ?? 0) >= minPosts
  );

  const profileByUid = new Map<
    string,
    {
      displayName: string;
      handle: string | null;
      photoURL: string | null;
      countryCode: string | null;
      plan: string | null;
    }
  >();

  // chunk getAll for cumulative_stats (has display fields) + users fallback
  const CHUNK = 80;
  for (let i = 0; i < uids.length; i += CHUNK) {
    const slice = uids.slice(i, i + CHUNK);
    const refs = slice.map((uid) => db.collection("cumulative_stats").doc(uid));
    const snaps = await db.getAll(...refs);
    for (const snap of snaps) {
      if (!snap.exists) continue;
      const d = snap.data() ?? {};
      profileByUid.set(snap.id, {
        displayName: String(d.displayName ?? "user"),
        handle: (d.handle as string | null | undefined) ?? null,
        photoURL: (d.photoURL as string | null | undefined) ?? null,
        countryCode: (d.countryCode as string | null | undefined) ?? null,
        plan: (d.plan as string | null | undefined) ?? null,
      });
    }
  }

  let baseRows: RankingApiRow[] = uids.map((uid) => {
    const agg = map.get(uid)!;
    const profile = profileByUid.get(uid);
    const winRate = agg.posts > 0 ? agg.wins / agg.posts : 0;
    return {
      uid,
      displayName: profile?.displayName ?? "user",
      handle: profile?.handle ?? null,
      photoURL: profile?.photoURL ?? null,
      countryCode: profile?.countryCode ?? null,
      plan: profile?.plan ?? null,
      totalPosts: agg.posts,
      totalWins: agg.wins,
      totalPoints: agg.totalPoints,
      totalUpset: agg.totalUpset,
      totalGoalScorerHits: agg.totalGoalScorerHits,
      totalPrecision: 0,
      activeWinStreak: 0,
      winRate,
    } as RankingApiRow & { winRate: number };
  });

  // plan を users から最新化してから無差別級フィルタ
  const planProbe = {
    _probe: {
      rows: baseRows as unknown[],
      myRow: null as unknown,
    },
  };
  await mergeUserPlansIntoBulkByMetric(planProbe);
  baseRows = (planProbe._probe.rows as RankingApiRow[]) ?? baseRows;
  if (division === "open") {
    baseRows = baseRows.filter((r) => r.plan === "pro");
  }

  const byMetric = {} as Record<PeriodMetricKey, PeriodBulkMetricPayload>;

  for (const metric of PERIOD_METRICS) {
    const sorted = sortRows(baseRows, metric, winRateMin);
    const ranked = assignRanks(sorted, metric).slice(0, 50);
    const fullRanks = assignRanks(sorted, metric);
    const myUid = opts.uid ?? null;
    const myFull = myUid
      ? fullRanks.find((r) => r.uid === myUid) ?? null
      : null;
    const myInTop = myUid
      ? ranked.find((r) => r.uid === myUid) ?? null
      : null;

    byMetric[metric] = {
      ok: true,
      rows: ranked,
      count: sorted.length,
      myRank: myFull?.rank ?? null,
      myRow: myFull ?? myInTop,
      myRankDeltaPlaces: null,
    };
  }

  await mergeUserPlansIntoBulkByMetric(byMetric);

  return {
    ok: true,
    period: opts.period,
    division,
    range: {
      startKey: range.startKey,
      endKey: range.endKey,
      labelKey: range.labelKey,
    },
    byMetric,
  };
}
