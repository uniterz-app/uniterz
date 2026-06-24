"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadWcGamesInKickoffSlot = loadWcGamesInKickoffSlot;
exports.wcSlotStreakDeferredMap = wcSlotStreakDeferredMap;
exports.applyWcSlotStreakWhenComplete = applyWcSlotStreakWhenComplete;
exports.rescoreEarlierWcSlotPosts = rescoreEarlierWcSlotPosts;
exports.wcSlotActiveForUser = wcSlotActiveForUser;
exports.resolveTriggerKickoffMs = resolveTriggerKickoffMs;
exports.isWcLeague = isWcLeague;
const firestore_1 = require("firebase-admin/firestore");
const calcStreakBonus_1 = require("../calcStreakBonus");
const predictionWin_1 = require("../predictionWin");
const updateUserStreakInternals_1 = require("../updateUserStreakInternals");
const resolveWcStage_1 = require("./resolveWcStage");
const wcKickoffSlot_1 = require("./wcKickoffSlot");
function toTimestamp(kickoffMs) {
    return firestore_1.Timestamp.fromMillis(kickoffMs);
}
function toDateKeyJST(ts) {
    const d = ts.toDate();
    const j = new Date(d.getTime() + 9 * 60 * 60 * 1000);
    const yyyy = j.getUTCFullYear();
    const mm = String(j.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(j.getUTCDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}
function migrateEntryCurF(snap) {
    const sb = snap.get("streakBySport");
    if (sb && typeof sb.football === "number")
        return sb.football;
    const legacy = snap.get("streakFootball");
    if (typeof legacy === "number")
        return legacy;
    return 0;
}
function migrateMaxFootball(snap) {
    const mb = snap.get("maxWinStreakBySport");
    if (typeof (mb === null || mb === void 0 ? void 0 : mb.football) === "number")
        return mb.football;
    const legacy = snap.get("maxWinStreakFootball");
    if (typeof legacy === "number")
        return legacy;
    return 0;
}
function migrateBasketballState(snap) {
    const sb = snap.get("streakBySport");
    const mb = snap.get("maxWinStreakBySport");
    return {
        basketball: typeof (sb === null || sb === void 0 ? void 0 : sb.basketball) === "number"
            ? sb.basketball
            : typeof snap.get("currentStreak") === "number"
                ? snap.get("currentStreak")
                : 0,
        maxBasketball: typeof (mb === null || mb === void 0 ? void 0 : mb.basketball) === "number"
            ? mb.basketball
            : typeof snap.get("maxWinStreak") === "number"
                ? snap.get("maxWinStreak")
                : 0,
    };
}
async function loadWcGamesInKickoffSlot(db, kickoffMs) {
    const snap = await db
        .collection("games")
        .where("league", "==", "wc")
        .where("startAtJst", "==", toTimestamp(kickoffMs))
        .get();
    return snap.docs.map((doc) => ({
        id: doc.id,
        final: doc.get("final") === true,
        data: doc.data(),
    }));
}
function buildSettlementGame(data) {
    var _a, _b;
    const homeScore = data.homeScore;
    const awayScore = data.awayScore;
    if (homeScore == null || awayScore == null)
        return null;
    return {
        homeScore,
        awayScore,
        league: data.league,
        homeTeamId: data.homeTeamId,
        awayTeamId: data.awayTeamId,
        regulationEtScore: (_a = data.regulationEtScore) !== null && _a !== void 0 ? _a : null,
        advancingTeamId: (_b = data.advancingTeamId) !== null && _b !== void 0 ? _b : null,
        knockout: data.knockout === true,
        goalScorers: data.goalScorers,
    };
}
async function loadUserOutcomesInSlot(db, slotGameIds) {
    const perUser = new Map();
    if (slotGameIds.length === 0)
        return perUser;
    for (const gameId of slotGameIds) {
        const gameSnap = await db.doc(`games/${gameId}`).get();
        if (!gameSnap.exists)
            continue;
        const settlement = buildSettlementGame(gameSnap.data());
        if (!settlement)
            continue;
        const postsSnap = await db
            .collection("posts")
            .where("gameId", "==", gameId)
            .where("schemaVersion", "==", 2)
            .get();
        postsSnap.docs.forEach((doc) => {
            var _a, _b;
            const p = doc.data();
            const uid = String((_a = p.authorUid) !== null && _a !== void 0 ? _a : "").trim();
            if (!uid)
                return;
            const list = (_b = perUser.get(uid)) !== null && _b !== void 0 ? _b : [];
            if (list.some((o) => o.gameId === gameId))
                return;
            list.push({
                gameId,
                didWin: (0, predictionWin_1.predictionWin)(p.prediction, settlement),
            });
            perUser.set(uid, list);
        });
    }
    return perUser;
}
function deferredResultFromSnap(uid, didWin, snap) {
    var _a;
    const curF = migrateEntryCurF(snap);
    const maxF = migrateMaxFootball(snap);
    const active = curF > 0 ? curF : 0;
    const maxLose = (_a = snap.get("maxLoseStreak")) !== null && _a !== void 0 ? _a : 0;
    return {
        uid,
        didWin,
        currentStreak: curF,
        activeWinStreak: active,
        maxWinStreak: maxF,
        maxLoseStreak: maxLose,
    };
}
/** スロット未確定: DB は更新せず、ボーナス用に現状連勝を返す */
async function wcSlotStreakDeferredMap(db, userResult) {
    const out = new Map();
    await Promise.all([...userResult.entries()].map(async ([uid, didWin]) => {
        const snap = await db.doc(`user_stats_v2/${uid}`).get();
        out.set(uid, deferredResultFromSnap(uid, didWin, snap));
    }));
    return out;
}
async function patchPostStreakFields(db, postRef, activeWinStreak, streakBonus, pointsV3) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    const snap = await postRef.get();
    if (!snap.exists)
        return { dPoints: 0, dStreakBonus: 0, dateKey: null, wcStage: null };
    const post = snap.data();
    const stats = ((_a = post.stats) !== null && _a !== void 0 ? _a : {});
    const detail = ((_b = stats.pointsV3Detail) !== null && _b !== void 0 ? _b : {});
    const storedPoints = Number((_c = stats.pointsV3) !== null && _c !== void 0 ? _c : 0);
    const storedBonus = Number((_d = stats.streakBonus) !== null && _d !== void 0 ? _d : 0);
    const dPoints = pointsV3 - storedPoints;
    const dStreakBonus = streakBonus - storedBonus;
    if (dPoints === 0 && dStreakBonus === 0 && Number((_e = detail.activeWinStreak) !== null && _e !== void 0 ? _e : 0) === activeWinStreak) {
        return { dPoints: 0, dStreakBonus: 0, dateKey: null, wcStage: null };
    }
    await postRef.update({
        stats: Object.assign(Object.assign({}, stats), { streakBonus,
            pointsV3, pointsV3Detail: Object.assign(Object.assign({}, detail), { streakBonus,
                activeWinStreak }) }),
        updatedAt: firestore_1.FieldValue.serverTimestamp(),
    });
    const gameId = String((_f = post.gameId) !== null && _f !== void 0 ? _f : "");
    const gameSnap = gameId ? await db.doc(`games/${gameId}`).get() : null;
    const game = (gameSnap === null || gameSnap === void 0 ? void 0 : gameSnap.exists) ? gameSnap.data() : null;
    const startAt = (_k = (_j = (_h = (_g = post.startAtJst) !== null && _g !== void 0 ? _g : post.startAt) !== null && _h !== void 0 ? _h : game === null || game === void 0 ? void 0 : game.startAtJst) !== null && _j !== void 0 ? _j : game === null || game === void 0 ? void 0 : game.startAt) !== null && _k !== void 0 ? _k : null;
    const dateKey = startAt ? toDateKeyJST(startAt) : null;
    const wcStage = game
        ? (0, resolveWcStage_1.resolveWcStageFromGame)({
            knockout: game.knockout === true,
            roundLabel: typeof game.roundLabel === "string" ? game.roundLabel : null,
            wcStage: typeof game.wcStage === "string" ? game.wcStage : null,
        })
        : null;
    return { dPoints, dStreakBonus, dateKey, wcStage };
}
async function applyDailyStreakDeltas(db, uid, dailyDeltas) {
    for (const [dateKey, { dPoints, dStreakBonus, wcStage }] of dailyDeltas) {
        if (dPoints === 0 && dStreakBonus === 0)
            continue;
        const dailyRef = db.doc(`user_stats_v2_daily/${uid}_${dateKey}`);
        const inc = {};
        if (dPoints !== 0)
            inc.pointsSumV3 = firestore_1.FieldValue.increment(dPoints);
        if (dStreakBonus !== 0)
            inc.streakBonusSum = firestore_1.FieldValue.increment(dStreakBonus);
        const patch = {
            date: dateKey,
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
            all: inc,
            ranking: inc,
        };
        if (wcStage) {
            patch.rankingByWcStage = Object.assign(Object.assign({ overall: inc }, (wcStage === "qualifying" ? { qualifying: inc } : {})), (wcStage === "main" ? { main: inc } : {}));
        }
        await dailyRef.set(patch, { merge: true });
    }
}
/**
 * スロット全試合 final 後に連勝を一括反映する。
 * 先に決済済み投稿の再採点は onGameFinalV2 から rescoreEarlierWcSlotPosts を呼ぶ。
 */
async function applyWcSlotStreakWhenComplete(db, triggerGameId, kickoffMs, triggerUserResult) {
    var _a, _b, _c, _d;
    const slotGames = await loadWcGamesInKickoffSlot(db, kickoffMs);
    const slotGameIds = slotGames.map((g) => g.id);
    const allFinal = slotGames.length > 0 && slotGames.every((g) => g.final);
    const resultMap = new Map();
    const perUserPerGameActive = new Map();
    if (!allFinal) {
        const deferred = await wcSlotStreakDeferredMap(db, triggerUserResult);
        deferred.forEach((v, k) => resultMap.set(k, v));
        return { resultMap, perUserPerGameActive, slotCompleted: false };
    }
    const userOutcomes = await loadUserOutcomesInSlot(db, slotGameIds);
    const uids = new Set([
        ...userOutcomes.keys(),
        ...triggerUserResult.keys(),
    ]);
    for (const uid of uids) {
        const outcomes = (_a = userOutcomes.get(uid)) !== null && _a !== void 0 ? _a : [];
        const didWin = (_d = (_b = triggerUserResult.get(uid)) !== null && _b !== void 0 ? _b : (_c = outcomes.find((o) => o.gameId === triggerGameId)) === null || _c === void 0 ? void 0 : _c.didWin) !== null && _d !== void 0 ? _d : false;
        const markerRef = (0, updateUserStreakInternals_1.streakApplyMarkerRef)(db, triggerGameId, uid);
        const markerSnap = await markerRef.get();
        if (markerSnap.exists) {
            const snap = await db.doc(`user_stats_v2/${uid}`).get();
            resultMap.set(uid, deferredResultFromSnap(uid, didWin, snap));
            continue;
        }
        const anySlotMarker = await Promise.all(slotGameIds.map((gid) => (0, updateUserStreakInternals_1.streakApplyMarkerRef)(db, gid, uid).get()));
        if (anySlotMarker.some((s) => s.exists)) {
            const snap = await db.doc(`user_stats_v2/${uid}`).get();
            resultMap.set(uid, deferredResultFromSnap(uid, didWin, snap));
            continue;
        }
        const userRef = db.doc(`user_stats_v2/${uid}`);
        const cumulativeRef = db.doc(`cumulative_stats/${uid}`);
        const publicUserRef = db.doc(`users/${uid}`);
        const updated = await db.runTransaction(async (tx) => {
            var _a;
            const snap = await tx.get(userRef);
            const entryCurF = migrateEntryCurF(snap);
            let maxF = migrateMaxFootball(snap);
            let maxLose = (_a = snap.get("maxLoseStreak")) !== null && _a !== void 0 ? _a : 0;
            const bb = migrateBasketballState(snap);
            const slotOutcome = (0, wcKickoffSlot_1.computeWcSlotStreakOutcome)(entryCurF, outcomes);
            const curF = slotOutcome.finalCurF;
            if (slotOutcome.finalActiveWinStreak > maxF) {
                maxF = slotOutcome.finalActiveWinStreak;
            }
            if (curF < 0 && Math.abs(curF) > maxLose) {
                maxLose = Math.abs(curF);
            }
            const activeWinStreak = slotOutcome.finalActiveWinStreak;
            const activeWinStreakFootball = activeWinStreak;
            const activeWinStreakBasketball = bb.basketball > 0 ? bb.basketball : 0;
            tx.set(userRef, {
                streakBySport: { basketball: bb.basketball, football: curF },
                maxWinStreakBySport: { basketball: bb.maxBasketball, football: maxF },
                currentStreak: bb.basketball,
                streakFootball: curF,
                maxWinStreak: bb.maxBasketball,
                maxWinStreakFootball: maxF,
                maxLoseStreak: maxLose,
                maxStreak: bb.maxBasketball,
                updatedAt: firestore_1.FieldValue.serverTimestamp(),
            }, { merge: true });
            tx.set(publicUserRef, {
                streakBySport: { basketball: bb.basketball, football: curF },
                currentStreak: bb.basketball,
                streakFootball: curF,
                maxStreak: bb.maxBasketball,
                updatedAt: firestore_1.FieldValue.serverTimestamp(),
            }, { merge: true });
            tx.set(cumulativeRef, {
                streakBySport: { basketball: bb.basketball, football: curF },
                currentStreak: bb.basketball,
                streakFootball: curF,
                activeWinStreak,
                activeWinStreakBasketball,
                activeWinStreakFootball,
                updatedAt: firestore_1.FieldValue.serverTimestamp(),
            }, { merge: true });
            for (const gid of slotGameIds) {
                tx.set((0, updateUserStreakInternals_1.streakApplyMarkerRef)(db, gid, uid), {
                    appliedAt: firestore_1.FieldValue.serverTimestamp(),
                    kickoffSlotMs: kickoffMs,
                });
            }
            return {
                uid,
                didWin,
                currentStreak: curF,
                activeWinStreak,
                maxWinStreak: maxF,
                maxLoseStreak: maxLose,
                perGame: slotOutcome.perGameActiveWinStreak,
            };
        });
        perUserPerGameActive.set(uid, updated.perGame);
        resultMap.set(uid, {
            uid: updated.uid,
            didWin: updated.didWin,
            currentStreak: updated.currentStreak,
            activeWinStreak: updated.activeWinStreak,
            maxWinStreak: updated.maxWinStreak,
            maxLoseStreak: updated.maxLoseStreak,
        });
    }
    for (const [uid, didWin] of triggerUserResult) {
        if (resultMap.has(uid))
            continue;
        const snap = await db.doc(`user_stats_v2/${uid}`).get();
        resultMap.set(uid, deferredResultFromSnap(uid, didWin, snap));
    }
    return {
        resultMap,
        perUserPerGameActive,
        slotCompleted: perUserPerGameActive.size > 0,
    };
}
/** スロット内の先に決済済み投稿を、確定後の連勝で再採点（トリガー試合の finalize 後に呼ぶ） */
async function rescoreEarlierWcSlotPosts(db, triggerGameId, perUserPerGameActive) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    for (const [uid, perGame] of perUserPerGameActive) {
        const dailyDeltas = new Map();
        for (const [gameId, activeWinStreak] of perGame) {
            if (gameId === triggerGameId)
                continue;
            const postsSnap = await db
                .collection("posts")
                .where("gameId", "==", gameId)
                .where("authorUid", "==", uid)
                .where("schemaVersion", "==", 2)
                .limit(5)
                .get();
            const postDoc = postsSnap.docs[0];
            if (!postDoc)
                continue;
            const stats = ((_a = postDoc.data().stats) !== null && _a !== void 0 ? _a : {});
            const detail = ((_b = stats.pointsV3Detail) !== null && _b !== void 0 ? _b : {});
            const basePoints = Number((_c = detail.basePoints) !== null && _c !== void 0 ? _c : 0);
            const upsetBonus = Number((_e = (_d = detail.upsetBonus) !== null && _d !== void 0 ? _d : stats.upsetBonus) !== null && _e !== void 0 ? _e : 0);
            const goalScorerBonus = Number((_g = (_f = detail.goalScorerBonus) !== null && _f !== void 0 ? _f : stats.goalScorerBonus) !== null && _g !== void 0 ? _g : 0);
            const streakBonus = (0, calcStreakBonus_1.calcStreakBonus)(activeWinStreak);
            const pointsV3 = basePoints + upsetBonus + streakBonus + goalScorerBonus;
            const { dPoints, dStreakBonus, dateKey, wcStage } = await patchPostStreakFields(db, postDoc.ref, activeWinStreak, streakBonus, pointsV3);
            if (dateKey && (dPoints !== 0 || dStreakBonus !== 0)) {
                const prev = (_h = dailyDeltas.get(dateKey)) !== null && _h !== void 0 ? _h : {
                    dPoints: 0,
                    dStreakBonus: 0,
                    wcStage,
                };
                prev.dPoints += dPoints;
                prev.dStreakBonus += dStreakBonus;
                dailyDeltas.set(dateKey, prev);
            }
        }
        await applyDailyStreakDeltas(db, uid, dailyDeltas);
    }
}
function wcSlotActiveForUser(perUserPerGameActive, uid, gameId, fallback) {
    var _a, _b;
    return (_b = (_a = perUserPerGameActive.get(uid)) === null || _a === void 0 ? void 0 : _a.get(gameId)) !== null && _b !== void 0 ? _b : fallback;
}
function resolveTriggerKickoffMs(gameSnap) {
    return (0, wcKickoffSlot_1.resolveKickoffMsFromFields)(gameSnap.data());
}
function isWcLeague(league) {
    return String(league !== null && league !== void 0 ? league : "").trim().toLowerCase() === "wc";
}
//# sourceMappingURL=wcSlotStreak.js.map