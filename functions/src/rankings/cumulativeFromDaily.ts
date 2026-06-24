// functions/src/rankings/cumulativeFromDaily.ts
// cumulative_stats を日次（user_stats_v2_daily）と整合させる共通ロジック

import {
  FieldPath,
  FieldValue,
  type Firestore,
  type Transaction,
} from "firebase-admin/firestore";
import {
  readDailyWcStageBuckets,
  WC_RANKING_STAGES,
} from "./dailyWcStageBuckets";
import { safeRankMetricNum } from "./safeRankMetricNum";

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
  phaseKey: "play_in" | "playoffs" | null;
  roundKey: "r1" | "r2" | "cf" | "finals" | null;
  leagueKey: string | null;
  isWc: boolean;
  wcStage: "qualifying" | "main" | null;
  isWin: boolean;
  points: number;
  upsetPoints: number;
  scorePrecision: number;
  exactHit: boolean;
  goalScorerHit: boolean;
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
    scorePrecisionSum?: number;
    exactHitCount?: number;
    goalScorerHitCount?: number;
    /** WC ステージ累積: totalPrecision に exactHitCount を載せる */
    precisionFromExactHits?: boolean;
  }
): Omit<RankingTotals, "winRate"> {
  const precisionInc = inc.precisionFromExactHits
    ? safeRankMetricNum(inc.exactHitCount)
    : safeRankMetricNum(inc.scorePrecisionSum);
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
      scorePrecisionSum: 0,
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
    scorePrecisionSum: num(bucket.scorePrecisionSum),
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
  const profilePrecision =
    contrib.isWc ? 0 : contrib.scorePrecision * s;
  const goalScorer = contrib.goalScorerHit ? s : 0;
  const wcExact = contrib.isWc && contrib.exactHit ? s : 0;
  const nbaPrecision = contrib.isWc ? 0 : contrib.scorePrecision * s;

  const out: Record<string, FieldValue> = {
    totalPosts: FieldValue.increment(posts),
    totalWins: FieldValue.increment(wins),
    totalPoints: FieldValue.increment(points),
    totalUpset: FieldValue.increment(upset),
    totalPrecision: FieldValue.increment(profilePrecision),
  };

  if (!contrib.forRanking) return out;

  out["ranking.totalPosts"] = FieldValue.increment(posts);
  out["ranking.totalWins"] = FieldValue.increment(wins);
  out["ranking.totalPoints"] = FieldValue.increment(points);
  out["ranking.totalUpset"] = FieldValue.increment(upset);
  out["ranking.totalPrecision"] = FieldValue.increment(nbaPrecision);

  if (contrib.phaseKey === "play_in") {
    const p = "rankingByPhase.play_in";
    out[`${p}.totalPosts`] = FieldValue.increment(posts);
    out[`${p}.totalWins`] = FieldValue.increment(wins);
    out[`${p}.totalPoints`] = FieldValue.increment(points);
    out[`${p}.totalUpset`] = FieldValue.increment(upset);
    out[`${p}.totalPrecision`] = FieldValue.increment(nbaPrecision);
    out[`${p}.totalGoalScorerHits`] = FieldValue.increment(goalScorer);
  }

  if (contrib.phaseKey === "playoffs") {
    const p = "rankingByPhase.playoffs";
    out[`${p}.totalPosts`] = FieldValue.increment(posts);
    out[`${p}.totalWins`] = FieldValue.increment(wins);
    out[`${p}.totalPoints`] = FieldValue.increment(points);
    out[`${p}.totalUpset`] = FieldValue.increment(upset);
    out[`${p}.totalPrecision`] = FieldValue.increment(nbaPrecision);
    out[`${p}.totalGoalScorerHits`] = FieldValue.increment(goalScorer);

    if (contrib.roundKey) {
      const r = `rankingByPlayoffRound.${contrib.roundKey}`;
      out[`${r}.totalPosts`] = FieldValue.increment(posts);
      out[`${r}.totalWins`] = FieldValue.increment(wins);
      out[`${r}.totalPoints`] = FieldValue.increment(points);
      out[`${r}.totalUpset`] = FieldValue.increment(upset);
      out[`${r}.totalPrecision`] = FieldValue.increment(nbaPrecision);
      out[`${r}.totalGoalScorerHits`] = FieldValue.increment(goalScorer);
    }
  }

  if (contrib.isWc && contrib.forRanking) {
    const stages: Array<"overall" | "qualifying" | "main"> = ["overall"];
    if (contrib.wcStage === "qualifying") stages.push("qualifying");
    if (contrib.wcStage === "main") stages.push("main");

    for (const stage of stages) {
      const w = `rankingByWcStage.${stage}`;
      out[`${w}.totalPosts`] = FieldValue.increment(posts);
      out[`${w}.totalWins`] = FieldValue.increment(wins);
      out[`${w}.totalPoints`] = FieldValue.increment(points);
      out[`${w}.totalUpset`] = FieldValue.increment(upset);
      out[`${w}.totalPrecision`] = FieldValue.increment(wcExact);
      out[`${w}.totalGoalScorerHits`] = FieldValue.increment(goalScorer);
    }
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
  rankingByPhase: Record<"play_in" | "playoffs", RankingTotals>;
  rankingByPlayoffRound: Record<"r1" | "r2" | "cf" | "finals", RankingTotals>;
  rankingByWcStage: Record<
    (typeof WC_RANKING_STAGES)[number],
    RankingTotals
  >;
};

export function aggregateCumulativeFromDailyData(
  dailyDocs: Array<Record<string, unknown>>
): AggregatedCumulative {
  let profile = emptyRankingTotals();
  let ranking = emptyRankingTotals();
  let playIn = emptyRankingTotals();
  let playoffs = emptyRankingTotals();
  const byRound = {
    r1: emptyRankingTotals(),
    r2: emptyRankingTotals(),
    cf: emptyRankingTotals(),
    finals: emptyRankingTotals(),
  };
  const byWc = {
    overall: emptyRankingTotals(),
    qualifying: emptyRankingTotals(),
    main: emptyRankingTotals(),
  };

  for (const data of dailyDocs) {
    profile = addRankingTotals(
      profile,
      bucketToInc(data.all as Record<string, unknown> | undefined)
    );

    const rankBucket =
      (data.ranking as Record<string, unknown> | undefined) ??
      (data.all as Record<string, unknown> | undefined);
    ranking = addRankingTotals(ranking, bucketToInc(rankBucket));

    const byPhase = (data.rankingByPhase ?? {}) as Record<
      string,
      Record<string, unknown>
    >;
    playIn = addRankingTotals(
      playIn,
      bucketToInc(byPhase.play_in)
    );
    playoffs = addRankingTotals(
      playoffs,
      bucketToInc(byPhase.playoffs)
    );

    const byPlayoffRound = (data.rankingByPlayoffRound ?? {}) as Record<
      string,
      Record<string, unknown>
    >;
    for (const rk of ["r1", "r2", "cf", "finals"] as const) {
      byRound[rk] = addRankingTotals(
        byRound[rk],
        bucketToInc(byPlayoffRound[rk])
      );
    }

    const wcBuckets = readDailyWcStageBuckets(data);
    for (const wk of WC_RANKING_STAGES) {
      byWc[wk] = addRankingTotals(
        byWc[wk],
        bucketToInc(wcBuckets[wk], { precisionFromExactHits: true })
      );
    }
  }

  return {
    profile: withWinRate(profile),
    ranking: withWinRate(ranking),
    rankingByPhase: {
      play_in: withWinRate(playIn),
      playoffs: withWinRate(playoffs),
    },
    rankingByPlayoffRound: {
      r1: withWinRate(byRound.r1),
      r2: withWinRate(byRound.r2),
      cf: withWinRate(byRound.cf),
      finals: withWinRate(byRound.finals),
    },
    rankingByWcStage: {
      overall: withWinRate(byWc.overall),
      qualifying: withWinRate(byWc.qualifying),
      main: withWinRate(byWc.main),
    },
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
  const wcOverall = (
    doc.rankingByWcStage as Record<string, Record<string, unknown>> | undefined
  )?.overall;
  const wcPosts = num(wcOverall?.totalPosts);
  const wcPoints = num(wcOverall?.totalPoints);

  return (
    totalsClose(profilePosts, agg.profile.totalPosts) &&
    totalsClose(profilePoints, agg.profile.totalPoints) &&
    totalsClose(wcPosts, agg.rankingByWcStage.overall.totalPosts) &&
    totalsClose(wcPoints, agg.rankingByWcStage.overall.totalPoints)
  );
}

export function cumulativePayloadFromAggregate(
  uid: string,
  user: Record<string, unknown>,
  agg: AggregatedCumulative,
  lastReconciledDateKey: string
): Record<string, unknown> {
  return {
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
    rankingByPhase: agg.rankingByPhase,
    rankingByPlayoffRound: agg.rankingByPlayoffRound,
    rankingByWcStage: agg.rankingByWcStage,

    cumulativeLiveUpdates: true,
    lastReconciledDateKey,
    updatedAt: FieldValue.serverTimestamp(),
  };
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
