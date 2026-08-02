import { getAdminDb } from "@/lib/firebaseAdmin";
import { resolveCumulativeRankingSnapshotDocId } from "@/lib/rankings/cumulativeRankingSnapshotId";
import type { RankingLeagueSource } from "@/lib/rankings/rankingLeagueSource";
import {
  computeRankGapAnalysis,
  resolveRankGapCohortSize,
  type RankGapAnalysis,
} from "@/lib/rankings/rankGapAnalysis";
import { readRankGapCohortBandFromSnapshot } from "@/lib/rankings/rankGapCohortSnapshot";
import {
  readRankGapStatsSlice,
  type RankGapStatsSlice,
} from "@/lib/rankings/readRankGapBonusSlice";
import { resolveNextRankTierMilestone } from "@/lib/rankings/rankTierMilestone";
import { fetchBulkFromFunctions } from "@/lib/rankings/server/fetchCumulativeRankingBulk";
import type { Language } from "@/lib/i18n/language";

type RankingRowLite = {
  uid?: string;
  rank?: number;
  totalPoints?: number;
};

function safeInt(v: unknown): number | null {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.floor(n);
}

async function loadCumulativeDocs(
  uids: string[]
): Promise<Map<string, Record<string, unknown>>> {
  const db = getAdminDb();
  const out = new Map<string, Record<string, unknown>>();
  const unique = [...new Set(uids.filter(Boolean))];
  const CHUNK = 100;
  for (let i = 0; i < unique.length; i += CHUNK) {
    const chunk = unique.slice(i, i + CHUNK);
    const refs = chunk.map((uid) => db.doc(`cumulative_stats/${uid}`));
    const snaps = await db.getAll(...refs);
    for (const snap of snaps) {
      if (!snap.exists) continue;
      const uid = snap.id;
      out.set(uid, snap.data() as Record<string, unknown>);
    }
  }
  return out;
}

function cohortUidsFromRows(
  rows: RankingRowLite[],
  cohortSize: number
): string[] {
  const picked: Array<{ uid: string; rank: number }> = [];
  for (const row of rows) {
    const rank = safeInt(row.rank);
    const uid = typeof row.uid === "string" ? row.uid.trim() : "";
    if (!uid || rank == null || rank < 1 || rank > cohortSize) continue;
    picked.push({ uid, rank });
  }
  picked.sort((a, b) => a.rank - b.rank);
  return picked.map((p) => p.uid);
}

function cohortSlicesFromSnapshotBand(
  band: NonNullable<ReturnType<typeof readRankGapCohortBandFromSnapshot>>,
  cohortSize: number
): RankGapStatsSlice[] {
  return band.slices.slice(0, Math.min(cohortSize, band.slices.length));
}

async function loadCohortSlicesLive(input: {
  uid: string;
  cohortUids: string[];
}): Promise<RankGapStatsSlice[]> {
  const cumulativeByUid = await loadCumulativeDocs([
    input.uid,
    ...input.cohortUids,
  ]);
  const cohortSlices: RankGapStatsSlice[] = [];
  for (const cohortUid of input.cohortUids) {
    const slice = readRankGapStatsSlice(cumulativeByUid.get(cohortUid));
    if (slice && slice.posts > 0) cohortSlices.push(slice);
  }
  return cohortSlices;
}

export async function fetchRankGapAnalysis(input: {
  uid: string;
  rankingLeague: RankingLeagueSource;
  language: Language;
}): Promise<RankGapAnalysis | { ok: false; reason: string }> {
  const baseUrl =
    process.env.CUMULATIVE_RANKING_FUNCTION_URL ??
    process.env.NEXT_PUBLIC_CUMULATIVE_RANKING_FUNCTION_URL;
  if (!baseUrl) {
    return { ok: false, reason: "ranking_unavailable" };
  }

  const bulk = await fetchBulkFromFunctions(input.uid, ["totalPoints"]);
  const bundle = bulk.byMetric.totalPoints;
  if (!bundle?.ok) {
    return { ok: false, reason: "ranking_unavailable" };
  }

  const myRank = safeInt(bundle.myRank);
  if (myRank == null || myRank < 1) {
    return { ok: false, reason: "rank_unavailable" };
  }

  const targetTier = resolveNextRankTierMilestone(myRank);
  const cohortSize = resolveRankGapCohortSize(targetTier ?? 10);

  const rows = (bundle.rows ?? []) as RankingRowLite[];
  const cohortUids = cohortUidsFromRows(rows, cohortSize);
  if (cohortUids.length === 0) {
    return { ok: false, reason: "cohort_empty" };
  }

  const selfDocSnap = await getAdminDb()
    .doc(`cumulative_stats/${input.uid}`)
    .get();
  const selfSlice = readRankGapStatsSlice(
    selfDocSnap.exists
      ? (selfDocSnap.data() as Record<string, unknown>)
      : undefined
  );
  if (!selfSlice || selfSlice.posts <= 0) {
    return { ok: false, reason: "self_stats_unavailable" };
  }

  const snapshotDocId = resolveCumulativeRankingSnapshotDocId({
    metric: "totalPoints",
  });
  const rankingSnap = await getAdminDb()
    .doc(`cumulative_ranking_snapshots/${snapshotDocId}`)
    .get();
  const gapBand = readRankGapCohortBandFromSnapshot(
    rankingSnap.exists
      ? (rankingSnap.data() as Record<string, unknown>)
      : undefined
  );

  let cohortSlices: RankGapStatsSlice[];
  if (gapBand && gapBand.slices.length >= Math.min(cohortSize, cohortUids.length)) {
    cohortSlices = cohortSlicesFromSnapshotBand(gapBand, cohortSize);
  } else {
    cohortSlices = await loadCohortSlicesLive({
      uid: input.uid,
      cohortUids,
    });
  }

  if (cohortSlices.length === 0) {
    return { ok: false, reason: "cohort_empty" };
  }

  return computeRankGapAnalysis({
    currentRank: myRank,
    self: selfSlice,
    cohortSlices,
    rankingLeague: input.rankingLeague,
    cutoffRows: rows,
    language: input.language,
  });
}

/** users.plan === "pro" かつ proUntil 未超過なら true */
export async function assertProUser(uid: string): Promise<boolean> {
  const snap = await getAdminDb().doc(`users/${uid}`).get();
  if (!snap.exists) return false;
  const data = snap.data() ?? {};
  if (data.plan !== "pro") return false;
  const until = data.proUntil as
    | { toMillis?: () => number; seconds?: number }
    | Date
    | null
    | undefined;
  if (!until) return true;
  let ms = 0;
  if (until instanceof Date) {
    ms = until.getTime();
  } else if (typeof until.toMillis === "function") {
    ms = until.toMillis();
  } else if (typeof until.seconds === "number") {
    ms = until.seconds * 1000;
  }
  if (!Number.isFinite(ms) || ms <= 0) return true;
  return ms > Date.now();
}
