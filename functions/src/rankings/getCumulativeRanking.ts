// functions/src/rankings/getCumulativeRanking.ts

import { onRequest } from "firebase-functions/v2/https";
import { getFirestore, FieldPath } from "firebase-admin/firestore";

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
        const rk = rankingSlice(me);

        const myValue =
          metric === "activeWinStreak"
            ? me.activeWinStreak ?? 0
            : metric === "winRate"
              ? rk.winRate ?? 0
              : rk[metric] ?? 0;

        const hasRankingObj =
          me.ranking &&
          typeof me.ranking === "object" &&
          (me.ranking.totalPosts != null || me.ranking.totalPoints != null);

        const rankField =
          metric === "activeWinStreak"
            ? new FieldPath("activeWinStreak")
            : hasRankingObj
              ? metric === "winRate"
                ? new FieldPath("ranking", "winRate")
                : new FieldPath("ranking", metric)
              : metric === "winRate"
                ? "winRate"
                : metric;

        const higherSnap = await db()
          .collection("cumulative_stats")
          .where(rankField as any, ">", myValue)
          .count()
          .get();

        myRank = (higherSnap.data().count ?? 0) + 1;

        myRow = {
          uid,
          displayName: me.displayName ?? "",
          handle: me.handle ?? null,
          photoURL: me.photoURL ?? null,
          countryCode: me.countryCode ?? null,

          totalPosts: rk.totalPosts,
          totalWins: rk.totalWins,
          winRate: rk.winRate,

          totalPoints: rk.totalPoints,
          totalPrecision: rk.totalPrecision,
          totalUpset: rk.totalUpset,
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