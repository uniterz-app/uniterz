"use strict";
// functions/src/playoff/buildPlayoffStats.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPlayoffStats = buildPlayoffStats;
const firestore_1 = require("firebase-admin/firestore");
/* =========================================================
 * Firestore
 * =======================================================*/
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
function getYesterdayJST() {
    const now = new Date();
    const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    jst.setDate(jst.getDate() - 1);
    return toDateKeyJST(jst);
}
/* =========================================================
 * Main
 * =======================================================*/
async function buildPlayoffStats() {
    const dateKey = getYesterdayJST();
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
        const playoffRef = db().doc(`playoff_stats/${uid}`);
        const userRef = db().doc(`users/${uid}`);
        const result = await db().runTransaction(async (tx) => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j;
            const [playoffSnap, userSnap] = await Promise.all([
                tx.get(playoffRef),
                tx.get(userRef),
            ]);
            const lastAggregatedDate = (_a = playoffSnap.get("lastAggregatedDate")) !== null && _a !== void 0 ? _a : null;
            if (lastAggregatedDate === dateKey) {
                return { updated: false };
            }
            const user = userSnap.exists ? userSnap.data() : {};
            tx.set(playoffRef, {
                uid,
                displayName: (_b = user.displayName) !== null && _b !== void 0 ? _b : "user",
                handle: (_c = user.handle) !== null && _c !== void 0 ? _c : null,
                photoURL: (_d = user.photoURL) !== null && _d !== void 0 ? _d : null,
                totalPosts: firestore_1.FieldValue.increment((_e = stats.posts) !== null && _e !== void 0 ? _e : 0),
                totalWins: firestore_1.FieldValue.increment((_f = stats.wins) !== null && _f !== void 0 ? _f : 0),
                totalPoints: firestore_1.FieldValue.increment((_g = stats.pointsSumV3) !== null && _g !== void 0 ? _g : 0),
                totalUpset: firestore_1.FieldValue.increment((_h = stats.upsetPointsSum) !== null && _h !== void 0 ? _h : 0),
                totalPrecision: firestore_1.FieldValue.increment((_j = stats.scorePrecisionSum) !== null && _j !== void 0 ? _j : 0),
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
//# sourceMappingURL=buildPlayoffStats.js.map