"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onPostDeletedV2 = void 0;
// functions/src/onPostDeletedV2.ts
const firestore_1 = require("firebase-functions/v2/firestore");
const firestore_2 = require("firebase-admin/firestore");
function teamIdFromSide(side) {
    if (!side || typeof side !== "object")
        return null;
    const id = side.teamId;
    return typeof id === "string" && id.trim() ? id.trim() : null;
}
function uniqueGameTeamIds(homeTeamId, awayTeamId) {
    const ids = [homeTeamId, awayTeamId]
        .map((v) => (typeof v === "string" ? v.trim() : ""))
        .filter(Boolean);
    return [...new Set(ids)];
}
function teamDecrementFields(teamId, dec) {
    const out = {};
    for (const [k, v] of Object.entries(dec)) {
        if (k === "updatedAt")
            continue;
        out[`teams.${teamId}.${k}`] = v;
    }
    return out;
}
exports.onPostDeletedV2 = (0, firestore_1.onDocumentDeleted)({
    document: "posts/{postId}",
    region: "asia-northeast1",
}, async (event) => {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const snap = event.data;
    if (!snap)
        return;
    const before = snap.data();
    if (!before)
        return;
    const uid = before.authorUid;
    const stats = before.stats;
    const startAt = (_b = (_a = before.startAtJst) !== null && _a !== void 0 ? _a : before.startAt) !== null && _b !== void 0 ? _b : before.createdAt;
    if (!uid || !startAt)
        return;
    const db = (0, firestore_2.getFirestore)();
    const d = startAt.toDate();
    const j = new Date(d.getTime() + 9 * 60 * 60 * 1000);
    const yyyy = j.getUTCFullYear();
    const mm = String(j.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(j.getUTCDate()).padStart(2, "0");
    const dateKey = `${yyyy}-${mm}-${dd}`;
    const dailyRef = db.doc(`user_stats_v2_daily/${uid}_${dateKey}`);
    const markerRef = dailyRef.collection("applied_posts").doc(snap.id);
    if (!stats) {
        await db.runTransaction(async (tx) => {
            var _a;
            const dailySnap = await tx.get(dailyRef);
            if (!dailySnap.exists)
                return;
            const dec = {
                posts: firestore_2.FieldValue.increment(-1),
                updatedAt: firestore_2.FieldValue.serverTimestamp(),
            };
            tx.set(dailyRef, { all: dec, ranking: dec }, { merge: true });
            const leagueKey = (_a = before.league) !== null && _a !== void 0 ? _a : null;
            if (leagueKey) {
                tx.set(dailyRef, { leagues: { [leagueKey]: dec } }, { merge: true });
            }
            tx.delete(markerRef);
        });
        return;
    }
    const countRank = stats.countedForRanking !== false;
    const isWin = stats.isWin === true;
    const scoreError = (_c = stats.scoreError) !== null && _c !== void 0 ? _c : 0;
    const scorePrecision = (_d = stats.scorePrecision) !== null && _d !== void 0 ? _d : 0;
    const hadUpsetGame = stats.hadUpsetGame === true;
    const upsetHit = stats.upsetHit === true;
    const upsetPoints = (_e = stats.upsetPoints) !== null && _e !== void 0 ? _e : 0;
    const pointsV3 = (_f = stats.pointsV3) !== null && _f !== void 0 ? _f : 0;
    const leagueKey = (_g = before.league) !== null && _g !== void 0 ? _g : null;
    const isWc = String(leagueKey !== null && leagueKey !== void 0 ? leagueKey : "").toLowerCase() === "wc";
    const exactMatch = stats.exactMatch === true;
    const goalScorerHit = ((_h = stats.goalScorerBonus) !== null && _h !== void 0 ? _h : 0) > 0;
    await db.runTransaction(async (tx) => {
        var _a, _b, _c, _d, _e;
        const dailySnap = await tx.get(dailyRef);
        if (!dailySnap.exists)
            return;
        const markerSnap = await tx.get(markerRef);
        const marker = markerSnap.data();
        const dec = {
            posts: firestore_2.FieldValue.increment(-1),
            wins: firestore_2.FieldValue.increment(isWin ? -1 : 0),
            scoreErrorSum: firestore_2.FieldValue.increment(-scoreError),
            upsetOpportunityCount: firestore_2.FieldValue.increment(hadUpsetGame ? -1 : 0),
            upsetHitCount: firestore_2.FieldValue.increment(upsetHit ? -1 : 0),
            upsetPickCount: firestore_2.FieldValue.increment(hadUpsetGame ? -1 : 0),
            upsetPointsSum: firestore_2.FieldValue.increment(-upsetPoints),
            scorePrecisionSum: firestore_2.FieldValue.increment(isWc ? 0 : -scorePrecision),
            exactHitCount: firestore_2.FieldValue.increment(isWc && exactMatch ? -1 : 0),
            goalScorerHitCount: firestore_2.FieldValue.increment(goalScorerHit ? -1 : 0),
            pointsSumV3: firestore_2.FieldValue.increment(-pointsV3),
            updatedAt: firestore_2.FieldValue.serverTimestamp(),
        };
        tx.set(dailyRef, { all: dec }, { merge: true });
        if (countRank) {
            tx.set(dailyRef, { ranking: dec }, { merge: true });
        }
        const leagueKeyInner = (_a = before.league) !== null && _a !== void 0 ? _a : null;
        if (leagueKeyInner) {
            tx.set(dailyRef, { leagues: { [leagueKeyInner]: dec } }, { merge: true });
        }
        const gameTeamIds = uniqueGameTeamIds((_c = (_b = marker === null || marker === void 0 ? void 0 : marker.homeTeamId) !== null && _b !== void 0 ? _b : teamIdFromSide(before.home)) !== null && _c !== void 0 ? _c : null, (_e = (_d = marker === null || marker === void 0 ? void 0 : marker.awayTeamId) !== null && _d !== void 0 ? _d : teamIdFromSide(before.away)) !== null && _e !== void 0 ? _e : null);
        const countTeams = (marker === null || marker === void 0 ? void 0 : marker.countedForRanking) !== false && countRank;
        if (countTeams && gameTeamIds.length > 0) {
            for (const teamId of gameTeamIds) {
                tx.set(dailyRef, teamDecrementFields(teamId, dec), { merge: true });
            }
        }
        tx.delete(markerRef);
    });
});
//# sourceMappingURL=onPostDeleted.js.map