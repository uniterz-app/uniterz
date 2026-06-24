"use strict";
// functions/src/updateUserStreak.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUPPRESS_STREAK_INCREMENT_V2_FIELD = void 0;
exports.updateUserStreak = updateUserStreak;
const firestore_1 = require("firebase-admin/firestore");
const predictionWin_1 = require("./predictionWin");
const settlementGame_1 = require("./settlementGame");
const wcSlotStreak_1 = require("./wc/wcSlotStreak");
const updateUserStreakInternals_1 = require("./updateUserStreakInternals");
/**
 * games/{gameId}: set `suppressStreakIncrementV2: true` to skip all streak writes for that game (no stats updates, no per-user markers).
 * Typical use: after the first streak apply, flip this on before re-finalizing to avoid a second increment.
 * If true before the first finalize, this game never updates streaks.
 */
exports.SUPPRESS_STREAK_INCREMENT_V2_FIELD = "suppressStreakIncrementV2";
function migrateStreakBySport(snap) {
    var _a, _b, _c, _d, _e;
    const sb = snap.get("streakBySport");
    const mb = snap.get("maxWinStreakBySport");
    if (sb && typeof sb === "object") {
        return {
            basketball: Number((_a = sb.basketball) !== null && _a !== void 0 ? _a : 0),
            football: Number((_b = sb.football) !== null && _b !== void 0 ? _b : 0),
            maxBasketball: typeof (mb === null || mb === void 0 ? void 0 : mb.basketball) === "number"
                ? mb.basketball
                : Number((_c = snap.get("maxWinStreak")) !== null && _c !== void 0 ? _c : 0),
            maxFootball: typeof (mb === null || mb === void 0 ? void 0 : mb.football) === "number" ? mb.football : 0,
        };
    }
    const legacy = (_d = snap.get("currentStreak")) !== null && _d !== void 0 ? _d : 0;
    const maxLegacy = (_e = snap.get("maxWinStreak")) !== null && _e !== void 0 ? _e : 0;
    return {
        basketball: typeof legacy === "number" ? legacy : 0,
        football: 0,
        maxBasketball: typeof maxLegacy === "number" ? maxLegacy : 0,
        maxFootball: 0,
    };
}
async function updateUserStreak({ db, gameId, settlementGame, }) {
    const postsSnap = await db
        .collection("posts")
        .where("gameId", "==", gameId)
        .where("schemaVersion", "==", 2)
        .get();
    const userResult = new Map();
    postsSnap.docs.forEach((d) => {
        const p = d.data();
        if (!p.authorUid)
            return;
        if (userResult.has(p.authorUid))
            return;
        const isWin = (0, predictionWin_1.predictionWin)(p.prediction, settlementGame);
        userResult.set(p.authorUid, isWin);
    });
    const updatedMap = new Map();
    const gameSnap = await db.doc(`games/${gameId}`).get();
    const suppressStreakForGame = gameSnap.get(exports.SUPPRESS_STREAK_INCREMENT_V2_FIELD) === true;
    if (suppressStreakForGame) {
        const sportKey = (0, settlementGame_1.leagueToSport)(settlementGame.league);
        const entries = [...userResult.entries()];
        await Promise.all(entries.map(async ([uid, didWin]) => {
            const snap = await db.doc(`user_stats_v2/${uid}`).get();
            updatedMap.set(uid, (0, updateUserStreakInternals_1.streakResultFromUserSnap)(uid, didWin, snap, sportKey));
        }));
        return { streakResultMap: updatedMap, wcSlotRescore: null };
    }
    const sportKey = (0, settlementGame_1.leagueToSport)(settlementGame.league);
    /** WC: 同時キックオフスロット単位で連勝を一括反映 */
    if (sportKey === "football" && (0, wcSlotStreak_1.isWcLeague)(settlementGame.league)) {
        const kickoffMs = (0, wcSlotStreak_1.resolveTriggerKickoffMs)(gameSnap);
        if (kickoffMs != null) {
            const { resultMap, perUserPerGameActive, slotCompleted } = await (0, wcSlotStreak_1.applyWcSlotStreakWhenComplete)(db, gameId, kickoffMs, userResult);
            for (const [uid, base] of resultMap) {
                const active = (0, wcSlotStreak_1.wcSlotActiveForUser)(perUserPerGameActive, uid, gameId, base.activeWinStreak);
                updatedMap.set(uid, Object.assign(Object.assign({}, base), { activeWinStreak: active }));
            }
            return {
                streakResultMap: updatedMap,
                wcSlotRescore: slotCompleted
                    ? { perUserPerGameActive }
                    : null,
            };
        }
        const deferred = await (0, wcSlotStreak_1.wcSlotStreakDeferredMap)(db, userResult);
        deferred.forEach((v, k) => updatedMap.set(k, v));
        return { streakResultMap: updatedMap, wcSlotRescore: null };
    }
    for (const [uid, didWin] of userResult.entries()) {
        const userRef = db.doc(`user_stats_v2/${uid}`);
        const cumulativeRef = db.doc(`cumulative_stats/${uid}`);
        const publicUserRef = db.doc(`users/${uid}`);
        const markerRef = (0, updateUserStreakInternals_1.streakApplyMarkerRef)(db, gameId, uid);
        const updated = await db.runTransaction(async (tx) => {
            var _a;
            const markerSnap = await tx.get(markerRef);
            if (markerSnap.exists) {
                const snap = await tx.get(userRef);
                return (0, updateUserStreakInternals_1.streakResultFromUserSnap)(uid, didWin, snap, sportKey);
            }
            const snap = await tx.get(userRef);
            let maxLose = (_a = snap.get("maxLoseStreak")) !== null && _a !== void 0 ? _a : 0;
            const st = migrateStreakBySport(snap);
            let curB = st.basketball;
            let curF = st.football;
            let maxB = st.maxBasketball;
            let maxF = st.maxFootball;
            if (sportKey === "football") {
                if (didWin) {
                    curF = curF > 0 ? curF + 1 : 1;
                    if (curF > maxF)
                        maxF = curF;
                }
                else {
                    curF = curF < 0 ? curF - 1 : -1;
                    if (Math.abs(curF) > maxLose) {
                        maxLose = Math.abs(curF);
                    }
                }
            }
            else {
                if (didWin) {
                    curB = curB > 0 ? curB + 1 : 1;
                    if (curB > maxB)
                        maxB = curB;
                }
                else {
                    curB = curB < 0 ? curB - 1 : -1;
                    if (Math.abs(curB) > maxLose) {
                        maxLose = Math.abs(curB);
                    }
                }
            }
            const activeWinStreak = sportKey === "football"
                ? curF > 0
                    ? curF
                    : 0
                : curB > 0
                    ? curB
                    : 0;
            const currentForSport = sportKey === "football" ? curF : curB;
            const activeWinStreakBasketball = curB > 0 ? curB : 0;
            const activeWinStreakFootball = curF > 0 ? curF : 0;
            tx.set(userRef, {
                streakBySport: { basketball: curB, football: curF },
                maxWinStreakBySport: { basketball: maxB, football: maxF },
                currentStreak: curB,
                streakFootball: curF,
                maxWinStreak: maxB,
                maxWinStreakFootball: maxF,
                maxLoseStreak: maxLose,
                maxStreak: maxB,
                updatedAt: firestore_1.FieldValue.serverTimestamp(),
            }, { merge: true });
            tx.set(publicUserRef, {
                streakBySport: { basketball: curB, football: curF },
                currentStreak: curB,
                streakFootball: curF,
                maxStreak: maxB,
                updatedAt: firestore_1.FieldValue.serverTimestamp(),
            }, { merge: true });
            tx.set(cumulativeRef, {
                streakBySport: { basketball: curB, football: curF },
                currentStreak: curB,
                streakFootball: curF,
                activeWinStreak,
                activeWinStreakBasketball,
                activeWinStreakFootball,
                updatedAt: firestore_1.FieldValue.serverTimestamp(),
            }, { merge: true });
            tx.set(markerRef, {
                appliedAt: firestore_1.FieldValue.serverTimestamp(),
            });
            return {
                uid,
                didWin,
                currentStreak: currentForSport,
                activeWinStreak,
                maxWinStreak: sportKey === "football" ? maxF : maxB,
                maxLoseStreak: maxLose,
            };
        });
        updatedMap.set(uid, updated);
    }
    return { streakResultMap: updatedMap, wcSlotRescore: null };
}
//# sourceMappingURL=updateUserStreak.js.map