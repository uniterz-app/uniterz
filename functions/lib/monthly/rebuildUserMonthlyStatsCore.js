"use strict";
// src/monthly/rebuildUserMonthlyStatsCore.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.rebuildUserMonthlyStatsCore = rebuildUserMonthlyStatsCore;
const firestore_1 = require("firebase-admin/firestore");
const judgeLevel_1 = require("../stats/analysis/judgeLevel");
const judgeAnalysisType_1 = require("../stats/analysis/judgeAnalysisType");
const buildMonthlyGlobalStats_1 = require("./buildMonthlyGlobalStats");
/* ============================================================================
 * Firestore
 * ============================================================================
 */
function db() {
    return (0, firestore_1.getFirestore)();
}
/* ============================================================================
 * JST Date Utils
 * ============================================================================
 */
function toDateKeyJst(d) {
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
 * Radar (0–10): 当月・投稿10件以上ユーザーを母集団としたパーセンタイル
 * ============================================================================
 */
const MIN_POSTS_FOR_RADAR = 10;
/** 耐性 raw 計算で連勝・連敗の寄与を頭打ちする長さ */
const STREAK_RUN_CAP = 10;
function clamp10(v) {
    return Math.max(0, Math.min(10, Math.round(v)));
}
/* ============================================================================
 * Percentile Utils
 * ============================================================================
 */
function percentile(sorted, value) {
    if (sorted.length === 0)
        return 0;
    let below = 0;
    let equal = 0;
    for (const v of sorted) {
        if (v < value)
            below++;
        else if (v === value)
            equal++;
    }
    return Math.round(((below + equal * 0.5) / sorted.length) * 100);
}
/* ============================================================================
 * Main League Utils
 * ============================================================================
 */
function getMainLeague(leaguePosts) {
    let maxLeague = null;
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
function calcStreak(results) {
    const sorted = [...results].sort((a, b) => a.settledAt.getTime() - b.settledAt.getTime());
    let curWin = 0;
    let maxWin = 0;
    let curLose = 0;
    let maxLose = 0;
    for (const r of sorted) {
        if (r.isWin) {
            curWin++;
            curLose = 0;
            if (curWin > maxWin)
                maxWin = curWin;
        }
        else {
            curLose++;
            curWin = 0;
            if (curLose > maxLose)
                maxLose = curLose;
        }
    }
    return { maxWin, maxLose };
}
/* ============================================================================
 * Core
 * ============================================================================
 */
async function rebuildUserMonthlyStatsCore() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3;
    var _4;
    const range = getPreviousMonthRange();
    const startDate = toDateKeyJst(range.start);
    const endDate = toDateKeyJst(range.end);
    const snap = await db()
        .collection("user_stats_v2_daily")
        .where("date", ">=", startDate)
        .where("date", "<=", endDate)
        .get();
    const map = new Map();
    for (const doc of snap.docs) {
        const d = doc.data();
        const uid = doc.id.split("_")[0];
        if (!uid)
            continue;
        const stats = d.all;
        if (!stats)
            continue;
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
        const agg = map.get(uid);
        agg.posts += (_a = stats.posts) !== null && _a !== void 0 ? _a : 0;
        agg.wins += (_b = stats.wins) !== null && _b !== void 0 ? _b : 0;
        agg.brierSum += (_c = stats.brierSum) !== null && _c !== void 0 ? _c : 0;
        agg.precisionSum += (_d = stats.scorePrecisionSum) !== null && _d !== void 0 ? _d : 0;
        agg.upsetHit += (_e = stats.upsetHitCount) !== null && _e !== void 0 ? _e : 0;
        agg.upsetOpp += (_f = stats.upsetOpportunityCount) !== null && _f !== void 0 ? _f : 0;
        agg.upsetPick += (_g = stats.upsetPickCount) !== null && _g !== void 0 ? _g : 0;
        agg.upsetPointsSum += (_h = stats.upsetPointsSum) !== null && _h !== void 0 ? _h : 0;
        agg.pointsSumV3 += (_j = stats.pointsSumV3) !== null && _j !== void 0 ? _j : 0;
        agg.upsetBonusSum += (_k = stats.upsetBonusSum) !== null && _k !== void 0 ? _k : 0;
        agg.streakBonusSum += (_l = stats.streakBonusSum) !== null && _l !== void 0 ? _l : 0;
        for (const [league, lstat] of Object.entries((_m = d.leagues) !== null && _m !== void 0 ? _m : {})) {
            const p = (_o = lstat === null || lstat === void 0 ? void 0 : lstat.posts) !== null && _o !== void 0 ? _o : 0;
            agg.leaguePosts[league] = ((_p = agg.leaguePosts[league]) !== null && _p !== void 0 ? _p : 0) + p;
        }
    }
    const rows = Array.from(map.entries())
        .map(([uid, agg]) => {
        if (agg.posts === 0)
            return null;
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
        .filter(Boolean);
    const sortedByPointsSum = [...rows].sort((a, b) => b.pointsSumV3 - a.pointsSumV3);
    const pointsSumV3RankByUid = new Map();
    {
        let rank = 1;
        for (let i = 0; i < sortedByPointsSum.length; i++) {
            const row = sortedByPointsSum[i];
            if (i > 0 &&
                row.pointsSumV3 < sortedByPointsSum[i - 1].pointsSumV3) {
                rank = i + 1;
            }
            pointsSumV3RankByUid.set(row.uid, rank);
        }
    }
    const winRates = rows.map((r) => r.winRate).sort((a, b) => a - b);
    const precisions = rows.map((r) => r.avgPrecision).sort((a, b) => a - b);
    const pointsV3s = rows.map((r) => r.avgPointsV3).sort((a, b) => a - b);
    const upsetPointSums = rows
        .map((r) => r.upsetPointsSum)
        .sort((a, b) => a - b);
    const leagueVolumeMap = {};
    for (const r of rows) {
        for (const [league, p] of Object.entries(r.leaguePosts)) {
            (_q = leagueVolumeMap[league]) !== null && _q !== void 0 ? _q : (leagueVolumeMap[league] = []);
            leagueVolumeMap[league].push(p);
        }
    }
    for (const v of Object.values(leagueVolumeMap))
        v.sort((a, b) => a - b);
    const postSnap = await db()
        .collection("posts")
        .where("status", "==", "final")
        .where("settledAt", ">=", range.start)
        .where("settledAt", "<=", range.end)
        .get();
    const postAggMap = {};
    for (const doc of postSnap.docs) {
        const p = doc.data();
        const uid = p.authorUid;
        if (!uid)
            continue;
        (_r = postAggMap[uid]) !== null && _r !== void 0 ? _r : (postAggMap[uid] = {
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
        });
        const agg = postAggMap[uid];
        const pick = (_s = p.prediction) === null || _s === void 0 ? void 0 : _s.winner;
        const market = p.marketMeta;
        const isWin = ((_t = p.stats) === null || _t === void 0 ? void 0 : _t.isWin) === true;
        if (market && pick) {
            if (pick === market.majoritySide) {
                agg.favoritePickCount++;
                if (isWin)
                    agg.favoriteWins++;
                agg.favoritePickRatioSum += market.majorityRatio;
            }
            else {
                agg.underdogPickCount++;
                if (isWin)
                    agg.underdogWins++;
            }
        }
        if (pick === "home") {
            agg.homeAway.home.posts++;
            if (isWin)
                agg.homeAway.home.wins++;
        }
        else if (pick === "away") {
            agg.homeAway.away.posts++;
            if (isWin)
                agg.homeAway.away.wins++;
        }
        if (p.settledAt) {
            agg.results.push({
                settledAt: p.settledAt.toDate(),
                isWin,
            });
        }
        const teamId = pick === "home"
            ? (_u = p.home) === null || _u === void 0 ? void 0 : _u.teamId
            : pick === "away"
                ? (_v = p.away) === null || _v === void 0 ? void 0 : _v.teamId
                : null;
        if (!teamId)
            continue;
        (_w = (_4 = agg.teamMap)[teamId]) !== null && _w !== void 0 ? _w : (_4[teamId] = { posts: 0, wins: 0 });
        agg.teamMap[teamId].posts++;
        if (isWin)
            agg.teamMap[teamId].wins++;
    }
    const cohortRows = rows.filter((r) => r.posts >= MIN_POSTS_FOR_RADAR);
    const staminaRawByUid = new Map();
    for (const row of rows) {
        const postAgg = postAggMap[row.uid];
        const streak = postAgg
            ? calcStreak(postAgg.results)
            : { maxWin: 0, maxLose: 0 };
        staminaRawByUid.set(row.uid, 7 +
            Math.min(streak.maxWin, STREAK_RUN_CAP) * 0.35 -
            Math.min(streak.maxLose, STREAK_RUN_CAP) * 0.9);
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
        .map((r) => { var _a; return (_a = staminaRawByUid.get(r.uid)) !== null && _a !== void 0 ? _a : 0; })
        .sort((a, b) => a - b);
    const leagueVolumeMapCohort = {};
    for (const r of cohortRows) {
        for (const [league, p] of Object.entries(r.leaguePosts)) {
            (_x = leagueVolumeMapCohort[league]) !== null && _x !== void 0 ? _x : (leagueVolumeMapCohort[league] = []);
            leagueVolumeMapCohort[league].push(p);
        }
    }
    for (const v of Object.values(leagueVolumeMapCohort)) {
        v.sort((a, b) => a - b);
    }
    const batch = db().batch();
    for (const row of rows) {
        const postAgg = postAggMap[row.uid];
        const streak = postAgg
            ? calcStreak(postAgg.results)
            : { maxWin: 0, maxLose: 0 };
        const homeAway = postAgg
            ? {
                home: {
                    posts: postAgg.homeAway.home.posts,
                    wins: postAgg.homeAway.home.wins,
                    winRate: postAgg.homeAway.home.posts > 0
                        ? postAgg.homeAway.home.wins / postAgg.homeAway.home.posts
                        : 0,
                },
                away: {
                    posts: postAgg.homeAway.away.posts,
                    wins: postAgg.homeAway.away.wins,
                    winRate: postAgg.homeAway.away.posts > 0
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
                .sort((a, b) => b.winRate !== a.winRate ? b.winRate - a.winRate : b.posts - a.posts)
            : [];
        const strong = teams.slice(0, 3);
        const strongIds = new Set(strong.map((t) => t.teamId));
        const weak = teams
            .filter((t) => !strongIds.has(t.teamId))
            .slice(-3)
            .reverse();
        const agg = map.get(row.uid);
        const basePointsSum = Math.max(0, agg.pointsSumV3 - agg.upsetBonusSum - agg.streakBonusSum);
        const mainLeague = getMainLeague(agg.leaguePosts);
        const volumeMainLeague = mainLeague
            ? percentile((_y = leagueVolumeMap[mainLeague]) !== null && _y !== void 0 ? _y : [], agg.leaguePosts[mainLeague])
            : 0;
        const percentiles = {
            winRate: percentile(winRates, row.winRate),
            precision: percentile(precisions, row.avgPrecision),
            pointsV3: percentile(pointsV3s, row.avgPointsV3),
            upset: percentile(upsetPointSums, row.upsetPointsSum),
            volume: volumeMainLeague,
            volumeByLeague: Object.fromEntries(Object.entries(agg.leaguePosts).map(([league, p]) => {
                var _a;
                return [
                    league,
                    percentile((_a = leagueVolumeMap[league]) !== null && _a !== void 0 ? _a : [], p),
                ];
            })),
        };
        const marketAgg = (_z = postAggMap[row.uid]) !== null && _z !== void 0 ? _z : {
            favoritePickCount: 0,
            underdogPickCount: 0,
            favoritePickRatioSum: 0,
            favoriteWins: 0,
            underdogWins: 0,
        };
        const totalMarketPicks = marketAgg.favoritePickCount + marketAgg.underdogPickCount;
        const favoritePickRate = totalMarketPicks > 0
            ? marketAgg.favoritePickCount / totalMarketPicks
            : 0;
        const favoriteWinRate = marketAgg.favoritePickCount > 0
            ? marketAgg.favoriteWins / marketAgg.favoritePickCount
            : 0;
        const underdogWinRate = marketAgg.underdogPickCount > 0
            ? marketAgg.underdogWins / marketAgg.underdogPickCount
            : 0;
        const avgMarketMajorityRatioPicked = marketAgg.favoritePickCount > 0
            ? marketAgg.favoritePickRatioSum / marketAgg.favoritePickCount
            : 0;
        const radarEligible = row.posts >= MIN_POSTS_FOR_RADAR;
        const upsetValid = agg.upsetOpp >= 5;
        const radar10 = radarEligible
            ? {
                winRate: clamp10(percentile(winRatesCohort, row.winRate) / 10),
                precision: clamp10(percentile(precisionsCohort, row.avgPrecision) / 10),
                upset: clamp10(percentile(upsetPointSumsCohort, row.upsetPointsSum) / 10),
                volume: mainLeague
                    ? clamp10(percentile((_0 = leagueVolumeMapCohort[mainLeague]) !== null && _0 !== void 0 ? _0 : [], (_1 = agg.leaguePosts[mainLeague]) !== null && _1 !== void 0 ? _1 : 0) / 10)
                    : 0,
                streak: clamp10(percentile(staminaSorted, (_2 = staminaRawByUid.get(row.uid)) !== null && _2 !== void 0 ? _2 : 0) / 10),
                pointsV3: clamp10(percentile(pointsV3sCohort, row.avgPointsV3) / 10),
            }
            : {
                winRate: 0,
                precision: 0,
                upset: 0,
                volume: 0,
                streak: 0,
                pointsV3: 0,
            };
        const levelSummary = (0, judgeLevel_1.judgeLevels)(radar10);
        const analysisTypeId = (0, judgeAnalysisType_1.judgeAnalysisType)(levelSummary);
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
                pointsSumV3Rank: (_3 = pointsSumV3RankByUid.get(row.uid)) !== null && _3 !== void 0 ? _3 : null,
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
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        });
    }
    await batch.commit();
    await (0, buildMonthlyGlobalStats_1.buildMonthlyGlobalStats)(rows, range.id);
    return { month: range.id, users: rows.length };
}
//# sourceMappingURL=rebuildUserMonthlyStatsCore.js.map