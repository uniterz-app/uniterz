// functions/src/leaderboards/monthly.ts

import { onSchedule } from "firebase-functions/v2/scheduler";
import { onRequest } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

function db() {
  return getFirestore();
}

const LEAGUES = ["bj", "j1", "nba", "pl"] as const;

const MIN_POSTS_BY_LEAGUE: Record<string, number> = {
  nba: 30,
  bj: 25,
  j1: 20,
  pl: 20,
};

type MonthlyAgg = {
  posts: number;
  wins: number;
  totalPoints: number;
  totalPrecision: number;
  totalUpset: number;
};

type MonthlyLeaderboardRow = {
  uid: string;
  handle: string | null;
  displayName: string;
  photoURL: string | null;

  league: string;
  posts: number;
  wins: number;

  winRate: number;

  totalPoints: number;
  avgPointsV3: number;

  totalPrecision: number;
  avgPrecision: number;

  totalUpset: number;
  avgUpset: number;
};

function getPreviousMonthRange() {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);

  const year = jst.getMonth() === 0 ? jst.getFullYear() - 1 : jst.getFullYear();
  const month = jst.getMonth() === 0 ? 11 : jst.getMonth() - 1;

  const start = new Date(year, month, 1, 0, 0, 0, 0);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);

  return {
    start,
    end,
    month: `${year}-${String(month + 1).padStart(2, "0")}`,
  };
}

function toDateKeyJST(d: Date) {
  const j = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const y = j.getUTCFullYear();
  const m = String(j.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(j.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function topN<T extends Record<string, any>>(rows: T[], key: keyof T, n = 10) {
  return [...rows]
    .sort((a, b) => {
      const diff = Number(b[key] ?? 0) - Number(a[key] ?? 0);
      if (diff !== 0) return diff;

      if (key === "winRate") {
        const postsDiff = Number(b.posts ?? 0) - Number(a.posts ?? 0);
        if (postsDiff !== 0) return postsDiff;
      }

      return Number(b.totalPoints ?? 0) - Number(a.totalPoints ?? 0);
    })
    .slice(0, n)
    .map((row, index) => ({
      ...row,
      rank: index + 1,
    }));
}

async function buildMonthlyLeaderboard(league: string) {
  const { start, end, month } = getPreviousMonthRange();

  const startDate = toDateKeyJST(start);
  const endDate = toDateKeyJST(end);
  const minPosts = MIN_POSTS_BY_LEAGUE[league] ?? 20;

  const ref = db().collection("leaderboards_monthly").doc(`${league}_${month}`);

  await ref.set(
    {
      kind: "month",
      league,
      month,
      startAtJst: start,
      endAtJst: end,
      minPosts,
      rebuiltAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  const statsSnap = await db()
    .collection("user_stats_v2_daily")
    .where("date", ">=", startDate)
    .where("date", "<=", endDate)
    .get();

  const map = new Map<string, MonthlyAgg>();

  for (const doc of statsSnap.docs) {
    const d = doc.data();
    const uid = doc.id.split("_")[0];
    if (!uid) continue;

    const leagueStats = d.leagues?.[league];
    if (!leagueStats) continue;

    if (!map.has(uid)) {
      map.set(uid, {
        posts: 0,
        wins: 0,
        totalPoints: 0,
        totalPrecision: 0,
        totalUpset: 0,
      });
    }

    const agg = map.get(uid)!;
    agg.posts += leagueStats.posts ?? 0;
    agg.wins += leagueStats.wins ?? 0;
    agg.totalPoints += leagueStats.pointsSumV3 ?? 0;
    agg.totalPrecision += leagueStats.scorePrecisionSum ?? 0;
    agg.totalUpset += leagueStats.upsetPointsSum ?? 0;
  }

  const rows: MonthlyLeaderboardRow[] = [];

  for (const [uid, agg] of map.entries()) {
    if (agg.posts < minPosts) continue;

    const userSnap = await db().collection("users").doc(uid).get();
    const user = userSnap.exists ? userSnap.data() : {};

    rows.push({
      uid,
      handle: user?.handle ?? null,
      displayName: user?.displayName ?? "user",
      photoURL: user?.photoURL ?? null,

      league,
      posts: agg.posts,
      wins: agg.wins,

      winRate: agg.posts > 0 ? agg.wins / agg.posts : 0,

      totalPoints: agg.totalPoints,
      avgPointsV3: agg.posts > 0 ? agg.totalPoints / agg.posts : 0,

      totalPrecision: agg.totalPrecision,
      avgPrecision: agg.posts > 0 ? agg.totalPrecision / agg.posts : 0,

      totalUpset: agg.totalUpset,
      avgUpset: agg.posts > 0 ? agg.totalUpset / agg.posts : 0,
    });
  }

  const top10 = {
    totalPoints: topN(rows, "totalPoints"),
    winRate: topN(rows, "winRate"),
    totalPrecision: topN(rows, "totalPrecision"),
    totalUpset: topN(rows, "totalUpset"),
  };

  await ref.set(
    {
      users: rows.length,
      rows,
      top10,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return {
    ok: true,
    league,
    month,
    users: rows.length,
  };
}

export const rebuildMonthlyLeaderboardsHttp = onRequest(async (req, res) => {
  try {
    const league =
      typeof req.query.league === "string" ? req.query.league : "nba";

    const result = await buildMonthlyLeaderboard(league);
    res.status(200).json(result);
  } catch (e: any) {
    res.status(500).json({
      ok: false,
      error: e?.message ?? "failed",
    });
  }
});

export const rebuildMonthlyLeaderboardsCron = onSchedule(
  { schedule: "0 1 1 * *", timeZone: "Asia/Tokyo" },
  async () => {
    for (const league of LEAGUES) {
      await buildMonthlyLeaderboard(league);
    }
  }
);