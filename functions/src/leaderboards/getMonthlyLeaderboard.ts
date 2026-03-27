// functions/src/leaderboards/getMonthlyLeaderboard.ts

import { onRequest } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";

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
  countryCode?: string | null;

  league: string;
  posts: number;
  wins: number;

  winRate: number;
  totalPoints: number;
  totalPrecision: number;
  totalUpset: number;

  rank: number;
};

function isMetric(v: unknown): v is Metric {
  return (
    v === "winRate" ||
    v === "totalPoints" ||
    v === "totalPrecision" ||
    v === "totalUpset"
  );
}

export const getMonthlyLeaderboard = onRequest(async (req, res) => {
  try {
    const rawLeague = req.query.league;
    const rawMonth = req.query.month;
    const rawMetric = req.query.metric;

    const league =
      typeof rawLeague === "string" && rawLeague.trim()
        ? rawLeague.trim()
        : "nba";

    const month =
      typeof rawMonth === "string" && /^\d{4}-\d{2}$/.test(rawMonth)
        ? rawMonth
        : null;

    const metric: Metric = isMetric(rawMetric) ? rawMetric : "totalPoints";

    if (!month) {
      res.status(400).json({
        ok: false,
        error: "month is required (YYYY-MM)",
      });
      return;
    }

    const docId = `${league}_${month}_${metric}`;

    const snap = await db()
      .collection("monthly_leaderboard_snapshots")
      .doc(docId)
      .get();

    if (!snap.exists) {
      res.status(404).json({
        ok: false,
        error: "monthly leaderboard snapshot not found",
        league,
        month,
        metric,
      });
      return;
    }

    const data = snap.data() ?? {};
    const rows: MonthlyLeaderboardRow[] = Array.isArray(data.rows)
      ? data.rows
      : [];

    res.status(200).json({
      ok: true,
      league,
      month,
      metric,
      count: rows.length,
      rows,
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