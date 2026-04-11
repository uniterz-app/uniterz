// functions/src/rankings/buildCumulativeRankingSnapshot.ts

import { getFirestore, FieldValue } from "firebase-admin/firestore";

/* =========================================================
 * Firestore
 * =======================================================*/
function db() {
  return getFirestore();
}

type Metric =
  | "winRate"
  | "totalPoints"
  | "totalPrecision"
  | "totalUpset"
  | "activeWinStreak";

const METRICS: Metric[] = [
  "totalPoints",
  "winRate",
  "totalPrecision",
  "totalUpset",
  "activeWinStreak",
];

/* =========================================================
 * Utils
 * =======================================================*/
/** ランキング掲載用（プレーイン除外トラック）。未移行ドキュメントはルートをそのまま使う */
function rankingSlice(d: any) {
  const rk = d.ranking;
  if (rk && typeof rk === "object") {
    const tp = rk.totalPosts ?? 0;
    const tw = rk.totalWins ?? 0;
    return {
      totalPosts: tp,
      totalWins: tw,
      winRate: tp > 0 ? tw / tp : rk.winRate ?? 0,
      totalPoints: rk.totalPoints ?? 0,
      totalPrecision: rk.totalPrecision ?? 0,
      totalUpset: rk.totalUpset ?? 0,
    };
  }
  const totalPosts = d.totalPosts ?? 0;
  const totalWins = d.totalWins ?? 0;
  return {
    totalPosts,
    totalWins,
    winRate: d.winRate ?? 0,
    totalPoints: d.totalPoints ?? 0,
    totalPrecision: d.totalPrecision ?? 0,
    totalUpset: d.totalUpset ?? 0,
  };
}

function getValue(d: any, metric: Metric) {
  if (metric === "activeWinStreak") return d.activeWinStreak ?? 0;
  const r = rankingSlice(d);
  if (metric === "winRate") return r.winRate ?? 0;
  if (metric === "totalPoints") return r.totalPoints ?? 0;
  if (metric === "totalPrecision") return r.totalPrecision ?? 0;
  return r.totalUpset ?? 0;
}

/* =========================================================
 * Main
 * =======================================================*/
export async function buildCumulativeRankingSnapshot() {
  const snap = await db().collection("cumulative_stats").get();

  const baseRows = snap.docs.map((doc) => {
    const d = doc.data();
    const r = rankingSlice(d);

    return {
      uid: doc.id,
      displayName: d.displayName ?? "user",
      handle: d.handle ?? null,
      photoURL: d.photoURL ?? null,
      countryCode: d.countryCode ?? null,
      plan: d.plan === "pro" ? "pro" : "free",

      totalPosts: r.totalPosts,
      totalWins: r.totalWins,
      winRate: r.winRate,

      totalPoints: r.totalPoints,
      totalPrecision: r.totalPrecision,
      totalUpset: r.totalUpset,
      activeWinStreak: d.activeWinStreak ?? 0,
    };
  });

  for (const metric of METRICS) {
    const sorted = [...baseRows]
      .sort((a, b) => {
        const diff = getValue(b, metric) - getValue(a, metric);
        if (diff !== 0) return diff;

        if (metric === "winRate") {
          const postsDiff = (b.totalPosts ?? 0) - (a.totalPosts ?? 0);
          if (postsDiff !== 0) return postsDiff;
        }

        return (b.totalPoints ?? 0) - (a.totalPoints ?? 0);
      })
      .slice(0, 20)
      .map((row, index) => ({
        ...row,
        rank: index + 1,
      }));

    await db()
      .collection("cumulative_ranking_snapshots")
      .doc(metric)
      .set(
        {
          metric,
          rows: sorted,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
  }

  return {
    ok: true,
    metrics: METRICS.length,
  };
}