"use strict";
// functions/src/leaderboards/monthly.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.rebuildMonthlyLeaderboardsCron = exports.rebuildMonthlyLeaderboardsHttp = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
function db() {
    return (0, firestore_1.getFirestore)();
}
const LEAGUES = ["bj", "j1", "nba", "pl"];
const MIN_POSTS_BY_LEAGUE = {
    nba: 30,
    bj: 25,
    j1: 20,
    pl: 20,
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
function toDateKeyJST(d) {
    const j = new Date(d.getTime() + 9 * 60 * 60 * 1000);
    const y = j.getUTCFullYear();
    const m = String(j.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(j.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
}
function topN(rows, key, n = 10) {
    return [...rows]
        .sort((a, b) => {
        var _a, _b, _c, _d, _e, _f;
        const diff = Number((_a = b[key]) !== null && _a !== void 0 ? _a : 0) - Number((_b = a[key]) !== null && _b !== void 0 ? _b : 0);
        if (diff !== 0)
            return diff;
        if (key === "winRate") {
            const postsDiff = Number((_c = b.posts) !== null && _c !== void 0 ? _c : 0) - Number((_d = a.posts) !== null && _d !== void 0 ? _d : 0);
            if (postsDiff !== 0)
                return postsDiff;
        }
        return Number((_e = b.totalPoints) !== null && _e !== void 0 ? _e : 0) - Number((_f = a.totalPoints) !== null && _f !== void 0 ? _f : 0);
    })
        .slice(0, n)
        .map((row, index) => (Object.assign(Object.assign({}, row), { rank: index + 1 })));
}
async function buildMonthlyLeaderboard(league) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    const { start, end, month } = getPreviousMonthRange();
    const startDate = toDateKeyJST(start);
    const endDate = toDateKeyJST(end);
    const minPosts = (_a = MIN_POSTS_BY_LEAGUE[league]) !== null && _a !== void 0 ? _a : 20;
    const ref = db().collection("leaderboards_monthly").doc(`${league}_${month}`);
    await ref.set({
        kind: "month",
        league,
        month,
        startAtJst: start,
        endAtJst: end,
        minPosts,
        rebuiltAt: firestore_1.FieldValue.serverTimestamp(),
    }, { merge: true });
    const statsSnap = await db()
        .collection("user_stats_v2_daily")
        .where("date", ">=", startDate)
        .where("date", "<=", endDate)
        .get();
    const map = new Map();
    for (const doc of statsSnap.docs) {
        const d = doc.data();
        const uid = doc.id.split("_")[0];
        if (!uid)
            continue;
        const leagueStats = (_b = d.leagues) === null || _b === void 0 ? void 0 : _b[league];
        if (!leagueStats)
            continue;
        if (!map.has(uid)) {
            map.set(uid, {
                posts: 0,
                wins: 0,
                totalPoints: 0,
                totalPrecision: 0,
                totalUpset: 0,
            });
        }
        const agg = map.get(uid);
        agg.posts += (_c = leagueStats.posts) !== null && _c !== void 0 ? _c : 0;
        agg.wins += (_d = leagueStats.wins) !== null && _d !== void 0 ? _d : 0;
        agg.totalPoints += (_e = leagueStats.pointsSumV3) !== null && _e !== void 0 ? _e : 0;
        agg.totalPrecision += (_f = leagueStats.scorePrecisionSum) !== null && _f !== void 0 ? _f : 0;
        agg.totalUpset += (_g = leagueStats.upsetPointsSum) !== null && _g !== void 0 ? _g : 0;
    }
    const rows = [];
    for (const [uid, agg] of map.entries()) {
        if (agg.posts < minPosts)
            continue;
        const userSnap = await db().collection("users").doc(uid).get();
        const user = userSnap.exists ? userSnap.data() : {};
        rows.push({
            uid,
            handle: (_h = user === null || user === void 0 ? void 0 : user.handle) !== null && _h !== void 0 ? _h : null,
            displayName: (_j = user === null || user === void 0 ? void 0 : user.displayName) !== null && _j !== void 0 ? _j : "user",
            photoURL: (_k = user === null || user === void 0 ? void 0 : user.photoURL) !== null && _k !== void 0 ? _k : null,
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
    await ref.set({
        users: rows.length,
        rows,
        top10,
        updatedAt: firestore_1.FieldValue.serverTimestamp(),
    }, { merge: true });
    return {
        ok: true,
        league,
        month,
        users: rows.length,
    };
}
exports.rebuildMonthlyLeaderboardsHttp = (0, https_1.onRequest)(async (req, res) => {
    var _a;
    try {
        const league = typeof req.query.league === "string" ? req.query.league : "nba";
        const result = await buildMonthlyLeaderboard(league);
        res.status(200).json(result);
    }
    catch (e) {
        res.status(500).json({
            ok: false,
            error: (_a = e === null || e === void 0 ? void 0 : e.message) !== null && _a !== void 0 ? _a : "failed",
        });
    }
});
exports.rebuildMonthlyLeaderboardsCron = (0, scheduler_1.onSchedule)({ schedule: "0 1 1 * *", timeZone: "Asia/Tokyo" }, async () => {
    for (const league of LEAGUES) {
        await buildMonthlyLeaderboard(league);
    }
});
//# sourceMappingURL=monthly.js.map