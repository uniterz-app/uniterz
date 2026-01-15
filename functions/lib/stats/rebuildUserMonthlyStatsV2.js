"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rebuildUserMonthlyStatsMonthCronV2 = exports.rebuildUserMonthlyStatsV2 = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const judgeLevel_1 = require("./analysis/judgeLevel");
const judgeAnalysisType_1 = require("./analysis/judgeAnalysisType");
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
 * Core
 * ============================================================================
 */
async function rebuildUserMonthlyStatsCore() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t;
    var _u;
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
                upsetPick: 0, // ★ これを必ず追加
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
        // ★ daily.leagues からリーグ別投稿数を月間合算
        for (const [league, lstat] of Object.entries((_h = d.leagues) !== null && _h !== void 0 ? _h : {})) {
            const p = (_j = lstat === null || lstat === void 0 ? void 0 : lstat.posts) !== null && _j !== void 0 ? _j : 0;
            agg.leaguePosts[league] = ((_k = agg.leaguePosts[league]) !== null && _k !== void 0 ? _k : 0) + p;
        }
    }
    /* ===== rows ===== */
    const rows = Array.from(map.entries())
        .map(([uid, agg]) => {
        if (agg.posts === 0)
            return null;
        const winRate = agg.wins / agg.posts;
        const accuracy = 1 - agg.brierSum / agg.posts;
        const avgPrecision = agg.precisionSum / agg.posts;
        const MIN_UPSET_OPP = 5;
        const avgUpset = agg.upsetOpp >= MIN_UPSET_OPP
            ? agg.upsetHit / agg.upsetOpp
            : 0;
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
    /* ===== 分布 ===== */
    const winRates = rows.map(r => r.winRate).sort((a, b) => a - b);
    const volumes = rows.map(r => r.posts).sort((a, b) => a - b);
    const accuracies = rows.map(r => r.accuracy).sort((a, b) => a - b);
    const precisions = rows.map(r => r.avgPrecision).sort((a, b) => a - b);
    const upsets = rows.map(r => r.avgUpset).sort((a, b) => a - b);
    // ★ リーグ別分布
    const leagueVolumeMap = {};
    for (const r of rows) {
        for (const [league, p] of Object.entries(r.leaguePosts)) {
            (_l = leagueVolumeMap[league]) !== null && _l !== void 0 ? _l : (leagueVolumeMap[league] = []);
            leagueVolumeMap[league].push(p);
        }
    }
    for (const v of Object.values(leagueVolumeMap)) {
        v.sort((a, b) => a - b);
    }
    /* ============================================================================
   * Posts aggregation (monthly)
   * ============================================================================
   */
    // 月内の post を一括取得（★1回だけ）
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
        });
        const agg = postAggMap[uid];
        const pick = (_o = p.prediction) === null || _o === void 0 ? void 0 : _o.winner; // home | away
        const isWin = ((_p = p.stats) === null || _p === void 0 ? void 0 : _p.isWin) === true;
        // home / away
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
        // team
        const teamId = pick === "home"
            ? (_q = p.home) === null || _q === void 0 ? void 0 : _q.teamId
            : pick === "away"
                ? (_r = p.away) === null || _r === void 0 ? void 0 : _r.teamId
                : null;
        if (!teamId)
            continue;
        (_s = (_u = agg.teamMap)[teamId]) !== null && _s !== void 0 ? _s : (_u[teamId] = { posts: 0, wins: 0 });
        agg.teamMap[teamId].posts++;
        if (isWin)
            agg.teamMap[teamId].wins++;
    }
    const batch = db().batch();
    for (const row of rows) {
        const postAgg = postAggMap[row.uid];
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
        // ===== strong を先に確定 =====
        const strong = teams.slice(0, 3);
        // ===== strong に含まれる teamId を除外 =====
        const strongIds = new Set(strong.map(t => t.teamId));
        // ===== 残りから weak を作る =====
        const weak = teams
            .filter(t => !strongIds.has(t.teamId))
            .slice(-3)
            .reverse();
        const teamStats = {
            strong,
            weak,
        };
        const agg = map.get(row.uid);
        const raw = {
            posts: agg.posts,
            wins: agg.wins,
            winRate: row.winRate,
            accuracy: row.accuracy,
            avgPrecision: row.avgPrecision,
            avgUpset: row.avgUpset,
            upsetOpportunity: agg.upsetOpp, // ★ 追加
            upsetPick: agg.upsetPick, // ★ 追加
            upsetHit: agg.upsetHit, // ★ 追加
            leaguePosts: agg.leaguePosts,
        };
        // ★ 主戦場リーグを決定
        const mainLeague = getMainLeague(agg.leaguePosts);
        // ★ 主戦場リーグでの volume percentile
        const volumeMainLeague = mainLeague
            ? percentile((_t = leagueVolumeMap[mainLeague]) !== null && _t !== void 0 ? _t : [], agg.leaguePosts[mainLeague])
            : 0;
        const percentiles = {
            winRate: percentile(winRates, row.winRate),
            accuracy: percentile(accuracies, row.accuracy),
            precision: percentile(precisions, row.avgPrecision),
            upset: percentile(upsets, row.avgUpset),
            // ★ volume は主戦場リーグ基準だけにする
            volume: volumeMainLeague,
            // ★ 参考情報として残す（UIで使ってもいい）
            volumeByLeague: Object.fromEntries(Object.entries(agg.leaguePosts).map(([league, p]) => {
                var _a;
                return [
                    league,
                    percentile((_a = leagueVolumeMap[league]) !== null && _a !== void 0 ? _a : [], p),
                ];
            })),
        };
        // radar10:
        // - winRate / accuracy / precision / upset : 絶対評価（実力）
        // - volume : 主戦場リーグ内での相対評価（活動量）
        const radar10 = Object.assign(Object.assign({}, toRadar10(row)), { volume: clamp10(percentiles.volume / 10) });
        // ★ 分析タイプ判定
        const levelSummary = (0, judgeLevel_1.judgeLevels)(radar10);
        const analysisTypeId = (0, judgeAnalysisType_1.judgeAnalysisType)(levelSummary);
        const ref = db()
            .collection("user_stats_v2_monthly")
            .doc(`${row.uid}_${range.id}`);
        batch.set(ref, {
            uid: row.uid,
            month: range.id,
            raw,
            radar10,
            percentiles,
            homeAway,
            teamStats,
            analysisTypeId,
            analysisLevels: levelSummary.levels,
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        });
    }
    await batch.commit();
    await buildMonthlyGlobalStats(rows, range.id);
    return {
        month: range.id,
        users: rows.length,
    };
}
/* ============================================================================
 * HTTP
 * ============================================================================
 */
exports.rebuildUserMonthlyStatsV2 = (0, https_1.onRequest)({
    region: "us-central1",
    memory: "1GiB",
    timeoutSeconds: 540,
}, async (_req, res) => {
    try {
        const result = await rebuildUserMonthlyStatsCore();
        res.status(200).json(Object.assign({ ok: true }, result));
    }
    catch (e) {
        res.status(500).json({ ok: false, error: String(e) });
    }
});
async function buildMonthlyGlobalStats(rows, month) {
    if (rows.length === 0)
        return;
    /* =========================
     * 定数・ユーティリティ
     * ========================= */
    // ★ top10 用 足切り投稿数
    const MIN_POSTS_TOP = 30;
    const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
    // ★ 配列ベースの top10%
    const top10Of = (arr) => {
        const n = Math.max(1, Math.floor(arr.length * 0.1));
        return arr.slice(-n);
    };
    /* =========================
     * top10 対象 rows（足切り）
     * ========================= */
    // ★ 勝率・精度系は投稿数30以上のみ
    const rowsForTop = rows.filter(r => r.posts >= MIN_POSTS_TOP);
    /* =========================
     * sort
     * ========================= */
    // ★ 実力指標（足切りあり）
    const byWinRate = [...rowsForTop].sort((a, b) => a.winRate - b.winRate);
    const byAccuracy = [...rowsForTop].sort((a, b) => a.accuracy - b.accuracy);
    const byPrecision = [...rowsForTop].sort((a, b) => a.avgPrecision - b.avgPrecision);
    const byUpset = [...rowsForTop].sort((a, b) => a.avgUpset - b.avgUpset);
    // ★ volume（活動量）は全体
    const byVolume = [...rows].sort((a, b) => a.posts - b.posts);
    /* =========================
     * document
     * ========================= */
    const doc = {
        month,
        avg: {
            winRate: avg(rows.map(r => r.winRate)),
            accuracy: avg(rows.map(r => r.accuracy)),
            precision: avg(rows.map(r => r.avgPrecision)),
            upset: avg(rows.map(r => r.avgUpset)),
            volume: avg(rows.map(r => r.posts)),
        },
        top10: {
            winRate: avg(top10Of(byWinRate).map(r => r.winRate)),
            accuracy: avg(top10Of(byAccuracy).map(r => r.accuracy)),
            precision: avg(top10Of(byPrecision).map(r => r.avgPrecision)),
            upset: avg(top10Of(byUpset).map(r => r.avgUpset)),
            volume: avg(top10Of(byVolume).map(r => r.posts)),
        },
        users: rows.length,
        top10EligibleUsers: rowsForTop.length,
        updatedAt: firestore_1.FieldValue.serverTimestamp(),
    };
    await db()
        .collection("monthly_global_stats_v2")
        .doc(month)
        .set(doc);
}
/* ============================================================================
 * Cron
 * ============================================================================
 */
exports.rebuildUserMonthlyStatsMonthCronV2 = (0, scheduler_1.onSchedule)({ schedule: "0 5 1 * *", timeZone: "Asia/Tokyo" }, async () => {
    await rebuildUserMonthlyStatsCore();
});
//# sourceMappingURL=rebuildUserMonthlyStatsV2.js.map