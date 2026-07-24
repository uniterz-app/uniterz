/**
 * period_ranking_snapshots（Functions cron が日次生成）から
 * NBA Weekly / Monthly ランキングを読む。
 * 過去期間の doc は更新されず、そのままアーカイブとして参照できる。
 */

import { getAdminDb } from "@/lib/firebaseAdmin";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import type { RankingApiRow } from "@/lib/rankings/rankingTransform";
import {
  enumerateDateKeysInclusive,
  resolveRankingPeriodRangeForLabel,
  type RankingPeriod,
} from "@/lib/rankings/rankingPeriod";
import type {
  PeriodBulkMetricPayload,
  PeriodMetricKey,
} from "@/lib/rankings/server/buildNbaPeriodRankingFromDaily";

const PERIOD_METRICS: PeriodMetricKey[] = [
  "totalPoints",
  "winRate",
  "totalUpset",
  "totalGoalScorerHits",
];

type SnapshotDoc = {
  label?: string;
  range?: { startKey?: string; endKey?: string };
  count?: number;
  rows?: Array<RankingApiRow & { rank: number }>;
  ranks?: Record<string, number>;
  /** 前日スナップショットの順位マップ。期間初日は null */
  prevRanks?: Record<string, number> | null;
};

export type PeriodSnapshotBulk = {
  ok: true;
  period: Exclude<RankingPeriod, "season">;
  label: string;
  range: { startKey: string; endKey: string; labelKey: string };
  byMetric: Record<PeriodMetricKey, PeriodBulkMetricPayload>;
};

/** 選択可能な期間ラベル一覧（新しい順） */
export async function listNbaPeriodLabels(
  period: Exclude<RankingPeriod, "season">,
  limit = 26
): Promise<string[]> {
  const db = getAdminDb();
  const snap = await db
    .collection("period_ranking_snapshots")
    .where("periodKey", "==", `nba_${period}`)
    .where("metric", "==", "totalPoints")
    .select("label")
    .get();
  const labels = snap.docs
    .map((d) => String(d.data()?.label ?? ""))
    .filter(Boolean);
  labels.sort((a, b) => (a < b ? 1 : -1));
  return labels.slice(0, limit);
}

/**
 * スナップショット doc からランキングを組み立てる。
 * doc が1つも無ければ null（呼び出し側でライブ集計にフォールバック）。
 */
export async function readNbaPeriodRankingSnapshots(opts: {
  period: Exclude<RankingPeriod, "season">;
  label: string;
  uid?: string | null;
}): Promise<PeriodSnapshotBulk | null> {
  const db = getAdminDb();
  const refs = PERIOD_METRICS.map((metric) =>
    db
      .collection("period_ranking_snapshots")
      .doc(`nba_${opts.period}_${opts.label}_${metric}`)
  );
  const snaps = await db.getAll(...refs);
  if (snaps.every((s) => !s.exists)) return null;

  const myUid = opts.uid ?? null;
  const myRow = myUid
    ? await buildMyPeriodRow(myUid, opts.period, opts.label)
    : null;

  const byMetric = {} as Record<PeriodMetricKey, PeriodBulkMetricPayload>;
  let range = resolveRankingPeriodRangeForLabel(opts.period, opts.label);

  snaps.forEach((snap, i) => {
    const metric = PERIOD_METRICS[i];
    const data = (snap.exists ? snap.data() : null) as SnapshotDoc | null;
    const rows = Array.isArray(data?.rows) ? data!.rows! : [];
    const ranks = data?.ranks ?? {};
    if (data?.range?.startKey && data.range.endKey) {
      range = {
        ...range,
        startKey: data.range.startKey,
        endKey: data.range.endKey,
      };
    }
    const myRank = myUid ? ranks[myUid] ?? null : null;
    const myInTop = myUid ? rows.find((r) => r.uid === myUid) ?? null : null;
    // 前日比の順位変動。期間リセット直後（prevRanks なし）や新規参加者は null
    const myPrevRank = myUid ? data?.prevRanks?.[myUid] : undefined;
    const myRankDeltaPlaces =
      myRank != null &&
      typeof myPrevRank === "number" &&
      Number.isFinite(myPrevRank)
        ? myPrevRank - myRank
        : null;
    byMetric[metric] = {
      ok: true,
      rows,
      count: Number(data?.count ?? rows.length),
      myRank,
      // ライブ集計と同じく、参加条件を満たす（= ranks に載る）人だけ myRow を返す
      myRow:
        myInTop ??
        (myRow && myRank != null
          ? { ...myRow, rank: myRank, rankDeltaPlaces: myRankDeltaPlaces }
          : null),
      myRankDeltaPlaces,
    };
  });

  return {
    ok: true,
    period: opts.period,
    label: opts.label,
    range: {
      startKey: range.startKey,
      endKey: range.endKey,
      labelKey: opts.label,
    },
    byMetric,
  };
}

type DailyInc = {
  posts?: number;
  wins?: number;
  pointsSumV3?: number;
  upsetPointsSum?: number;
  goalScorerHitCount?: number;
};

/**
 * 自分の期間集計をつくる（top50 圏外でも自分のスタッツを表示するため）。
 * 自分の daily doc は ID 直指定で読めるので最大でも月の日数分の読み取りで済む。
 */
async function buildMyPeriodRow(
  uid: string,
  period: Exclude<RankingPeriod, "season">,
  label: string
): Promise<RankingApiRow | null> {
  const db = getAdminDb();
  const range = resolveRankingPeriodRangeForLabel(period, label);
  const dateKeys = enumerateDateKeysInclusive(range.startKey, range.endKey);
  if (dateKeys.length === 0) return null;

  const refs = dateKeys.map((key) =>
    db.collection("user_stats_v2_daily").doc(`${uid}_${key}`)
  );
  const snaps = await db.getAll(...refs);

  let posts = 0;
  let wins = 0;
  let totalPoints = 0;
  let totalUpset = 0;
  let totalGoalScorerHits = 0;

  for (const snap of snaps) {
    if (!snap.exists) continue;
    const data = snap.data() as Record<string, unknown>;
    const bySeason = data.rankingBySeason as
      | Record<string, DailyInc>
      | undefined;
    const inc =
      bySeason?.[CURRENT_NBA_SEASON_KEY] ??
      (data.leagues as { nba?: DailyInc } | undefined)?.nba ??
      null;
    if (!inc || typeof inc !== "object") continue;
    posts += Number(inc.posts ?? 0) || 0;
    wins += Number(inc.wins ?? 0) || 0;
    totalPoints += Number(inc.pointsSumV3 ?? 0) || 0;
    totalUpset += Number(inc.upsetPointsSum ?? 0) || 0;
    totalGoalScorerHits += Number(inc.goalScorerHitCount ?? 0) || 0;
  }

  if (posts <= 0) return null;

  return {
    uid,
    displayName: "user",
    handle: null,
    photoURL: null,
    countryCode: null,
    plan: null,
    totalPosts: posts,
    totalWins: wins,
    totalPoints,
    totalUpset,
    totalGoalScorerHits,
    totalPrecision: 0,
    activeWinStreak: 0,
    winRate: posts > 0 ? wins / posts : 0,
  } as RankingApiRow;
}
