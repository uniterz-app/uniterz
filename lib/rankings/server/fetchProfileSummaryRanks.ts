import { getAdminDb } from "@/lib/firebaseAdmin";
import { coerceTotalPointsRank } from "@/lib/profile/resolvePlayoffTotalPointsRank";
import {
  CURRENT_NBA_SEASON_KEY,
  nbaSeasonSnapshotDocId,
} from "@/lib/rankings/nbaSeason";
import { loadRankSnapshotHistoryDocsWalkBack } from "@/lib/rankings/server/loadRankSnapshotHistoryDocs";
import { readStoredRankFromSnapshotRanks } from "@/lib/rankings/server/readSnapshotRanksFromCumulative";

export type ProfileSummaryRanks = {
  totalPrecision: number | null;
  totalUpset: number | null;
  totalPoints: number | null;
  /** 総合得点順位の母数（Kinetik ティア / セグメントバー用） */
  totalPointsDenominator: number | null;
  /** 前日比順位変動（+で上昇） */
  rankDeltaPlaces: number | null;
};

const EMPTY_RANKS: ProfileSummaryRanks = {
  totalPrecision: null,
  totalUpset: null,
  totalPoints: null,
  totalPointsDenominator: null,
  rankDeltaPlaces: null,
};

const RANK_METRICS = ["totalPoints", "totalPrecision", "totalUpset"] as const;
type RankMetric = (typeof RANK_METRICS)[number];

type HistoryDoc = {
  seasons?: Partial<Record<string, Partial<Record<RankMetric, unknown>>>>;
};

function safeDenominator(v: unknown): number | null {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return null;
  const i = Math.floor(n);
  return i > 0 ? i : null;
}

function safeRankDelta(v: unknown): number | null {
  if (typeof v !== "number" || !Number.isFinite(v) || v === 0) return null;
  return Math.trunc(v);
}

function resolveParticipantCount(
  totalCount: number | null,
  myRank: number | null
): number | null {
  if (totalCount == null) {
    return myRank != null && myRank > 0 ? myRank : null;
  }
  if (myRank != null && myRank > totalCount) return myRank;
  return totalCount;
}

function rankingSnapshotDocId(metric: RankMetric): string {
  return nbaSeasonSnapshotDocId(CURRENT_NBA_SEASON_KEY, metric);
}

function readStoredRank(
  cumulative: Record<string, unknown> | null | undefined,
  metric: RankMetric
): number | null {
  return readStoredRankFromSnapshotRanks(cumulative, metric);
}

function readHistoryMetricBlock(
  data: HistoryDoc | undefined
): Partial<Record<RankMetric, unknown>> | undefined {
  if (!data) return undefined;
  return data.seasons?.[CURRENT_NBA_SEASON_KEY];
}

async function loadHistoryRanks(uid: string): Promise<{
  ranks: Partial<Record<RankMetric, number | null>>;
  totalPointsDelta: number | null;
}> {
  const sorted = await loadRankSnapshotHistoryDocsWalkBack(uid, { maxDocs: 2 });
  if (sorted.length === 0) {
    return { ranks: {}, totalPointsDelta: null };
  }

  const latest = sorted[sorted.length - 1];
  const prev = sorted.length >= 2 ? sorted[sorted.length - 2] : null;
  if (!latest) return { ranks: {}, totalPointsDelta: null };

  const latestBlock = readHistoryMetricBlock(latest.data as HistoryDoc);
  const prevBlock = readHistoryMetricBlock(prev?.data as HistoryDoc | undefined);

  const ranks: Partial<Record<RankMetric, number | null>> = {};
  for (const metric of RANK_METRICS) {
    ranks[metric] = coerceTotalPointsRank(latestBlock?.[metric]);
  }

  const latestTotalPoints = ranks.totalPoints ?? null;
  const prevTotalPoints = coerceTotalPointsRank(prevBlock?.totalPoints);
  const totalPointsDelta =
    latestTotalPoints != null &&
    prevTotalPoints != null &&
    prevTotalPoints !== latestTotalPoints
      ? prevTotalPoints - latestTotalPoints
      : null;

  return { ranks, totalPointsDelta };
}

async function loadSnapshotTotalCount(
  metric: RankMetric
): Promise<number | null> {
  const docId = rankingSnapshotDocId(metric);
  const snap = await getAdminDb()
    .collection("cumulative_ranking_snapshots")
    .doc(docId)
    .get();
  if (!snap.exists) return null;
  return safeDenominator(snap.data()?.totalCount);
}

function resolveMetricRank(
  metric: RankMetric,
  storedRank: number | null,
  historyRank: number | null | undefined
): number | null {
  return historyRank ?? storedRank;
}

/**
 * Profile Overview ranks — Firestore snapshot only (no Cloud Functions).
 * Uses cumulative_stats.snapshotRanks, cumulative_ranking_snapshots.totalCount,
 * and rankSnapshotHistory for totalPoints delta.
 */
export async function fetchProfileSummaryRanks(
  uid: string,
  cumulativeData?: Record<string, unknown> | null
): Promise<ProfileSummaryRanks> {
  try {
    let cumulative = cumulativeData;
    if (cumulative === undefined) {
      const snap = await getAdminDb().collection("cumulative_stats").doc(uid).get();
      cumulative = snap.exists ? (snap.data() as Record<string, unknown>) : null;
    }

    const [history, totalPointsDenominatorRaw] = await Promise.all([
      loadHistoryRanks(uid),
      loadSnapshotTotalCount("totalPoints"),
    ]);

    const storedRanks = Object.fromEntries(
      RANK_METRICS.map((metric) => [
        metric,
        readStoredRank(cumulative, metric),
      ])
    ) as Record<RankMetric, number | null>;

    const totalPoints = resolveMetricRank(
      "totalPoints",
      storedRanks.totalPoints,
      history.ranks.totalPoints
    );
    const totalPrecision = resolveMetricRank(
      "totalPrecision",
      storedRanks.totalPrecision,
      history.ranks.totalPrecision
    );
    const totalUpset = resolveMetricRank(
      "totalUpset",
      storedRanks.totalUpset,
      history.ranks.totalUpset
    );

    const totalPointsDenominator = resolveParticipantCount(
      totalPointsDenominatorRaw,
      totalPoints
    );

    return {
      totalPoints,
      totalPrecision,
      totalUpset,
      totalPointsDenominator,
      rankDeltaPlaces: safeRankDelta(history.totalPointsDelta),
    };
  } catch {
    return EMPTY_RANKS;
  }
}
