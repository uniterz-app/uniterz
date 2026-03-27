"use strict";
// functions/src/rankings/buildCumulativeStats.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCumulativeStats = buildCumulativeStats;
const firestore_1 = require("firebase-admin/firestore");
function db() {
    return (0, firestore_1.getFirestore)();
}
/* =========================================================
 * JST utils
 * =======================================================*/
function toDateKeyJST(d) {
    const j = new Date(d.getTime() + 9 * 60 * 60 * 1000);
    const y = j.getUTCFullYear();
    const m = String(j.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(j.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
}
function getTodayJST() {
    return toDateKeyJST(new Date());
}
/* =========================================================
 * Main
 * =======================================================*/
async function buildCumulativeStats() {
    const dateKey = getTodayJST();
    const dailySnap = await db()
        .collection("user_stats_v2_daily")
        .where("date", "==", dateKey)
        .get();
    let updated = 0;
    let skipped = 0;
    for (const doc of dailySnap.docs) {
        const data = doc.data();
        const uid = doc.id.split("_")[0];
        if (!uid)
            continue;
        const stats = data.all;
        if (!stats)
            continue;
        const cumulativeRef = db().doc(`cumulative_stats/${uid}`);
        const userRef = db().doc(`users/${uid}`);
        const result = await db().runTransaction(async (tx) => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
            const [cumulativeSnap, userSnap] = await Promise.all([
                tx.get(cumulativeRef),
                tx.get(userRef),
            ]);
            const lastAggregatedDate = (_a = cumulativeSnap.get("lastAggregatedDate")) !== null && _a !== void 0 ? _a : null;
            if (lastAggregatedDate === dateKey) {
                return { updated: false };
            }
            const user = userSnap.exists ? userSnap.data() : {};
            /* =========================
             * 累積値
             * =======================*/
            const prevPosts = (_b = cumulativeSnap.get("totalPosts")) !== null && _b !== void 0 ? _b : 0;
            const prevWins = (_c = cumulativeSnap.get("totalWins")) !== null && _c !== void 0 ? _c : 0;
            const prevPoints = (_d = cumulativeSnap.get("totalPoints")) !== null && _d !== void 0 ? _d : 0;
            const prevUpset = (_e = cumulativeSnap.get("totalUpset")) !== null && _e !== void 0 ? _e : 0;
            const prevPrecision = (_f = cumulativeSnap.get("totalPrecision")) !== null && _f !== void 0 ? _f : 0;
            const addPosts = (_g = stats.posts) !== null && _g !== void 0 ? _g : 0;
            const addWins = (_h = stats.wins) !== null && _h !== void 0 ? _h : 0;
            const addPoints = (_j = stats.pointsSumV3) !== null && _j !== void 0 ? _j : 0;
            const addUpset = (_k = stats.upsetPointsSum) !== null && _k !== void 0 ? _k : 0;
            const addPrecision = (_l = stats.scorePrecisionSum) !== null && _l !== void 0 ? _l : 0;
            const nextPosts = prevPosts + addPosts;
            const nextWins = prevWins + addWins;
            const nextPoints = prevPoints + addPoints;
            const nextUpset = prevUpset + addUpset;
            const nextPrecision = prevPrecision + addPrecision;
            const winRate = nextPosts > 0 ? nextWins / nextPosts : 0;
            tx.set(cumulativeRef, {
                uid,
                displayName: (_m = user.displayName) !== null && _m !== void 0 ? _m : "user",
                handle: (_o = user.handle) !== null && _o !== void 0 ? _o : null,
                photoURL: (_p = user.photoURL) !== null && _p !== void 0 ? _p : null,
                countryCode: (_q = user.countryCode) !== null && _q !== void 0 ? _q : null,
                totalPosts: nextPosts,
                totalWins: nextWins,
                totalPoints: nextPoints,
                totalUpset: nextUpset,
                totalPrecision: nextPrecision,
                winRate,
                lastAggregatedDate: dateKey,
                updatedAt: firestore_1.FieldValue.serverTimestamp(),
            }, { merge: true });
            return { updated: true };
        });
        if (result.updated)
            updated++;
        else
            skipped++;
    }
    return {
        date: dateKey,
        scanned: dailySnap.size,
        updated,
        skipped,
    };
}
//# sourceMappingURL=buildCumulativeStats.js.map