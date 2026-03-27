// functions/src/rankings/getCumulativeRanking.ts

import { onRequest } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";

function db() {
  return getFirestore();
}

type Metric =
  | "winRate"
  | "totalPoints"
  | "totalPrecision"
  | "totalUpset"
  | "activeWinStreak";

type RankingRow = {
  uid: string;
  displayName: string;
  handle: string | null;
  photoURL: string | null;
  countryCode?: string | null;

  totalPosts: number;
  totalWins: number;
  winRate: number;

  totalPoints: number;
  totalPrecision: number;
  totalUpset: number;
  activeWinStreak: number;

  rank: number;
};

function isMetric(v: unknown): v is Metric {
  return (
    v === "winRate" ||
    v === "totalPoints" ||
    v === "totalPrecision" ||
    v === "totalUpset" ||
    v === "activeWinStreak"
  );
}

export const getCumulativeRanking = onRequest(async (req, res) => {
  try {
    const rawMetric = req.query.metric;
    const uid = req.query.uid as string | undefined;

    const metric: Metric = isMetric(rawMetric) ? rawMetric : "totalPoints";

    /* =========================
     * ① Top20（snapshot）
     * =======================*/
    const snapDoc = await db()
      .collection("cumulative_ranking_snapshots")
      .doc(metric)
      .get();

    const rows: RankingRow[] = snapDoc.exists
      ? (snapDoc.data()?.rows ?? [])
      : [];

    let myRank: number | null = null;
    let myRow: RankingRow | null = null;

    /* =========================
     * ② 自分の順位 + 自分のデータ
     * =======================*/
    if (uid) {
      const mySnap = await db().collection("cumulative_stats").doc(uid).get();

      if (mySnap.exists) {
        const me = mySnap.data() as any;

        const myValue = metric === "winRate" ? me.winRate ?? 0 : me[metric] ?? 0;

        const higherSnap = await db()
          .collection("cumulative_stats")
          .where(metric === "winRate" ? "winRate" : metric, ">", myValue)
          .count()
          .get();

        myRank = (higherSnap.data().count ?? 0) + 1;

        myRow = {
          uid,
          displayName: me.displayName ?? "",
          handle: me.handle ?? null,
          photoURL: me.photoURL ?? null,
          countryCode: me.countryCode ?? null,

          totalPosts: me.totalPosts ?? 0,
          totalWins: me.totalWins ?? 0,
          winRate: me.winRate ?? 0,

          totalPoints: me.totalPoints ?? 0,
          totalPrecision: me.totalPrecision ?? 0,
          totalUpset: me.totalUpset ?? 0,
          activeWinStreak: me.activeWinStreak ?? 0,

          rank: myRank,
        };
      }
    }

    /* =========================
     * response
     * =======================*/
    res.status(200).json({
      ok: true,
      metric,
      count: rows.length,
      rows,
      myRank,
      myRow,
    });
    return;
  } catch (e: any) {
    res.status(500).json({
      ok: false,
      error: e?.message ?? "unknown error",
    });
    return;
  }
});