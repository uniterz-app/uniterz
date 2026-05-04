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

  const year =
    jst.getMonth() === 0 ? jst.getFullYear() - 1 : jst.getFullYear();
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
  upsetPointsSum: number;
  pointsSumV3: number;
  upsetBonusSum: number;
  streakBonusSum: number;
  leaguePosts: Record<string, number>;
};

type MonthlyRow = {
  uid: string;
  posts: number;
  winRate: number;
  avgPrecision: number;
  avgPointsV3: number;
  upsetPointsSum: number;
  /** 月内総合得点（合計）— 全ユーザー中の順位計算用 */
  pointsSumV3: number;
  leaguePosts: Record<string, number>;
};

/* ============================================================================
 * Radar (0–10): 当月・投稿10件以上ユーザーを母集団としたパーセンタイル
 * ============================================================================
 */
const MIN_POSTS_FOR_RADAR = 10;
/** 耐性 raw 計算で連勝・連敗の寄与を頭打ちする長さ */
const STREAK_RUN_CAP = 10;

function clamp10(v: number) {
  return Math.max(0, Math.min(10, Math.round(v)));
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
        upsetPointsSum: 0,
        pointsSumV3: 0,
        upsetBonusSum: 0,
        streakBonusSum: 0,
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
    agg.upsetPointsSum += stats.upsetPointsSum ?? 0;
    agg.pointsSumV3 += stats.pointsSumV3 ?? 0;
    agg.upsetBonusSum += stats.upsetBonusSum ?? 0;
    agg.streakBonusSum += stats.streakBonusSum ?? 0;

    for (const [league, lstat] of Object.entries(d.leagues ?? {})) {
      const p = (lstat as any)?.posts ?? 0;
      agg.leaguePosts[league] = (agg.leaguePosts[league] ?? 0) + p;
    }
  }

  const rows = Array.from(map.entries())
    .map(([uid, agg]) => {
      if (agg.posts === 0) return null;

      const winRate = agg.wins / agg.posts;
      const avgPrecision = agg.precisionSum / agg.posts;
      const avgPointsV3 = agg.pointsSumV3 / agg.posts;

      return {
        uid,
        posts: agg.posts,
        winRate,
        avgPrecision,
        avgPointsV3,
        upsetPointsSum: agg.upsetPointsSum,
        pointsSumV3: agg.pointsSumV3,
        leaguePosts: agg.leaguePosts,
      };
    })
    .filter(Boolean) as MonthlyRow[];

  const sortedByPointsSum = [...rows].sort(
    (a, b) => b.pointsSumV3 - a.pointsSumV3
  );
  const pointsSumV3RankByUid = new Map<string, number>();
  {
    let rank = 1;
    for (let i = 0; i < sortedByPointsSum.length; i++) {
      const row = sortedByPointsSum[i];
      if (
        i > 0 &&
        row.pointsSumV3 < sortedByPointsSum[i - 1].pointsSumV3
      ) {
        rank = i + 1;
      }
      pointsSumV3RankByUid.set(row.uid, rank);
    }
  }

  /** 総合得点（合計）順位の母数＝当月に1件以上投稿があったユーザー数 */
  const pointsSumV3RankDenominator = sortedByPointsSum.length;

  const winRates = rows.map((r) => r.winRate).sort((a, b) => a - b);
  const precisions = rows.map((r) => r.avgPrecision).sort((a, b) => a - b);
  const pointsV3s = rows.map((r) => r.avgPointsV3).sort((a, b) => a - b);
  const upsetPointSums = rows
    .map((r) => r.upsetPointsSum)
    .sort((a, b) => a - b);

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
      favoriteWins: number;
      underdogWins: number;
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
      favoriteWins: 0,
      underdogWins: 0,
    };

    const agg = postAggMap[uid];
    const pick = p.prediction?.winner;
    const market = p.marketMeta;
    const isWin = p.stats?.isWin === true;

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

  const cohortRows = rows.filter((r) => r.posts >= MIN_POSTS_FOR_RADAR);

  const staminaRawByUid = new Map<string, number>();
  for (const row of rows) {
    const postAgg = postAggMap[row.uid];
    const streak = postAgg
      ? calcStreak(postAgg.results)
      : { maxWin: 0, maxLose: 0 };
    staminaRawByUid.set(
      row.uid,
      7 +
        Math.min(streak.maxWin, STREAK_RUN_CAP) * 0.35 -
        Math.min(streak.maxLose, STREAK_RUN_CAP) * 0.9
    );
  }

  const winRatesCohort = cohortRows
    .map((r) => r.winRate)
    .sort((a, b) => a - b);
  const precisionsCohort = cohortRows
    .map((r) => r.avgPrecision)
    .sort((a, b) => a - b);
  const pointsV3sCohort = cohortRows
    .map((r) => r.avgPointsV3)
    .sort((a, b) => a - b);
  const upsetPointSumsCohort = cohortRows
    .map((r) => r.upsetPointsSum)
    .sort((a, b) => a - b);
  const staminaSorted = cohortRows
    .map((r) => staminaRawByUid.get(r.uid) ?? 0)
    .sort((a, b) => a - b);

  const leagueVolumeMapCohort: Record<string, number[]> = {};
  for (const r of cohortRows) {
    for (const [league, p] of Object.entries(r.leaguePosts)) {
      leagueVolumeMapCohort[league] ??= [];
      leagueVolumeMapCohort[league].push(p);
    }
  }
  for (const v of Object.values(leagueVolumeMapCohort)) {
    v.sort((a, b) => a - b);
  }

  /** Firestore WriteBatch: 500 操作上限・合計サイズ上限。まとめすぎると INVALID_ARGUMENT Transaction too big */
  const WRITE_BATCH_LIMIT = 400;

  for (let offset = 0; offset < rows.length; offset += WRITE_BATCH_LIMIT) {
    const chunk = rows.slice(offset, offset + WRITE_BATCH_LIMIT);
    const batch = db().batch();

    for (const row of chunk) {
    const postAgg = postAggMap[row.uid];
    const streak = postAgg
      ? calcStreak(postAgg.results)
      : { maxWin: 0, maxLose: 0 };

    const homeAway = postAgg
      ? {
          home: {
            posts: postAgg.homeAway.home.posts,
            wins: postAgg.homeAway.home.wins,
            winRate:
              postAgg.homeAway.home.posts > 0
                ? postAgg.homeAway.home.wins / postAgg.homeAway.home.posts
                : 0,
          },
          away: {
            posts: postAgg.homeAway.away.posts,
            wins: postAgg.homeAway.away.wins,
            winRate:
              postAgg.homeAway.away.posts > 0
                ? postAgg.homeAway.away.wins / postAgg.homeAway.away.posts
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
          .filter((t) => t.posts >= 5)
          .sort((a, b) =>
            b.winRate !== a.winRate ? b.winRate - a.winRate : b.posts - a.posts
          )
      : [];

    const strong = teams.slice(0, 3);
    const strongIds = new Set(strong.map((t) => t.teamId));
    const weak = teams
      .filter((t) => !strongIds.has(t.teamId))
      .slice(-3)
      .reverse();

    const agg = map.get(row.uid)!;

    const basePointsSum = Math.max(
      0,
      agg.pointsSumV3 - agg.upsetBonusSum - agg.streakBonusSum
    );

    const mainLeague = getMainLeague(agg.leaguePosts);
    const volumeMainLeague = mainLeague
      ? percentile(
          leagueVolumeMap[mainLeague] ?? [],
          agg.leaguePosts[mainLeague]
        )
      : 0;

    const percentiles = {
      winRate: percentile(winRates, row.winRate),
      precision: percentile(precisions, row.avgPrecision),
      pointsV3: percentile(pointsV3s, row.avgPointsV3),
      upset: percentile(upsetPointSums, row.upsetPointsSum),
      volume: volumeMainLeague,
      volumeByLeague: Object.fromEntries(
        Object.entries(agg.leaguePosts).map(([league, p]) => [
          league,
          percentile(leagueVolumeMap[league] ?? [], p),
        ])
      ),
    };

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

    const favoriteWinRate =
      marketAgg.favoritePickCount > 0
        ? marketAgg.favoriteWins / marketAgg.favoritePickCount
        : 0;

    const underdogWinRate =
      marketAgg.underdogPickCount > 0
        ? marketAgg.underdogWins / marketAgg.underdogPickCount
        : 0;

    const avgMarketMajorityRatioPicked =
      marketAgg.favoritePickCount > 0
        ? marketAgg.favoritePickRatioSum / marketAgg.favoritePickCount
        : 0;

    const radarEligible = row.posts >= MIN_POSTS_FOR_RADAR;
    const upsetValid = agg.upsetOpp >= 5;

    const radar10 = radarEligible
      ? {
          winRate: clamp10(percentile(winRatesCohort, row.winRate) / 10),
          precision: clamp10(
            percentile(precisionsCohort, row.avgPrecision) / 10
          ),
          upset: clamp10(
            percentile(upsetPointSumsCohort, row.upsetPointsSum) / 10
          ),
          volume: mainLeague
            ? clamp10(
                percentile(
                  leagueVolumeMapCohort[mainLeague] ?? [],
                  agg.leaguePosts[mainLeague] ?? 0
                ) / 10
              )
            : 0,
          streak: clamp10(
            percentile(
              staminaSorted,
              staminaRawByUid.get(row.uid) ?? 0
            ) / 10
          ),
          pointsV3: clamp10(
            percentile(pointsV3sCohort, row.avgPointsV3) / 10
          ),
        }
      : {
          winRate: 0,
          precision: 0,
          upset: 0,
          volume: 0,
          streak: 0,
          pointsV3: 0,
        };

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
        avgPrecision: row.avgPrecision,
        avgPointsV3: row.avgPointsV3,
        /** 月内スコア精度の合計（平均は avgPrecision） */
        scorePrecisionSum: agg.precisionSum,
        /** 月内総合得点の合計（平均は avgPointsV3） */
        pointsSumV3: agg.pointsSumV3,
        basePointsSum,
        upsetBonusSum: agg.upsetBonusSum,
        streakBonusSum: agg.streakBonusSum,
        upsetPointsSum: agg.upsetPointsSum,
        upsetOpportunity: agg.upsetOpp,
        upsetPick: agg.upsetPick,
        upsetHit: agg.upsetHit,
        leaguePosts: agg.leaguePosts,
        /** 当月の総合得点（合計）による全ユーザー中の順位（同点は繰り上がり順位） */
        pointsSumV3Rank: pointsSumV3RankByUid.get(row.uid) ?? null,
        /** 上記順位の分母（当月投稿ありユーザー数）。過去ドキュメントには無い場合あり */
        pointsSumV3RankDenominator:
          pointsSumV3RankDenominator > 0 ? pointsSumV3RankDenominator : null,
      },
      marketBias: {
        favoritePickCount: marketAgg.favoritePickCount,
        underdogPickCount: marketAgg.underdogPickCount,
        favoritePickRate,
        favoriteWinRate,
        underdogWinRate,
        avgMarketMajorityRatioPicked,
      },
      radar10,
      radarEligible,
      upsetValid,
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
  }

  await buildMonthlyGlobalStats(rows, range.id);

  return { month: range.id, users: rows.length };
}