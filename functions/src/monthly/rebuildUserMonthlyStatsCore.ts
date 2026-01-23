// src/monthly/rebuildUserMonthlyStatsCore.ts

import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { judgeLevels } from "../stats/analysis/judgeLevel";
import { judgeAnalysisType } from "../stats/analysis/judgeAnalysisType";
import { buildMonthlyGlobalStats } from "./buildMonthlyGlobalStats";

/* ============================================================================
 * Firestore
 * ============================================================================
 */
function db() {
  return getFirestore();
}

/* ============================================================================
 * JST Date Utils
 * ============================================================================
 */
function toDateKeyJst(d: Date): string {
  const j = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const y = j.getUTCFullYear();
  const m = String(j.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(j.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

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
    id: `${year}-${String(month + 1).padStart(2, "0")}`,
  };
}

/* ============================================================================
 * Types
 * ============================================================================
 */
type Agg = {
  posts: number;
  wins: number;
  brierSum: number;
  precisionSum: number;
  upsetHit: number;
  upsetOpp: number;
  upsetPick: number;
  leaguePosts: Record<string, number>;
};

/* ============================================================================
 * Radar Normalize (0–10)
 * ============================================================================
 */
function clamp10(v: number) {
  return Math.max(0, Math.min(10, Math.round(v)));
}

function toRadar10(params: {
  winRate: number;
  accuracy: number;
  avgPrecision: number;
  avgUpset: number;
  streakScore: number;
  marketScore: number;
}) {
  return {
    winRate: clamp10(params.winRate * 10),
    accuracy: clamp10(params.accuracy * 10),
    precision: clamp10((params.avgPrecision / 15) * 10),
    upset: clamp10(params.avgUpset * 10),
    streak: clamp10(params.streakScore),
    market: clamp10(params.marketScore),
  };
}

/* ============================================================================
 * Percentile Utils
 * ============================================================================
 */
function percentile(sorted: number[], value: number) {
  if (sorted.length === 0) return 0;

  let below = 0;
  let equal = 0;

  for (const v of sorted) {
    if (v < value) below++;
    else if (v === value) equal++;
  }

  return Math.round(((below + equal * 0.5) / sorted.length) * 100);
}

/* ============================================================================
 * Main League Utils
 * ============================================================================
 */
function getMainLeague(leaguePosts: Record<string, number>) {
  let maxLeague: string | null = null;
  let maxPosts = 0;

  for (const [league, posts] of Object.entries(leaguePosts)) {
    if (posts > maxPosts) {
      maxPosts = posts;
      maxLeague = league;
    }
  }

  return maxLeague;
}

/* ============================================================================
 * Streak Utils
 * ============================================================================
 */
function calcStreak(results: { settledAt: Date; isWin: boolean }[]) {
  const sorted = [...results].sort(
    (a, b) => a.settledAt.getTime() - b.settledAt.getTime()
  );

  let curWin = 0;
  let maxWin = 0;
  let curLose = 0;
  let maxLose = 0;

  for (const r of sorted) {
    if (r.isWin) {
      curWin++;
      curLose = 0;
      if (curWin > maxWin) maxWin = curWin;
    } else {
      curLose++;
      curWin = 0;
      if (curLose > maxLose) maxLose = curLose;
    }
  }

  return { maxWin, maxLose };
}

/* ============================================================================
 * Core
 * ============================================================================
 */
export async function rebuildUserMonthlyStatsCore() {
  const range = getPreviousMonthRange();

  const startDate = toDateKeyJst(range.start);
  const endDate = toDateKeyJst(range.end);

  const snap = await db()
    .collection("user_stats_v2_daily")
    .where("date", ">=", startDate)
    .where("date", "<=", endDate)
    .get();

  const map = new Map<string, Agg>();

  for (const doc of snap.docs) {
    const d = doc.data();
    const uid = doc.id.split("_")[0];
    if (!uid) continue;

    const stats = d.all;
    if (!stats) continue;

    if (!map.has(uid)) {
      map.set(uid, {
        posts: 0,
        wins: 0,
        brierSum: 0,
        precisionSum: 0,
        upsetHit: 0,
        upsetOpp: 0,
        upsetPick: 0,
        leaguePosts: {},
      });
    }

    const agg = map.get(uid)!;
    agg.posts += stats.posts ?? 0;
    agg.wins += stats.wins ?? 0;
    agg.brierSum += stats.brierSum ?? 0;
    agg.precisionSum += stats.scorePrecisionSum ?? 0;
    agg.upsetHit += stats.upsetHitCount ?? 0;
    agg.upsetOpp += stats.upsetOpportunityCount ?? 0;
    agg.upsetPick += stats.upsetPickCount ?? 0;

    for (const [league, lstat] of Object.entries(d.leagues ?? {})) {
      const p = (lstat as any)?.posts ?? 0;
      agg.leaguePosts[league] = (agg.leaguePosts[league] ?? 0) + p;
    }
  }

  const rows = Array.from(map.entries())
    .map(([uid, agg]) => {
      if (agg.posts === 0) return null;

      const winRate = agg.wins / agg.posts;
      const accuracy = 1 - agg.brierSum / agg.posts;
      const avgPrecision = agg.precisionSum / agg.posts;
      const avgUpset =
        agg.upsetOpp >= 5 ? agg.upsetHit / agg.upsetOpp : 0;

      return {
        uid,
        posts: agg.posts,
        winRate,
        accuracy,
        avgPrecision,
        avgUpset,
        leaguePosts: agg.leaguePosts,
      };
    })
    .filter(Boolean) as {
    uid: string;
    posts: number;
    winRate: number;
    accuracy: number;
    avgPrecision: number;
    avgUpset: number;
    leaguePosts: Record<string, number>;
  }[];

  const winRates = rows.map(r => r.winRate).sort((a, b) => a - b);
  const accuracies = rows.map(r => r.accuracy).sort((a, b) => a - b);
  const precisions = rows.map(r => r.avgPrecision).sort((a, b) => a - b);
  const upsets = rows.map(r => r.avgUpset).sort((a, b) => a - b);

  const leagueVolumeMap: Record<string, number[]> = {};
  for (const r of rows) {
    for (const [league, p] of Object.entries(r.leaguePosts)) {
      leagueVolumeMap[league] ??= [];
      leagueVolumeMap[league].push(p);
    }
  }
  for (const v of Object.values(leagueVolumeMap)) v.sort((a, b) => a - b);

  const postSnap = await db()
    .collection("posts")
    .where("status", "==", "final")
    .where("settledAt", ">=", range.start)
    .where("settledAt", "<=", range.end)
    .get();

const postAggMap: Record<
  string,
  {
    homeAway: {
      home: { posts: number; wins: number };
      away: { posts: number; wins: number };
    };
    teamMap: Record<string, { posts: number; wins: number }>;
    results: { settledAt: Date; isWin: boolean }[];
favoritePickCount: number;
underdogPickCount: number;
favoritePickRatioSum: number;

favoriteWins: number;    // ★順当で勝った数
underdogWins: number;    // ★逆張りで勝った数
  }
> = {};

  for (const doc of postSnap.docs) {
    const p = doc.data();
    const uid = p.authorUid;
    if (!uid) continue;

postAggMap[uid] ??= {
  homeAway: {
    home: { posts: 0, wins: 0 },
    away: { posts: 0, wins: 0 },
  },
  teamMap: {},
  results: [],

  favoritePickCount: 0,
  underdogPickCount: 0,
  favoritePickRatioSum: 0,

    favoriteWins: 0,    // ★追加
  underdogWins: 0,    // ★追加
};

    const agg = postAggMap[uid];
    const pick = p.prediction?.winner;

    const market = p.marketMeta; // majoritySide / majorityRatio が入っている前提
    const isWin = p.stats?.isWin === true;

/* ===== market 集計 ===== */
if (market && pick) {
  if (pick === market.majoritySide) {
    agg.favoritePickCount++;
    if (isWin) agg.favoriteWins++;
    agg.favoritePickRatioSum += market.majorityRatio;
  } else {
    agg.underdogPickCount++;
    if (isWin) agg.underdogWins++;
  }
}

    if (pick === "home") {
      agg.homeAway.home.posts++;
      if (isWin) agg.homeAway.home.wins++;
    } else if (pick === "away") {
      agg.homeAway.away.posts++;
      if (isWin) agg.homeAway.away.wins++;
    }

    if (p.settledAt) {
      agg.results.push({
        settledAt: p.settledAt.toDate(),
        isWin,
      });
    }

    const teamId =
      pick === "home"
        ? p.home?.teamId
        : pick === "away"
        ? p.away?.teamId
        : null;

    if (!teamId) continue;

    agg.teamMap[teamId] ??= { posts: 0, wins: 0 };
    agg.teamMap[teamId].posts++;
    if (isWin) agg.teamMap[teamId].wins++;
  }

  const batch = db().batch();

  for (const row of rows) {
    const postAgg = postAggMap[row.uid];
    const streak = postAgg ? calcStreak(postAgg.results) : { maxWin: 0, maxLose: 0 };

    const homeAway = postAgg
      ? {
          home: {
            posts: postAgg.homeAway.home.posts,
            wins: postAgg.homeAway.home.wins,
            winRate:
              postAgg.homeAway.home.posts > 0
                ? postAgg.homeAway.home.wins /
                  postAgg.homeAway.home.posts
                : 0,
          },
          away: {
            posts: postAgg.homeAway.away.posts,
            wins: postAgg.homeAway.away.wins,
            winRate:
              postAgg.homeAway.away.posts > 0
                ? postAgg.homeAway.away.wins /
                  postAgg.homeAway.away.posts
                : 0,
          },
        }
      : {
          home: { posts: 0, wins: 0, winRate: 0 },
          away: { posts: 0, wins: 0, winRate: 0 },
        };

    const teams = postAgg
      ? Object.entries(postAgg.teamMap)
          .map(([teamId, v]) => ({
            teamId,
            posts: v.posts,
            wins: v.wins,
            winRate: v.wins / v.posts,
          }))
          .filter(t => t.posts >= 5)
          .sort((a, b) =>
            b.winRate !== a.winRate
              ? b.winRate - a.winRate
              : b.posts - a.posts
          )
      : [];

    const strong = teams.slice(0, 3);
    const strongIds = new Set(strong.map(t => t.teamId));
    const weak = teams.filter(t => !strongIds.has(t.teamId)).slice(-3).reverse();

    const agg = map.get(row.uid)!;

    const mainLeague = getMainLeague(agg.leaguePosts);
    const volumeMainLeague = mainLeague
      ? percentile(
          leagueVolumeMap[mainLeague] ?? [],
          agg.leaguePosts[mainLeague]
        )
      : 0;

    const percentiles = {
      winRate: percentile(winRates, row.winRate),
      accuracy: percentile(accuracies, row.accuracy),
      precision: percentile(precisions, row.avgPrecision),
      upset: percentile(upsets, row.avgUpset),
      volume: volumeMainLeague,
      volumeByLeague: Object.fromEntries(
        Object.entries(agg.leaguePosts).map(([league, p]) => [
          league,
          percentile(leagueVolumeMap[league] ?? [], p),
        ])
      ),
    };

// ① market 集計
const marketAgg = postAggMap[row.uid] ?? {
  favoritePickCount: 0,
  underdogPickCount: 0,
  favoritePickRatioSum: 0,
  favoriteWins: 0,
  underdogWins: 0,
};

const totalMarketPicks =
  marketAgg.favoritePickCount + marketAgg.underdogPickCount;

const favoritePickRate =
  totalMarketPicks > 0
    ? marketAgg.favoritePickCount / totalMarketPicks
    : 0;

    /* ★順当勝率 */
const favoriteWinRate =
  marketAgg.favoritePickCount > 0
    ? marketAgg.favoriteWins / marketAgg.favoritePickCount
    : 0;

/* ★逆張り勝率 */
const underdogWinRate =
  marketAgg.underdogPickCount > 0
    ? marketAgg.underdogWins / marketAgg.underdogPickCount
    : 0;

const avgMarketMajorityRatioPicked =
  marketAgg.favoritePickCount > 0
    ? marketAgg.favoritePickRatioSum / marketAgg.favoritePickCount
    : 0;

// ② streak / market → 0–10
const streakScore =
  clamp10((streak.maxWin / (streak.maxWin + streak.maxLose + 1)) * 10);

const marketScore =
  clamp10(favoritePickRate * 10);

// ③ radar10 作成
const radar10 = {
  ...toRadar10({
    ...row,
    streakScore,
    marketScore,
  }),
  volume: clamp10(percentiles.volume / 10),
};

// ④ 判定系（ここで初めて使う）
const levelSummary = judgeLevels(radar10);
const analysisTypeId = judgeAnalysisType(levelSummary);





    const ref = db()
      .collection("user_stats_v2_monthly")
      .doc(`${row.uid}_${range.id}`);

    batch.set(ref, {
      uid: row.uid,
      month: range.id,
      raw: {
        posts: agg.posts,
        wins: agg.wins,
        winRate: row.winRate,
        accuracy: row.accuracy,
        avgPrecision: row.avgPrecision,
        avgUpset: row.avgUpset,
        upsetOpportunity: agg.upsetOpp,
        upsetPick: agg.upsetPick,
        upsetHit: agg.upsetHit,
        leaguePosts: agg.leaguePosts,
      },
       marketBias: {
    favoritePickCount: marketAgg.favoritePickCount,
    underdogPickCount: marketAgg.underdogPickCount,
      favoritePickRate,        // 構造比（順当）
  favoriteWinRate,         // ★順当勝率
  underdogWinRate,         // ★逆張り勝率
    avgMarketMajorityRatioPicked,   // 例: 0.76
  },
      radar10,
      percentiles,
      homeAway,
      teamStats: { strong, weak },
      streak,
      analysisTypeId,
      analysisLevels: levelSummary.levels,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  await batch.commit();
  await buildMonthlyGlobalStats(rows, range.id);

  return { month: range.id, users: rows.length };
}
