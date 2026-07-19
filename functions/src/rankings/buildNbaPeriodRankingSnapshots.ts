// functions/src/rankings/buildNbaPeriodRankingSnapshots.ts
// user_stats_v2_daily から NBA Weekly / Monthly ランキングを日次で確定 doc 化する。
// doc: period_ranking_snapshots/nba_{period}_{label}_{metric}
// 期間が終わると更新されなくなり、そのまま過去ランキングのアーカイブになる。

import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { CURRENT_NBA_SEASON_KEY } from "./nbaSeason";
import {
  dateKeyJST,
  monthLabelJST,
  periodMinPosts,
  periodWinRateMinPosts,
  previousLabel,
  rangeForLabel,
  weekStartDateKeyJST,
  PERIOD_FINALIZE_GRACE_DAYS,
  type NbaPeriodRange,
  type NbaRankingPeriod,
} from "./nbaPeriod";

function db() {
  return getFirestore();
}

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

export type PeriodMetric =
  | "totalPoints"
  | "winRate"
  | "totalUpset"
  | "totalGoalScorerHits";

const PERIOD_METRICS: PeriodMetric[] = [
  "totalPoints",
  "winRate",
  "totalUpset",
  "totalGoalScorerHits",
];

const TOP_ROWS = 50;

type SnapshotRow = {
  uid: string;
  displayName: string;
  handle: string | null;
  photoURL: string | null;
  countryCode: string | null;
  plan: string | null;
  totalPosts: number;
  totalWins: number;
  totalPoints: number;
  totalUpset: number;
  totalGoalScorerHits: number;
  totalPrecision: number;
  activeWinStreak: number;
  winRate: number;
  rank: number;
};

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
  if (seasonInc && typeof seasonInc === "object") return seasonInc;
  const leagues = data.leagues as { nba?: DailyInc } | undefined;
  if (leagues?.nba && typeof leagues.nba === "object") return leagues.nba;
  return null;
}

function uidFromDailyDocId(docId: string, dateKey: string): string | null {
  const suffix = `_${dateKey}`;
  if (docId.endsWith(suffix)) return docId.slice(0, -suffix.length);
  const i = docId.lastIndexOf("_");
  if (i <= 0) return null;
  return docId.slice(0, i);
}

function metricValue(
  row: Omit<SnapshotRow, "rank">,
  metric: PeriodMetric
): number {
  if (metric === "winRate") return row.winRate;
  if (metric === "totalUpset") return row.totalUpset;
  if (metric === "totalGoalScorerHits") return row.totalGoalScorerHits;
  return row.totalPoints;
}

export function periodSnapshotDocId(
  period: NbaRankingPeriod,
  label: string,
  metric: PeriodMetric
): string {
  return `nba_${period}_${label}_${metric}`;
}

async function buildOne(range: NbaPeriodRange): Promise<void> {
  const firestore = db();
  const minPosts = periodMinPosts(range.period);
  const winRateMin = periodWinRateMinPosts(range.period);

  const statsSnap = await firestore
    .collection("user_stats_v2_daily")
    .where("date", ">=", range.startKey)
    .where("date", "<=", range.endKey)
    .get();

  const aggByUid = new Map<string, Agg>();
  for (const doc of statsSnap.docs) {
    const data = doc.data() as Record<string, unknown>;
    const dateKey = String(data.date ?? "");
    const uid = uidFromDailyDocId(doc.id, dateKey);
    if (!uid) continue;
    const inc = pickNbaInc(data);
    if (!inc) continue;
    if (!aggByUid.has(uid)) aggByUid.set(uid, emptyAgg());
    addInc(aggByUid.get(uid)!, inc);
  }

  const uids = [...aggByUid.keys()].filter(
    (uid) => (aggByUid.get(uid)?.posts ?? 0) >= minPosts
  );

  // 表示用プロフィール（cumulative_stats に集約済み）
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
  const CHUNK = 80;
  for (let i = 0; i < uids.length; i += CHUNK) {
    const slice = uids.slice(i, i + CHUNK);
    const refs = slice.map((uid) =>
      firestore.collection("cumulative_stats").doc(uid)
    );
    const snaps = await firestore.getAll(...refs);
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

  const baseRows: Array<Omit<SnapshotRow, "rank">> = uids.map((uid) => {
    const agg = aggByUid.get(uid)!;
    const profile = profileByUid.get(uid);
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
      winRate: agg.posts > 0 ? agg.wins / agg.posts : 0,
    };
  });

  const batch = firestore.batch();
  for (const metric of PERIOD_METRICS) {
    const eligible =
      metric === "winRate"
        ? baseRows.filter((r) => r.totalPosts >= winRateMin)
        : baseRows;
    const sorted = [...eligible].sort((a, b) => {
      const diff = metricValue(b, metric) - metricValue(a, metric);
      if (diff !== 0) return diff;
      if (metric === "winRate") {
        const postsDiff = b.totalPosts - a.totalPosts;
        if (postsDiff !== 0) return postsDiff;
      }
      return b.totalPoints - a.totalPoints;
    });

    // 同値は同順位
    const ranks: Record<string, number> = {};
    let lastVal: number | null = null;
    let lastRank = 0;
    const rankedRows: SnapshotRow[] = [];
    sorted.forEach((row, i) => {
      const v = metricValue(row, metric);
      const rank = lastVal != null && v === lastVal ? lastRank : i + 1;
      lastVal = v;
      lastRank = rank;
      ranks[row.uid] = rank;
      if (rankedRows.length < TOP_ROWS) rankedRows.push({ ...row, rank });
    });

    const ref = firestore
      .collection("period_ranking_snapshots")
      .doc(periodSnapshotDocId(range.period, range.labelKey, metric));
    batch.set(ref, {
      league: "nba",
      period: range.period,
      periodKey: `nba_${range.period}`,
      label: range.labelKey,
      metric,
      range: { startKey: range.startKey, endKey: range.endKey },
      count: sorted.length,
      rows: rankedRows,
      ranks,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
  await batch.commit();

  console.log(
    `[buildNbaPeriodRankingSnapshots] ${range.period} ${range.labelKey} rows=${baseRows.length}`
  );
}

/**
 * 現在の週・月のスナップショットを再構築する。
 * 期間開始直後（猶予日数内）は前期間も再集計して遅延精算を反映する。
 */
export async function buildNbaPeriodRankingSnapshots(
  now: Date = new Date()
): Promise<void> {
  const todayKey = dateKeyJST(now);
  const targets: NbaPeriodRange[] = [];

  const weekLabel = weekStartDateKeyJST(now);
  targets.push(rangeForLabel("weekly", weekLabel, now));
  if (todayKey <= addGrace(weekLabel)) {
    targets.push(rangeForLabel("weekly", previousLabel("weekly", weekLabel), now));
  }

  const monthLabel = monthLabelJST(now);
  targets.push(rangeForLabel("monthly", monthLabel, now));
  if (todayKey <= addGrace(`${monthLabel}-01`)) {
    targets.push(
      rangeForLabel("monthly", previousLabel("monthly", monthLabel), now)
    );
  }

  for (const range of targets) {
    try {
      await buildOne(range);
    } catch (err) {
      console.error(
        `[buildNbaPeriodRankingSnapshots] failed ${range.period} ${range.labelKey}`,
        err
      );
    }
  }
}

/** 期間開始日 + 猶予日数の dateKey */
function addGrace(periodStartKey: string): string {
  const [y, m, d] = periodStartKey.split("-").map(Number);
  const base = new Date(Date.UTC(y, m - 1, d + PERIOD_FINALIZE_GRACE_DAYS));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${base.getUTCFullYear()}-${pad(base.getUTCMonth() + 1)}-${pad(
    base.getUTCDate()
  )}`;
}
