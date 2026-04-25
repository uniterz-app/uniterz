// functions/src/rankings/buildCumulativeStats.ts

import { getFirestore, FieldPath, FieldValue } from "firebase-admin/firestore";

function db() {
  return getFirestore();
}

/* =========================================================
 * JST utils
 * =======================================================*/
function toDateKeyJST(d: Date) {
  const j = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const y = j.getUTCFullYear();
  const m = String(j.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(j.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function getTodayJST() {
  return toDateKeyJST(new Date());
}

type RankingTotals = {
  totalPosts: number;
  totalWins: number;
  totalPoints: number;
  totalUpset: number;
  totalPrecision: number;
  winRate: number;
};

function addRankingTotals(
  base: Omit<RankingTotals, "winRate">,
  inc: {
    posts?: number;
    wins?: number;
    pointsSumV3?: number;
    upsetPointsSum?: number;
    scorePrecisionSum?: number;
  }
): Omit<RankingTotals, "winRate"> {
  return {
    totalPosts: base.totalPosts + (inc.posts ?? 0),
    totalWins: base.totalWins + (inc.wins ?? 0),
    totalPoints: base.totalPoints + (inc.pointsSumV3 ?? 0),
    totalUpset: base.totalUpset + (inc.upsetPointsSum ?? 0),
    totalPrecision: base.totalPrecision + (inc.scorePrecisionSum ?? 0),
  };
}

/* =========================================================
 * Main
 * =======================================================*/
export async function buildCumulativeStats() {
  const dateKey = getTodayJST();
  const firestore = db();
  const PAGE_SIZE = 500;
  const CONCURRENCY = 20;
  let updated = 0;
  let skipped = 0;
  let scanned = 0;

  const processDoc = async (
    doc: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>
  ) => {
    const data = doc.data();
    const uid = doc.id.split("_")[0];
    if (!uid) return { updated: false };

    const statsAll = data.all;
    if (!statsAll) return { updated: false };

    /** 日次に ranking が無い = デプロイ前データ → ランキング側も all と同じ増分 */
    const statsRanking = data.ranking ?? data.all;
    const statsByPhase = data.rankingByPhase ?? {};
      const statsByPlayoffRound = data.rankingByPlayoffRound ?? {};

    const cumulativeRef = firestore.doc(`cumulative_stats/${uid}`);
    const userRef = firestore.doc(`users/${uid}`);

    return firestore.runTransaction(async (tx) => {
      const [cumulativeSnap, userSnap] = await Promise.all([
        tx.get(cumulativeRef),
        tx.get(userRef),
      ]);

      const lastAggregatedDate =
        cumulativeSnap.get("lastAggregatedDate") ?? null;

      if (lastAggregatedDate === dateKey) {
        return { updated: false };
      }

      const user = userSnap.exists ? userSnap.data()! : {};

      /* =========================
       * 累積値（プロフィール = 全試合）
       * =======================*/
      const prevPosts = cumulativeSnap.get("totalPosts") ?? 0;
      const prevWins = cumulativeSnap.get("totalWins") ?? 0;
      const prevPoints = cumulativeSnap.get("totalPoints") ?? 0;
      const prevUpset = cumulativeSnap.get("totalUpset") ?? 0;
      const prevPrecision = cumulativeSnap.get("totalPrecision") ?? 0;

      const addPosts = statsAll.posts ?? 0;
      const addWins = statsAll.wins ?? 0;
      const addPoints = statsAll.pointsSumV3 ?? 0;
      const addUpset = statsAll.upsetPointsSum ?? 0;
      const addPrecision = statsAll.scorePrecisionSum ?? 0;

      const nextPosts = prevPosts + addPosts;
      const nextWins = prevWins + addWins;
      const nextPoints = prevPoints + addPoints;
      const nextUpset = prevUpset + addUpset;
      const nextPrecision = prevPrecision + addPrecision;

      const winRate = nextPosts > 0 ? nextWins / nextPosts : 0;

      /* =========================
       * ランキング用累積（プレーイン除外など）
       * ranking 未保存時はプロフィール累積でブートストラップ（二重計上防止）
       * =======================*/
      const prevR = cumulativeSnap.get("ranking") as
        | {
            totalPosts?: number;
            totalWins?: number;
            totalPoints?: number;
            totalUpset?: number;
            totalPrecision?: number;
          }
        | undefined;

      const bootPosts =
        prevR?.totalPosts != null ? prevR.totalPosts : prevPosts;
      const bootWins = prevR?.totalWins != null ? prevR.totalWins : prevWins;
      const bootPoints =
        prevR?.totalPoints != null ? prevR.totalPoints : prevPoints;
      const bootUpset = prevR?.totalUpset != null ? prevR.totalUpset : prevUpset;
      const bootPrecision =
        prevR?.totalPrecision != null ? prevR.totalPrecision : prevPrecision;

      const addRPosts = statsRanking.posts ?? 0;
      const addRWins = statsRanking.wins ?? 0;
      const addRPoints = statsRanking.pointsSumV3 ?? 0;
      const addRUpset = statsRanking.upsetPointsSum ?? 0;
      const addRPrecision = statsRanking.scorePrecisionSum ?? 0;

      const nextRPosts = bootPosts + addRPosts;
      const nextRWins = bootWins + addRWins;
      const nextRPoints = bootPoints + addRPoints;
      const nextRUpset = bootUpset + addRUpset;
      const nextRPrecision = bootPrecision + addRPrecision;
      const winRateRanking = nextRPosts > 0 ? nextRWins / nextRPosts : 0;

      /* =========================
       * フェーズ別ランキング累積（play_in / playoffs）
       * =======================*/
      const prevByPhase = (cumulativeSnap.get("rankingByPhase") ??
        {}) as Record<string, RankingTotals | undefined>;
      const prevPlayIn = prevByPhase.play_in ?? {
        totalPosts: 0,
        totalWins: 0,
        totalPoints: 0,
        totalUpset: 0,
        totalPrecision: 0,
        winRate: 0,
      };
      const prevPlayoffs = prevByPhase.playoffs ?? {
        totalPosts: 0,
        totalWins: 0,
        totalPoints: 0,
        totalUpset: 0,
        totalPrecision: 0,
        winRate: 0,
      };

      const nextPlayInRaw = addRankingTotals(prevPlayIn, {
        posts: statsByPhase.play_in?.posts ?? 0,
        wins: statsByPhase.play_in?.wins ?? 0,
        pointsSumV3: statsByPhase.play_in?.pointsSumV3 ?? 0,
        upsetPointsSum: statsByPhase.play_in?.upsetPointsSum ?? 0,
        scorePrecisionSum: statsByPhase.play_in?.scorePrecisionSum ?? 0,
      });
      const nextPlayoffsRaw = addRankingTotals(prevPlayoffs, {
        posts: statsByPhase.playoffs?.posts ?? 0,
        wins: statsByPhase.playoffs?.wins ?? 0,
        pointsSumV3: statsByPhase.playoffs?.pointsSumV3 ?? 0,
        upsetPointsSum: statsByPhase.playoffs?.upsetPointsSum ?? 0,
        scorePrecisionSum: statsByPhase.playoffs?.scorePrecisionSum ?? 0,
      });

      const nextPlayIn: RankingTotals = {
        ...nextPlayInRaw,
        winRate:
          nextPlayInRaw.totalPosts > 0
            ? nextPlayInRaw.totalWins / nextPlayInRaw.totalPosts
            : 0,
      };
      const nextPlayoffs: RankingTotals = {
        ...nextPlayoffsRaw,
        winRate:
          nextPlayoffsRaw.totalPosts > 0
            ? nextPlayoffsRaw.totalWins / nextPlayoffsRaw.totalPosts
            : 0,
      };

      /* =========================
       * プレーオフラウンド別ランキング累積（r1 / r2 / cf / finals）
       * =======================*/
      const prevByRound = (cumulativeSnap.get("rankingByPlayoffRound") ??
        {}) as Record<string, RankingTotals | undefined>;
      const roundKeys = ["r1", "r2", "cf", "finals"] as const;
      const nextByRound: Record<string, RankingTotals> = {};
      for (const rk of roundKeys) {
        const prevRound = prevByRound[rk] ?? {
          totalPosts: 0,
          totalWins: 0,
          totalPoints: 0,
          totalUpset: 0,
          totalPrecision: 0,
          winRate: 0,
        };
        const nextRoundRaw = addRankingTotals(prevRound, {
          posts: statsByPlayoffRound[rk]?.posts ?? 0,
          wins: statsByPlayoffRound[rk]?.wins ?? 0,
          pointsSumV3: statsByPlayoffRound[rk]?.pointsSumV3 ?? 0,
          upsetPointsSum: statsByPlayoffRound[rk]?.upsetPointsSum ?? 0,
          scorePrecisionSum: statsByPlayoffRound[rk]?.scorePrecisionSum ?? 0,
        });
        nextByRound[rk] = {
          ...nextRoundRaw,
          winRate:
            nextRoundRaw.totalPosts > 0
              ? nextRoundRaw.totalWins / nextRoundRaw.totalPosts
              : 0,
        };
      }

      tx.set(
        cumulativeRef,
        {
          uid,

          displayName: user.displayName ?? "user",
          handle: user.handle ?? null,
          photoURL: user.photoURL ?? null,
          countryCode: user.countryCode ?? null,
          plan: user.plan === "pro" ? "pro" : "free",

          totalPosts: nextPosts,
          totalWins: nextWins,

          totalPoints: nextPoints,
          totalUpset: nextUpset,
          totalPrecision: nextPrecision,
          winRate,

          ranking: {
            totalPosts: nextRPosts,
            totalWins: nextRWins,
            totalPoints: nextRPoints,
            totalUpset: nextRUpset,
            totalPrecision: nextRPrecision,
            winRate: winRateRanking,
          },
          rankingByPhase: {
            play_in: nextPlayIn,
            playoffs: nextPlayoffs,
          },
          rankingByPlayoffRound: nextByRound,

          lastAggregatedDate: dateKey,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      return { updated: true };
    });
  };

  let cursor:
    | FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>
    | undefined;

  for (;;) {
    let q: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = firestore
      .collection("user_stats_v2_daily")
      .where("date", "==", dateKey)
      .orderBy(FieldPath.documentId())
      .limit(PAGE_SIZE);
    if (cursor) q = q.startAfter(cursor);

    const pageSnap = await q.get();
    if (pageSnap.empty) break;

    scanned += pageSnap.size;
    cursor = pageSnap.docs[pageSnap.docs.length - 1];

    for (let i = 0; i < pageSnap.docs.length; i += CONCURRENCY) {
      const chunk = pageSnap.docs.slice(i, i + CONCURRENCY);
      const chunkResults = await Promise.all(chunk.map((d) => processDoc(d)));
      chunkResults.forEach((r) => {
        if (r.updated) updated++;
        else skipped++;
      });
    }
  }

  return {
    date: dateKey,
    scanned,
    updated,
    skipped,
  };
}