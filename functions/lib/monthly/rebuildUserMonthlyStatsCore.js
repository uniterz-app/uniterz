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
 * Radar Normalize (0–10)
 * ============================================================================
 */
function clamp10(v) {
    return Math.max(0, Math.min(10, Math.round(v)));
}
function toRadar10(params) {
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
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u;
    var _v;
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
        for (const [league, lstat] of Object.entries((_h = d.leagues) !== null && _h !== void 0 ? _h : {})) {
            const p = (_j = lstat === null || lstat === void 0 ? void 0 : lstat.posts) !== null && _j !== void 0 ? _j : 0;
            agg.leaguePosts[league] = ((_k = agg.leaguePosts[league]) !== null && _k !== void 0 ? _k : 0) + p;
        }
    }
    const rows = Array.from(map.entries())
        .map(([uid, agg]) => {
        if (agg.posts === 0)
            return null;
        const winRate = agg.wins / agg.posts;
        const accuracy = 1 - agg.brierSum / agg.posts;
        const avgPrecision = agg.precisionSum / agg.posts;
        const avgUpset = agg.upsetOpp >= 5 ? agg.upsetHit / agg.upsetOpp : 0;
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
        .filter(Boolean);
    const winRates = rows.map(r => r.winRate).sort((a, b) => a - b);
    const accuracies = rows.map(r => r.accuracy).sort((a, b) => a - b);
    const precisions = rows.map(r => r.avgPrecision).sort((a, b) => a - b);
    const upsets = rows.map(r => r.avgUpset).sort((a, b) => a - b);
    const leagueVolumeMap = {};
    for (const r of rows) {
        for (const [league, p] of Object.entries(r.leaguePosts)) {
            (_l = leagueVolumeMap[league]) !== null && _l !== void 0 ? _l : (leagueVolumeMap[league] = []);
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
        (_m = postAggMap[uid]) !== null && _m !== void 0 ? _m : (postAggMap[uid] = {
            homeAway: {
                home: { posts: 0, wins: 0 },
                away: { posts: 0, wins: 0 },
            },
            teamMap: {},
            results: [],
            favoritePickCount: 0,
            underdogPickCount: 0,
            favoritePickRatioSum: 0,
            favoriteWins: 0, // ★追加
            underdogWins: 0, // ★追加
        });
        const agg = postAggMap[uid];
        const pick = (_o = p.prediction) === null || _o === void 0 ? void 0 : _o.winner;
        const market = p.marketMeta; // majoritySide / majorityRatio が入っている前提
        const isWin = ((_p = p.stats) === null || _p === void 0 ? void 0 : _p.isWin) === true;
        /* ===== market 集計 ===== */
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
            ? (_q = p.home) === null || _q === void 0 ? void 0 : _q.teamId
            : pick === "away"
                ? (_r = p.away) === null || _r === void 0 ? void 0 : _r.teamId
                : null;
        if (!teamId)
            continue;
        (_s = (_v = agg.teamMap)[teamId]) !== null && _s !== void 0 ? _s : (_v[teamId] = { posts: 0, wins: 0 });
        agg.teamMap[teamId].posts++;
        if (isWin)
            agg.teamMap[teamId].wins++;
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
                    winRate: postAgg.homeAway.home.posts > 0
                        ? postAgg.homeAway.home.wins /
                            postAgg.homeAway.home.posts
                        : 0,
                },
                away: {
                    posts: postAgg.homeAway.away.posts,
                    wins: postAgg.homeAway.away.wins,
                    winRate: postAgg.homeAway.away.posts > 0
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
                .sort((a, b) => b.winRate !== a.winRate
                ? b.winRate - a.winRate
                : b.posts - a.posts)
            : [];
        const strong = teams.slice(0, 3);
        const strongIds = new Set(strong.map(t => t.teamId));
        const weak = teams.filter(t => !strongIds.has(t.teamId)).slice(-3).reverse();
        const agg = map.get(row.uid);
        const mainLeague = getMainLeague(agg.leaguePosts);
        const volumeMainLeague = mainLeague
            ? percentile((_t = leagueVolumeMap[mainLeague]) !== null && _t !== void 0 ? _t : [], agg.leaguePosts[mainLeague])
            : 0;
        const percentiles = {
            winRate: percentile(winRates, row.winRate),
            accuracy: percentile(accuracies, row.accuracy),
            precision: percentile(precisions, row.avgPrecision),
            upset: percentile(upsets, row.avgUpset),
            volume: volumeMainLeague,
            volumeByLeague: Object.fromEntries(Object.entries(agg.leaguePosts).map(([league, p]) => {
                var _a;
                return [
                    league,
                    percentile((_a = leagueVolumeMap[league]) !== null && _a !== void 0 ? _a : [], p),
                ];
            })),
        };
        // ① market 集計
        const marketAgg = (_u = postAggMap[row.uid]) !== null && _u !== void 0 ? _u : {
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
        /* ★順当勝率 */
        const favoriteWinRate = marketAgg.favoritePickCount > 0
            ? marketAgg.favoriteWins / marketAgg.favoritePickCount
            : 0;
        /* ★逆張り勝率 */
        const underdogWinRate = marketAgg.underdogPickCount > 0
            ? marketAgg.underdogWins / marketAgg.underdogPickCount
            : 0;
        const avgMarketMajorityRatioPicked = marketAgg.favoritePickCount > 0
            ? marketAgg.favoritePickRatioSum / marketAgg.favoritePickCount
            : 0;
        // ② streak / market → 0–10
        const streakScore = clamp10((streak.maxWin / (streak.maxWin + streak.maxLose + 1)) * 10);
        const marketScore = clamp10(favoritePickRate * 10);
        // ③ radar10 作成
        const radar10 = Object.assign(Object.assign({}, toRadar10(Object.assign(Object.assign({}, row), { streakScore,
            marketScore }))), { volume: clamp10(percentiles.volume / 10) });
        // ④ 判定系（ここで初めて使う）
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
                favoritePickRate, // 構造比（順当）
                favoriteWinRate, // ★順当勝率
                underdogWinRate, // ★逆張り勝率
                avgMarketMajorityRatioPicked, // 例: 0.76
            },
            radar10,
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