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
function getValue(d: any, metric: Metric) {
  if (metric === "winRate") return d.winRate ?? 0;
  if (metric === "totalPoints") return d.totalPoints ?? 0;
  if (metric === "totalPrecision") return d.totalPrecision ?? 0;
  if (metric === "totalUpset") return d.totalUpset ?? 0;
  return d.activeWinStreak ?? 0;
}

/* =========================================================
 * Main
 * =======================================================*/
export async function buildCumulativeRankingSnapshot() {
  const snap = await db().collection("cumulative_stats").get();

  const baseRows = snap.docs.map((doc) => {
    const d = doc.data();

    const totalPosts = d.totalPosts ?? 0;
    const totalWins = d.totalWins ?? 0;

    return {
      uid: doc.id,
      displayName: d.displayName ?? "user",
      handle: d.handle ?? null,
      photoURL: d.photoURL ?? null,

      totalPosts,
      totalWins,
      winRate: totalPosts > 0 ? totalWins / totalPosts : 0,

      totalPoints: d.totalPoints ?? 0,
      totalPrecision: d.totalPrecision ?? 0,
      totalUpset: d.totalUpset ?? 0,
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