// functions/src/leaderboards/buildMonthlyLeaderboardSnapshot.ts

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
  | "totalUpset";

type MonthlyLeaderboardRow = {
  uid: string;
  displayName: string;
  handle: string | null;
  photoURL: string | null;

  league: string;
  posts: number;
  wins: number;

  winRate: number;
  totalPoints: number;
  totalPrecision: number;
  totalUpset: number;
};

const METRICS: Metric[] = [
  "totalPoints",
  "winRate",
  "totalPrecision",
  "totalUpset",
];

/* =========================================================
 * Utils
 * =======================================================*/
function getValue(d: MonthlyLeaderboardRow, metric: Metric) {
  if (metric === "winRate") return d.winRate ?? 0;
  if (metric === "totalPoints") return d.totalPoints ?? 0;
  if (metric === "totalPrecision") return d.totalPrecision ?? 0;
  return d.totalUpset ?? 0;
}

/* =========================================================
 * Main
 * =======================================================*/
export async function buildMonthlyLeaderboardSnapshot(params: {
  league: string;
  month: string;
}) {
  const { league, month } = params;

  const docId = `${league}_${month}`;

  const leaderboardSnap = await db()
    .collection("leaderboards_monthly")
    .doc(docId)
    .get();

  if (!leaderboardSnap.exists) {
    return {
      ok: false,
      error: "monthly leaderboard not found",
      league,
      month,
    };
  }

  const rows: MonthlyLeaderboardRow[] = leaderboardSnap.data()?.rows ?? [];

  for (const metric of METRICS) {
    const top10 = [...rows]
      .sort((a, b) => {
        const diff = getValue(b, metric) - getValue(a, metric);
        if (diff !== 0) return diff;

        if (metric === "winRate") {
          const postsDiff = (b.posts ?? 0) - (a.posts ?? 0);
          if (postsDiff !== 0) return postsDiff;
        }

        return (b.totalPoints ?? 0) - (a.totalPoints ?? 0);
      })
      .slice(0, 10)
      .map((row, index) => ({
        ...row,
        rank: index + 1,
      }));

    await db()
      .collection("monthly_leaderboard_snapshots")
      .doc(`${league}_${month}_${metric}`)
      .set(
        {
          league,
          month,
          metric,
          rows: top10,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
  }

  return {
    ok: true,
    league,
    month,
    metrics: METRICS.length,
  };
}