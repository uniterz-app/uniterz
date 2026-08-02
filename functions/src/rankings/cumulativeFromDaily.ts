// functions/src/rankings/cumulativeFromDaily.ts
// cumulative_stats を日次（user_stats_v2_daily）と整合させる共通ロジック

import {
  FieldPath,
  FieldValue,
  type Firestore,
  type Transaction,
} from "firebase-admin/firestore";
import { safeRankMetricNum } from "./safeRankMetricNum";
import {
  CUMULATIVE_RANKING_TOTAL_POSTS_FIELD,
  rankingTotalPostsFromAggregate,
} from "./cumulativeSnapshotIndex";

export type RankingTotals = {
  totalPosts: number;
  totalWins: number;
  totalPoints: number;
  totalUpset: number;
  totalPrecision: number;
  totalGoalScorerHits: number;
  winRate: number;
};

export type PostCumulativeContribution = {
  forRanking: boolean;
  /** NBA レギュラーシーズンバケット（regular / 未設定 phase のみ） */
  nbaSeasonKey: string | null;
  /** NBA プレーオフシーズンバケット（playoffs phase のみ） */
  nbaPlayoffsSeasonKey: string | null;
  leagueKey: string | null;
  isWc: boolean;
  wcStage: "qualifying" | "main" | null;
  isWin: boolean;
  points: number;
  upsetPoints: number;
  exactHit: boolean;
  goalScorerHit: boolean;
  upsetBonus: number;
  streakBonus: number;
};

function emptyRankingTotals(): Omit<RankingTotals, "winRate"> {
  return {
    totalPosts: 0,
    totalWins: 0,
    totalPoints: 0,
    totalUpset: 0,
    totalPrecision: 0,
    totalGoalScorerHits: 0,
  };
}

function withWinRate(raw: Omit<RankingTotals, "winRate">): RankingTotals {
  return {
    ...raw,
    winRate:
      raw.totalPosts > 0 ? raw.totalWins / raw.totalPosts : 0,
  };
}

export function addRankingTotals(
  base: Omit<RankingTotals, "winRate">,
  inc: {
    posts?: number;
    wins?: number;
    pointsSumV3?: number;
    upsetPointsSum?: number;
    exactHitCount?: number;
    goalScorerHitCount?: number;
    /** WC ステージ累積: totalPrecision に exactHitCount を載せる */
    precisionFromExactHits?: boolean;
  }
): Omit<RankingTotals, "winRate"> {
  const precisionInc = inc.precisionFromExactHits
    ? safeRankMetricNum(inc.exactHitCount)
    : 0;
  return {
    totalPosts:
      safeRankMetricNum(base.totalPosts) + safeRankMetricNum(inc.posts),
    totalWins:
      safeRankMetricNum(base.totalWins) + safeRankMetricNum(inc.wins),
    totalPoints:
      safeRankMetricNum(base.totalPoints) +
      safeRankMetricNum(inc.pointsSumV3),
    totalUpset:
      safeRankMetricNum(base.totalUpset) +
      safeRankMetricNum(inc.upsetPointsSum),
    totalPrecision:
      safeRankMetricNum(base.totalPrecision) + precisionInc,
    totalGoalScorerHits:
      safeRankMetricNum(base.totalGoalScorerHits) +
      safeRankMetricNum(inc.goalScorerHitCount),
  };
}

function num(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function bucketToInc(
  bucket: Record<string, unknown> | undefined | null,
  opts?: { precisionFromExactHits?: boolean }
) {
  if (!bucket || typeof bucket !== "object") {
    return {
      posts: 0,
      wins: 0,
      pointsSumV3: 0,
      upsetPointsSum: 0,
      exactHitCount: 0,
      goalScorerHitCount: 0,
      precisionFromExactHits: opts?.precisionFromExactHits ?? false,
    };
  }
  return {
    posts: num(bucket.posts),
    wins: num(bucket.wins),
    pointsSumV3: num(bucket.pointsSumV3),
    upsetPointsSum: num(bucket.upsetPointsSum),
    exactHitCount: num(bucket.exactHitCount),
    goalScorerHitCount: num(bucket.goalScorerHitCount),
    precisionFromExactHits: opts?.precisionFromExactHits ?? false,
  };
}

/** 1投稿ぶんの加算/減算（sign = 1 | -1）を cumulative_stats 用 FieldValue に変換 */
export function buildCumulativeIncrementFields(
  contrib: PostCumulativeContribution,
  sign: 1 | -1 = 1
): Record<string, FieldValue> {
  const s = sign;
  const posts = s;
  const wins = contrib.isWin ? s : 0;
  const points = contrib.points * s;
  const upset = contrib.upsetPoints * s;
  const goalScorer = contrib.goalScorerHit ? s : 0;
  const upsetBonus = safeRankMetricNum(contrib.upsetBonus) * s;
  const streakBonus = safeRankMetricNum(contrib.streakBonus) * s;

  const out: Record<string, FieldValue> = {
    totalPosts: FieldValue.increment(posts),
    totalWins: FieldValue.increment(wins),
    totalPoints: FieldValue.increment(points),
    totalUpset: FieldValue.increment(upset),
  };
  if (upsetBonus !== 0) out.upsetBonusSum = FieldValue.increment(upsetBonus);
  if (streakBonus !== 0) out.streakBonusSum = FieldValue.increment(streakBonus);

  if (!contrib.forRanking) return out;

  out[CUMULATIVE_RANKING_TOTAL_POSTS_FIELD] = FieldValue.increment(posts);

  out["ranking.totalPosts"] = FieldValue.increment(posts);
  out["ranking.totalWins"] = FieldValue.increment(wins);
  out["ranking.totalPoints"] = FieldValue.increment(points);
  out["ranking.totalUpset"] = FieldValue.increment(upset);
  if (upsetBonus !== 0) {
    out["ranking.upsetBonusSum"] = FieldValue.increment(upsetBonus);
  }
  if (streakBonus !== 0) {
    out["ranking.streakBonusSum"] = FieldValue.increment(streakBonus);
  }

  const applyBonusToPath = (path: string) => {
    if (upsetBonus !== 0) {
      out[`${path}.upsetBonusSum`] = FieldValue.increment(upsetBonus);
    }
    if (streakBonus !== 0) {
      out[`${path}.streakBonusSum`] = FieldValue.increment(streakBonus);
    }
  };

  if (contrib.nbaSeasonKey) {
    const p = `rankingBySeason.${contrib.nbaSeasonKey}`;
    out[`${p}.totalPosts`] = FieldValue.increment(posts);
    out[`${p}.totalWins`] = FieldValue.increment(wins);
    out[`${p}.totalPoints`] = FieldValue.increment(points);
    out[`${p}.totalUpset`] = FieldValue.increment(upset);
    out[`${p}.totalGoalScorerHits`] = FieldValue.increment(goalScorer);
    applyBonusToPath(p);
  }

  if (contrib.nbaPlayoffsSeasonKey) {
    const p = `rankingByNbaPlayoffs.${contrib.nbaPlayoffsSeasonKey}`;
    out[`${p}.totalPosts`] = FieldValue.increment(posts);
    out[`${p}.totalWins`] = FieldValue.increment(wins);
    out[`${p}.totalPoints`] = FieldValue.increment(points);
    out[`${p}.totalUpset`] = FieldValue.increment(upset);
    out[`${p}.totalGoalScorerHits`] = FieldValue.increment(goalScorer);
    applyBonusToPath(p);
  }

  return out;
}

export function applyCumulativeIncrementInTransaction(
  tx: Transaction,
  cumulativeRef: FirebaseFirestore.DocumentReference,
  user: Record<string, unknown>,
  uid: string,
  contrib: PostCumulativeContribution,
  sign: 1 | -1 = 1
) {
  tx.set(
    cumulativeRef,
    {
      uid,
      displayName: user.displayName ?? "user",
      handle: user.handle ?? null,
      photoURL: user.photoURL ?? null,
      countryCode: user.countryCode ?? null,
      plan: user.plan === "pro" ? "pro" : "free",
      cumulativeLiveUpdates: true,
      updatedAt: FieldValue.serverTimestamp(),
      ...buildCumulativeIncrementFields(contrib, sign),
    },
    { merge: true }
  );
}

export type AggregatedCumulative = {
  profile: RankingTotals;
  ranking: RankingTotals;
  /** シーズンキー（例: "2026-27"）→ NBA レギュラーシーズン累積 */
  rankingBySeason: Record<string, RankingTotals>;
  /** シーズンキー → NBA プレーオフ累積（現行シーズン PO のみ） */
  rankingByNbaPlayoffs: Record<string, RankingTotals>;
};

export function aggregateCumulativeFromDailyData(
  dailyDocs: Array<Record<string, unknown>>
): AggregatedCumulative {
  let profile = emptyRankingTotals();
  let ranking = emptyRankingTotals();
  const bySeason = new Map<string, Omit<RankingTotals, "winRate">>();
  const byNbaPlayoffs = new Map<string, Omit<RankingTotals, "winRate">>();

  for (const data of dailyDocs) {
    profile = addRankingTotals(
      profile,
      bucketToInc(data.all as Record<string, unknown> | undefined)
    );

    const rankBucket =
      (data.ranking as Record<string, unknown> | undefined) ??
      (data.all as Record<string, unknown> | undefined);
    ranking = addRankingTotals(ranking, bucketToInc(rankBucket));

    const bySeasonBuckets = (data.rankingBySeason ?? {}) as Record<
      string,
      Record<string, unknown>
    >;
    for (const [seasonKey, bucket] of Object.entries(bySeasonBuckets)) {
      if (!bucket || typeof bucket !== "object") continue;
      bySeason.set(
        seasonKey,
        addRankingTotals(
          bySeason.get(seasonKey) ?? emptyRankingTotals(),
          bucketToInc(bucket)
        )
      );
    }

    const byPlayoffsBuckets = (data.rankingByNbaPlayoffs ?? {}) as Record<
      string,
      Record<string, unknown>
    >;
    for (const [seasonKey, bucket] of Object.entries(byPlayoffsBuckets)) {
      if (!bucket || typeof bucket !== "object") continue;
      byNbaPlayoffs.set(
        seasonKey,
        addRankingTotals(
          byNbaPlayoffs.get(seasonKey) ?? emptyRankingTotals(),
          bucketToInc(bucket)
        )
      );
    }

  }

  const rankingBySeason: Record<string, RankingTotals> = {};
  for (const [seasonKey, totals] of bySeason) {
    rankingBySeason[seasonKey] = withWinRate(totals);
  }

  const rankingByNbaPlayoffs: Record<string, RankingTotals> = {};
  for (const [seasonKey, totals] of byNbaPlayoffs) {
    rankingByNbaPlayoffs[seasonKey] = withWinRate(totals);
  }

  return {
    profile: withWinRate(profile),
    ranking: withWinRate(ranking),
    rankingBySeason,
    rankingByNbaPlayoffs,
  };
}

function totalsClose(a: number, b: number, eps = 0.0001): boolean {
  return Math.abs(a - b) <= eps;
}

export function aggregatedCumulativeMatchesDoc(
  agg: AggregatedCumulative,
  doc: Record<string, unknown> | undefined
): boolean {
  if (!doc) return false;
  const profilePosts = num(doc.totalPosts);
  const profilePoints = num(doc.totalPoints);
  const rankingBlock = doc.ranking as Record<string, unknown> | undefined;
  const rankPosts = num(rankingBlock?.totalPosts);
  const rankPoints = num(rankingBlock?.totalPoints);

  return (
    totalsClose(profilePosts, agg.profile.totalPosts) &&
    totalsClose(profilePoints, agg.profile.totalPoints) &&
    totalsClose(rankPosts, agg.ranking.totalPosts) &&
    totalsClose(rankPoints, agg.ranking.totalPoints)
  );
}

export function cumulativePayloadFromAggregate(
  uid: string,
  user: Record<string, unknown>,
  agg: AggregatedCumulative,
  lastReconciledDateKey: string
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    uid,
    displayName: user.displayName ?? "user",
    handle: user.handle ?? null,
    photoURL: user.photoURL ?? null,
    countryCode: user.countryCode ?? null,
    plan: user.plan === "pro" ? "pro" : "free",

    totalPosts: agg.profile.totalPosts,
    totalWins: agg.profile.totalWins,
    totalPoints: agg.profile.totalPoints,
    totalUpset: agg.profile.totalUpset,
    totalPrecision: agg.profile.totalPrecision,
    winRate: agg.profile.winRate,

    ranking: agg.ranking,
    rankingBySeason: agg.rankingBySeason,
    rankingByNbaPlayoffs: agg.rankingByNbaPlayoffs,

    ...rankingTotalPostsFromAggregate(agg.ranking.totalPosts),

    cumulativeLiveUpdates: true,
    lastReconciledDateKey,
    updatedAt: FieldValue.serverTimestamp(),
  };
  return payload;
}

export async function fetchAllDailyDocsForUid(
  db: Firestore,
  uid: string
): Promise<Array<Record<string, unknown>>> {
  const snap = await db
    .collection("user_stats_v2_daily")
    .where(FieldPath.documentId(), ">=", `${uid}_`)
    .where(FieldPath.documentId(), "<=", `${uid}_\uf8ff`)
    .get();
  return snap.docs.map((d) => d.data());
}

export async function reconcileCumulativeStatsForUid(
  db: Firestore,
  uid: string,
  lastReconciledDateKey: string
): Promise<{ updated: boolean; reason: "ok" | "no_daily" | "unchanged" }> {
  const dailyDocs = await fetchAllDailyDocsForUid(db, uid);
  if (dailyDocs.length === 0) {
    return { updated: false, reason: "no_daily" };
  }

  const agg = aggregateCumulativeFromDailyData(dailyDocs);
  const cumulativeRef = db.doc(`cumulative_stats/${uid}`);
  const userRef = db.doc(`users/${uid}`);
  const [cumulativeSnap, userSnap] = await Promise.all([
    cumulativeRef.get(),
    userRef.get(),
  ]);

  const user = userSnap.exists ? userSnap.data()! : {};
  const current = cumulativeSnap.exists
    ? (cumulativeSnap.data() as Record<string, unknown>)
    : undefined;

  if (aggregatedCumulativeMatchesDoc(agg, current)) {
    return { updated: false, reason: "unchanged" };
  }

  await cumulativeRef.set(
    cumulativePayloadFromAggregate(uid, user, agg, lastReconciledDateKey),
    { merge: true }
  );
  return { updated: true, reason: "ok" };
}
