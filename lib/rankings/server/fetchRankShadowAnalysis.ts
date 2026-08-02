import { getAdminDb } from "@/lib/firebaseAdmin";
import type { RankingLeagueSource } from "@/lib/rankings/rankingLeagueSource";
import {
  readTotalPointsRankFromHistoryDoc,
  readTotalPointsRankFromSnapshotRanks,
  type RankHistoryContext,
} from "@/lib/rankings/readRankFromSnapshotHistory";
import {
  readRankShadowAnchorMetrics,
  type RankShadowAnchorMetrics,
} from "@/lib/rankings/readRankShadowAnchorMetrics";
import {
  readRankGapStatsSlice,
  type RankGapStatsSlice,
} from "@/lib/rankings/readRankGapBonusSlice";
import {
  computeRankShadowAnalysis,
  SHADOW_RANK_PROGRESS_DAYS,
  type RankShadowAnalysis,
} from "@/lib/rankings/rankShadowAnalysis";
import {
  isRankInShadowBand,
  resolveShadowBandRange,
} from "@/lib/rankings/rankShadowBand";
import {
  resolveShadowBandAnchorDateKey,
  resolveShadowMetricAnchorDateKey,
  resolveShadowWeekStartDateKey,
} from "@/lib/rankings/rankShadowWeek";
import { RANK_SNAPSHOT_HISTORY_SUBCOL } from "@/lib/rankings/rankingPhase";
import {
  dateKeyJST,
  subtractOneDayFromDateKeyJST,
} from "@/lib/rankings/rankSnapshotDate";
import { fetchBulkFromFunctions } from "@/lib/rankings/server/fetchCumulativeRankingBulk";
import { loadRankSnapshotHistoryDocsWalkBack } from "@/lib/rankings/server/loadRankSnapshotHistoryDocs";
import {
  buildRankShadowCacheId,
  buildRankShadowContextKey,
  readRankShadowCache,
  writeRankShadowCache,
} from "@/lib/rankings/server/rankShadowCache";
import type { MyRankProgressPoint } from "@/lib/rankings/myRankRankingProgress";
import type { WcRankingStage } from "@/lib/rankings/wcRankingStage";
import type { Language } from "@/lib/i18n/language";

function safeInt(v: unknown): number | null {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.floor(n);
}

type RankingRowLite = {
  uid?: string;
  rank?: number;
};

const SHADOW_COHORT_RANK_MARGIN = 25;

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
      out.set(snap.id, snap.data() as Record<string, unknown>);
    }
  }
  return out;
}

async function loadHistoryDocOnOrBeforeDateKey(
  uid: string,
  targetDateKey: string,
  context: RankHistoryContext,
  maxLookbackDays = 10
): Promise<{
  dateKey: string;
  priorRank: number;
  anchorDoc: Record<string, unknown>;
} | null> {
  const db = getAdminDb();
  let key = targetDateKey;
  for (let i = 0; i <= maxLookbackDays; i++) {
    const snap = await db
      .collection("cumulative_stats")
      .doc(uid)
      .collection(RANK_SNAPSHOT_HISTORY_SUBCOL)
      .doc(key)
      .get();
    if (snap.exists) {
      const data = snap.data() as Record<string, unknown>;
      const priorRank = readTotalPointsRankFromHistoryDoc(data, context);
      if (priorRank != null) {
        return { dateKey: key, priorRank, anchorDoc: data };
      }
    }
    key = subtractOneDayFromDateKeyJST(key);
  }
  return null;
}

async function loadShadowRankProgressPoints(
  uid: string,
  context: RankHistoryContext
): Promise<MyRankProgressPoint[]> {
  const history = await loadRankSnapshotHistoryDocsWalkBack(uid, {
    maxDocs: SHADOW_RANK_PROGRESS_DAYS,
    maxLookbackDays: SHADOW_RANK_PROGRESS_DAYS + 4,
  });

  const points: MyRankProgressPoint[] = [];
  for (const doc of history) {
    const rank = readTotalPointsRankFromHistoryDoc(doc.data, context);
    if (rank == null || rank < 1) continue;
    points.push({ dateKey: doc.id, rank });
  }
  return points.slice(-SHADOW_RANK_PROGRESS_DAYS);
}

async function loadShadowCohortUids(
  bandAnchorDateKey: string,
  band: { low: number; high: number },
  context: RankHistoryContext & { rankingLeague: RankingLeagueSource },
  rankingRows: RankingRowLite[]
): Promise<Array<{ uid: string; priorRank: number }>> {
  const db = getAdminDb();
  const candidateLow = Math.max(1, band.low - SHADOW_COHORT_RANK_MARGIN);
  const candidateHigh = band.high + SHADOW_COHORT_RANK_MARGIN;
  const candidateUids = new Set<string>();

  for (const row of rankingRows) {
    const rank = safeInt(row.rank);
    const uid = typeof row.uid === "string" ? row.uid.trim() : "";
    if (!uid || rank == null || rank < candidateLow || rank > candidateHigh) {
      continue;
    }
    candidateUids.add(uid);
  }

  const out: Array<{ uid: string; priorRank: number }> = [];
  const unique = [...candidateUids];
  const CHUNK = 100;
  for (let i = 0; i < unique.length; i += CHUNK) {
    const chunk = unique.slice(i, i + CHUNK);
    const refs = chunk.map((uid) =>
      db
        .collection("cumulative_stats")
        .doc(uid)
        .collection(RANK_SNAPSHOT_HISTORY_SUBCOL)
        .doc(bandAnchorDateKey)
    );
    const snaps = await db.getAll(...refs);
    for (const snap of snaps) {
      if (!snap.exists) continue;
      const uid = snap.ref.parent.parent?.id;
      if (!uid) continue;
      const data = snap.data() as Record<string, unknown>;
      const priorRank = readTotalPointsRankFromHistoryDoc(data, context);
      if (priorRank == null || !isRankInShadowBand(priorRank, band)) continue;
      out.push({ uid, priorRank });
    }
  }
  return out;
}

type HistoryAnchorHit = {
  priorRank: number;
  anchorMetrics: RankShadowAnchorMetrics | null;
};

async function loadHistoryAnchorsForUids(
  uids: string[],
  targetDateKey: string,
  context: RankHistoryContext & { rankingLeague: RankingLeagueSource }
): Promise<Map<string, HistoryAnchorHit | null>> {
  const out = new Map<string, HistoryAnchorHit | null>();
  const unique = [...new Set(uids.filter(Boolean))];
  await Promise.all(
    unique.map(async (uid) => {
      const hit = await loadHistoryDocOnOrBeforeDateKey(
        uid,
        targetDateKey,
        context,
        7
      );
      out.set(
        uid,
        hit
          ? {
              priorRank: hit.priorRank,
              anchorMetrics: readRankShadowAnchorMetrics(
                hit.anchorDoc,
                context
              ),
            }
          : null
      );
    })
  );
  return out;
}

async function loadUserProfiles(
  uids: string[]
): Promise<Map<string, { displayName: string; photoURL: string | null }>> {
  const db = getAdminDb();
  const out = new Map<string, { displayName: string; photoURL: string | null }>();
  const unique = [...new Set(uids.filter(Boolean))];
  const CHUNK = 100;
  for (let i = 0; i < unique.length; i += CHUNK) {
    const chunk = unique.slice(i, i + CHUNK);
    const refs = chunk.map((uid) => db.collection("users").doc(uid));
    const snaps = await db.getAll(...refs);
    for (const snap of snaps) {
      if (!snap.exists) continue;
      const d = snap.data() as { displayName?: string; photoURL?: string };
      out.set(snap.id, {
        displayName: d.displayName?.trim() || snap.id.slice(0, 8),
        photoURL: d.photoURL ?? null,
      });
    }
  }
  return out;
}

async function computeRankShadowAnalysisLive(input: {
  uid: string;
  rankingLeague: RankingLeagueSource;
  language: Language;
}): Promise<RankShadowAnalysis | { ok: false; reason: string }> {
  const baseUrl =
    process.env.CUMULATIVE_RANKING_FUNCTION_URL ??
    process.env.NEXT_PUBLIC_CUMULATIVE_RANKING_FUNCTION_URL;
  if (!baseUrl) {
    return { ok: false, reason: "ranking_unavailable" };
  }

  const context: RankHistoryContext & { rankingLeague: RankingLeagueSource } = {
    rankingLeague: input.rankingLeague,
  };

  const weekStartDateKey = resolveShadowWeekStartDateKey();
  const bandAnchorDateKey = resolveShadowBandAnchorDateKey();
  const metricAnchorDateKey = resolveShadowMetricAnchorDateKey();

  const bulk = await fetchBulkFromFunctions(input.uid, ["totalPoints"]);
  const bundle = bulk.byMetric.totalPoints;
  if (!bundle?.ok) {
    return { ok: false, reason: "ranking_unavailable" };
  }

  const currentRank = safeInt(bundle.myRank);
  if (currentRank == null || currentRank < 1) {
    return { ok: false, reason: "rank_unavailable" };
  }

  const [bandAnchor, weekStartAnchor, rankProgressPoints] = await Promise.all([
    loadHistoryDocOnOrBeforeDateKey(input.uid, bandAnchorDateKey, context),
    loadHistoryDocOnOrBeforeDateKey(input.uid, metricAnchorDateKey, context),
    loadShadowRankProgressPoints(input.uid, context),
  ]);

  if (!bandAnchor || !weekStartAnchor) {
    return { ok: false, reason: "shadow_history_unavailable" };
  }

  const priorBand = resolveShadowBandRange(bandAnchor.priorRank);
  const rankingRows = (bundle.rows ?? []) as RankingRowLite[];
  let cohort = await loadShadowCohortUids(
    bandAnchorDateKey,
    priorBand,
    context,
    rankingRows
  );

  if (cohort.length === 0) {
    cohort = [{ uid: input.uid, priorRank: bandAnchor.priorRank }];
  }

  const cohortUids = [input.uid, ...cohort.map((c) => c.uid)];
  const [cumulativeByUid, historyAnchorsByUid, profileByUid] =
    await Promise.all([
      loadCumulativeDocs(cohortUids),
      loadHistoryAnchorsForUids(cohortUids, metricAnchorDateKey, context),
      loadUserProfiles(cohortUids),
    ]);

  const selfSlice = readRankGapStatsSlice(cumulativeByUid.get(input.uid));
  if (!selfSlice || selfSlice.posts <= 0) {
    return { ok: false, reason: "self_stats_unavailable" };
  }

  const selfWeekStartRank =
    historyAnchorsByUid.get(input.uid)?.priorRank ??
    weekStartAnchor.priorRank;

  const cohortMembers: Array<{
    uid: string;
    priorRank: number;
    weekStartRank: number;
    currentRank: number;
    slice: RankGapStatsSlice;
    anchorMetrics: RankShadowAnchorMetrics | null;
    displayName?: string;
    photoURL?: string | null;
  }> = [];

  for (const member of cohort) {
    const cumulative = cumulativeByUid.get(member.uid);
    const slice = readRankGapStatsSlice(cumulative, {
      rankingLeague: input.rankingLeague,
      wcStage: input.wcStage,
    });
    if (!slice || slice.posts <= 0) continue;

    const currentFromRanks = readTotalPointsRankFromSnapshotRanks(
      cumulative,
      context
    );
    cohortMembers.push({
      uid: member.uid,
      priorRank: member.priorRank,
      weekStartRank:
        historyAnchorsByUid.get(member.uid)?.priorRank ?? member.priorRank,
      currentRank: currentFromRanks ?? member.priorRank,
      slice,
      anchorMetrics: historyAnchorsByUid.get(member.uid)?.anchorMetrics ?? null,
      displayName: profileByUid.get(member.uid)?.displayName,
      photoURL: profileByUid.get(member.uid)?.photoURL ?? null,
    });
  }

  return computeRankShadowAnalysis({
    currentRank,
    priorRank: bandAnchor.priorRank,
    priorBand,
    weekAnchorDateKey: weekStartDateKey,
    selfSlice,
    selfAnchorMetrics: historyAnchorsByUid.get(input.uid)?.anchorMetrics ?? null,
    selfWeekStartRank,
    cohortMembers,
    rankProgressPoints,
    rankingLeague: input.rankingLeague,
    language: input.language,
    selfUid: input.uid,
  });
}

export async function fetchRankShadowAnalysis(input: {
  uid: string;
  rankingLeague: RankingLeagueSource;
  language: Language;
}): Promise<RankShadowAnalysis | { ok: false; reason: string }> {
  const weekStartDateKey = resolveShadowWeekStartDateKey();
  const bandAnchorDateKey = resolveShadowBandAnchorDateKey();
  const metricAnchorDateKey = resolveShadowMetricAnchorDateKey();
  const cacheId = buildRankShadowCacheId({
    weekStartDateKey,
    rankingLeague: input.rankingLeague,
    language: input.language,
  });

  const cached = await readRankShadowCache({
    uid: input.uid,
    cacheId,
    weekStartDateKey,
  });
  if (cached) return cached;

  const analysis = await computeRankShadowAnalysisLive(input);
  if (!analysis.ok) return analysis;

  await writeRankShadowCache({
    uid: input.uid,
    cacheId,
    doc: {
      weekStartDateKey,
      bandAnchorDateKey,
      metricAnchorDateKey,
      contextKey: buildRankShadowContextKey(input),
      language: input.language,
      computedAtDateKey: dateKeyJST(),
      analysis,
    },
  });

  return analysis;
}

export { assertProUser } from "@/lib/rankings/server/fetchRankGapAnalysis";
