"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyPostToUserStatsV2 = applyPostToUserStatsV2;
exports.getStatsForDateRangeV2 = getStatsForDateRangeV2;
// functions/src/updateUserStatsV2.ts
const firestore_1 = require("firebase-admin/firestore");
const cumulativeFromDaily_1 = require("./rankings/cumulativeFromDaily");
function shouldCountForRanking(v) {
    return v !== false;
}
function normalizeSeasonPhase(v) {
    if (!v)
        return null;
    return v === "play_in" || v === "playoffs" ? v : null;
}
function normalizeSeasonRound(v) {
    if (!v)
        return null;
    return v === "r1" || v === "r2" || v === "cf" || v === "finals" ? v : null;
}
const db = () => (0, firestore_1.getFirestore)();
function buildPostCumulativeContribution(opts) {
    var _a, _b, _c;
    const leagueKey = normalizeLeague(opts.league);
    return {
        forRanking: shouldCountForRanking(opts.countsForRanking),
        phaseKey: normalizeSeasonPhase(opts.seasonPhase),
        roundKey: normalizeSeasonRound(opts.seasonRound),
        leagueKey,
        isWc: leagueKey === "wc",
        wcStage: (_a = opts.wcStage) !== null && _a !== void 0 ? _a : null,
        isWin: opts.isWin,
        points: opts.points,
        upsetPoints: opts.upsetPoints,
        scorePrecision: opts.scorePrecision,
        exactHit: (_b = opts.exactHit) !== null && _b !== void 0 ? _b : false,
        goalScorerHit: (_c = opts.goalScorerHit) !== null && _c !== void 0 ? _c : false,
        upsetBonus: opts.upsetBonus,
        streakBonus: opts.streakBonus,
    };
}
/* =========================================================
 * Utils
 * =======================================================*/
function toDateKeyJST(ts) {
    const d = ts.toDate();
    const j = new Date(d.getTime() + 9 * 60 * 60 * 1000);
    const yyyy = j.getUTCFullYear();
    const mm = String(j.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(j.getUTCDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}
function normalizeLeague(raw) {
    if (!raw)
        return null;
    const v = String(raw).trim().toLowerCase();
    if (v === "bj" || v === "b1" || v.includes("b.league"))
        return "bj";
    if (v === "j1" || v === "j")
        return "j1";
    if (v === "nba")
        return "nba";
    if (v === "pl" || v.includes("premier"))
        return "pl";
    if (v === "wc" || v === "fifa")
        return "wc";
    return null;
}
function uniqueGameTeamIds(homeTeamId, awayTeamId) {
    const ids = [homeTeamId, awayTeamId]
        .map((v) => (typeof v === "string" ? v.trim() : ""))
        .filter(Boolean);
    return [...new Set(ids)];
}
/* =========================================================
 * Bucket helpers
 * =======================================================*/
function emptyBucket() {
    return {
        posts: 0,
        wins: 0,
        scoreErrorSum: 0,
        upsetHitCount: 0,
        upsetOpportunityCount: 0,
        scorePrecisionSum: 0,
        pointsSumV3: 0,
        upsetPointsSum: 0,
        upsetBonusSum: 0,
        streakBonusSum: 0,
        goalScorerHitCount: 0,
        goalScorerBonusSum: 0,
        exactHitCount: 0,
        winRate: 0,
        avgScoreError: 0,
        upsetHitRate: 0,
        avgPrecision: 0,
        avgPointsV3: 0,
        upsetPickCount: 0,
    };
}
function recomputeCache(b) {
    const posts = b.posts;
    const wins = b.wins;
    return Object.assign(Object.assign({}, b), { winRate: posts ? wins / posts : 0, avgScoreError: posts ? b.scoreErrorSum / posts : 0, avgPrecision: posts ? b.scorePrecisionSum / posts : 0, upsetHitRate: b.upsetOpportunityCount > 0
            ? b.upsetHitCount / b.upsetOpportunityCount
            : 0, avgPointsV3: posts ? b.pointsSumV3 / posts : 0 });
}
/* =========================================================
 * 投稿1件 → user_stats_v2_daily に即反映
 * =======================================================*/
async function applyPostToUserStatsV2(opts) {
    const { uid, postId, startAt, league, isWin, scoreError, scorePrecision, hadUpsetGame, points, upsetHit, upsetPoints, upsetBonus, streakBonus, goalScorerBonus = 0, goalScorerHit = false, exactHit = false, countsForRanking, seasonPhase, seasonRound, wcStage, homeTeamId, awayTeamId, } = opts;
    const forRanking = shouldCountForRanking(countsForRanking);
    const phaseKey = normalizeSeasonPhase(seasonPhase);
    const roundKey = normalizeSeasonRound(seasonRound);
    const dateKey = toDateKeyJST(startAt);
    const leagueKey = normalizeLeague(league);
    const isWc = leagueKey === "wc";
    const dailyRef = db().doc(`user_stats_v2_daily/${uid}_${dateKey}`);
    const markerRef = dailyRef.collection("applied_posts").doc(postId);
    const cumulativeRef = db().doc(`cumulative_stats/${uid}`);
    const userRef = db().doc(`users/${uid}`);
    const userStatsRef = db().doc(`user_stats_v2/${uid}`);
    await db().runTransaction(async (tx) => {
        var _a;
        const marker = await tx.get(markerRef);
        if (marker.exists)
            return;
        const userSnap = await tx.get(userRef);
        const user = userSnap.exists ? userSnap.data() : {};
        const inc = {
            posts: firestore_1.FieldValue.increment(1),
            wins: firestore_1.FieldValue.increment(isWin ? 1 : 0),
            scoreErrorSum: firestore_1.FieldValue.increment(scoreError),
            upsetOpportunityCount: firestore_1.FieldValue.increment(hadUpsetGame ? 1 : 0),
            upsetHitCount: firestore_1.FieldValue.increment(upsetHit ? 1 : 0),
            upsetPickCount: firestore_1.FieldValue.increment(hadUpsetGame ? 1 : 0),
            scorePrecisionSum: firestore_1.FieldValue.increment(isWc ? 0 : scorePrecision),
            exactHitCount: firestore_1.FieldValue.increment(isWc && exactHit ? 1 : 0),
            pointsSumV3: firestore_1.FieldValue.increment(points),
            upsetPointsSum: firestore_1.FieldValue.increment(upsetPoints),
            upsetBonusSum: firestore_1.FieldValue.increment(upsetBonus),
            streakBonusSum: firestore_1.FieldValue.increment(streakBonus),
            goalScorerHitCount: firestore_1.FieldValue.increment(goalScorerHit ? 1 : 0),
            goalScorerBonusSum: firestore_1.FieldValue.increment(goalScorerBonus),
        };
        const update = Object.assign(Object.assign(Object.assign({ date: dateKey, updatedAt: firestore_1.FieldValue.serverTimestamp(), all: inc }, (forRanking ? { ranking: inc } : {})), (phaseKey ? { rankingByPhase: { [phaseKey]: inc } } : {})), (forRanking && phaseKey === "playoffs" && roundKey
            ? { rankingByPlayoffRound: { [roundKey]: inc } }
            : {}));
        if (forRanking && leagueKey === "wc") {
            update.rankingByWcStage = Object.assign(Object.assign({ overall: inc }, (wcStage === "qualifying" ? { qualifying: inc } : {})), (wcStage === "main" ? { main: inc } : {}));
        }
        if (leagueKey) {
            update.leagues = Object.assign(Object.assign({}, (update.leagues || {})), { [leagueKey]: inc });
            tx.set(userStatsRef, {
                leaguePosts: {
                    [leagueKey]: firestore_1.FieldValue.increment(1),
                },
                lastActiveLeague: leagueKey,
                updatedAt: firestore_1.FieldValue.serverTimestamp(),
            }, { merge: true });
        }
        const gameTeamIds = uniqueGameTeamIds(homeTeamId, awayTeamId);
        if (forRanking && gameTeamIds.length > 0) {
            update.teams = Object.assign(Object.assign({}, ((_a = update.teams) !== null && _a !== void 0 ? _a : {})), Object.fromEntries(gameTeamIds.map((teamId) => [teamId, inc])));
        }
        tx.set(dailyRef, update, { merge: true });
        tx.set(markerRef, {
            at: firestore_1.FieldValue.serverTimestamp(),
            league: leagueKey,
            homeTeamId: homeTeamId !== null && homeTeamId !== void 0 ? homeTeamId : null,
            awayTeamId: awayTeamId !== null && awayTeamId !== void 0 ? awayTeamId : null,
            posts: 1,
            wins: isWin ? 1 : 0,
            scoreErrorSum: scoreError,
            scorePrecisionSum: isWc ? 0 : scorePrecision,
            exactHitCount: isWc && exactHit ? 1 : 0,
            pointsSumV3: points,
            upsetPointsSum: upsetPoints,
            upsetHitCount: upsetHit ? 1 : 0,
            upsetOpportunityCount: hadUpsetGame ? 1 : 0,
            countedForRanking: forRanking,
        });
        (0, cumulativeFromDaily_1.applyCumulativeIncrementInTransaction)(tx, cumulativeRef, user, uid, buildPostCumulativeContribution({
            countsForRanking,
            seasonPhase,
            seasonRound,
            league,
            isWin,
            points,
            upsetPoints,
            scorePrecision,
            exactHit,
            goalScorerHit,
            wcStage,
            upsetBonus,
            streakBonus,
        }));
    });
}
/* =========================================================
 * 週間・月間ランキング用の唯一の集計処理
 * =======================================================*/
async function getStatsForDateRangeV2(uid, start, end, league) {
    var _a;
    const coll = db().collection("user_stats_v2_daily");
    const ONE = 86400000;
    let b = emptyBucket();
    for (let t = start.getTime(); t <= end.getTime(); t += ONE) {
        const d = new Date(t);
        const key = `${uid}_${toDateKeyJST(firestore_1.Timestamp.fromDate(d))}`;
        const snap = await coll.doc(key).get();
        if (!snap.exists)
            continue;
        const v = snap.data();
        const src = league ? (_a = v.leagues) === null || _a === void 0 ? void 0 : _a[league] : v.all;
        if (!src)
            continue;
        b.posts += src.posts || 0;
        b.wins += src.wins || 0;
        b.scoreErrorSum += src.scoreErrorSum || 0;
        b.upsetHitCount += src.upsetHitCount || 0;
        b.upsetOpportunityCount += src.upsetOpportunityCount || 0;
        b.scorePrecisionSum += src.scorePrecisionSum || 0;
        b.upsetPickCount += src.upsetPickCount || 0;
        b.pointsSumV3 += src.pointsSumV3 || 0;
        b.upsetPointsSum += src.upsetPointsSum || 0;
        b.upsetBonusSum += src.upsetBonusSum || 0;
        b.streakBonusSum += src.streakBonusSum || 0;
        b.goalScorerHitCount += src.goalScorerHitCount || 0;
        b.goalScorerBonusSum += src.goalScorerBonusSum || 0;
        b.exactHitCount += src.exactHitCount || 0;
    }
    return recomputeCache(b);
}
//# sourceMappingURL=updateUserStatsV2.js.map