"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runNotifyPregameAlertCron = runNotifyPregameAlertCron;
const crypto_1 = require("crypto");
const firestore_1 = require("firebase-admin/firestore");
const sendExpoPush_1 = require("./sendExpoPush");
const pushNotificationCopy_1 = require("./pushNotificationCopy");
const PUSH_LEAGUES = ["nba", "bj", "j1", "pl", "wc"];
const LOOKAHEAD_MS = 12 * 60 * 60 * 1000;
const LOOKAHEAD_LIMIT = 80;
function fingerprint(value) {
    if (value == null)
        return null;
    if (typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === 0) {
        return null;
    }
    if (Array.isArray(value) && value.length === 0)
        return null;
    return (0, crypto_1.createHash)("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 32);
}
function targetsFromPredictorUids(gameId, type, uids) {
    if (!Array.isArray(uids))
        return [];
    const out = [];
    const seen = new Set();
    for (const raw of uids) {
        if (typeof raw !== "string" || !raw.trim())
            continue;
        const uid = raw.trim();
        if (seen.has(uid))
            continue;
        seen.add(uid);
        out.push({ uid, data: { type, gameId, postId: "" } });
    }
    return out;
}
/**
 * 試合 doc に injuryReport / starters / proBrief が入ったあと、差分があれば Pro に送る。
 * 初回はベースラインだけ書いて送らない（取り込み開始時の一斉配信を避ける）。
 * フィールドが無い試合は何もしない。
 */
async function runNotifyPregameAlertCron() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    const firestore = (0, firestore_1.getFirestore)();
    const now = Date.now();
    const until = new Date(now + LOOKAHEAD_MS);
    const leagueSnaps = await Promise.all(PUSH_LEAGUES.map((league) => firestore
        .collection("games")
        .where("league", "==", league)
        .where("startAtJst", ">=", firestore_1.Timestamp.fromMillis(now))
        .where("startAtJst", "<=", firestore_1.Timestamp.fromDate(until))
        .limit(LOOKAHEAD_LIMIT)
        .get()));
    const gameDocs = leagueSnaps.flatMap((snap) => snap.docs);
    for (const gameDoc of gameDocs) {
        const gameData = gameDoc.data();
        if (gameData.final === true)
            continue;
        const injuryFp = fingerprint((_a = gameData.injuryReport) !== null && _a !== void 0 ? _a : null);
        const starterFp = fingerprint((_d = (_c = (_b = gameData.starters) !== null && _b !== void 0 ? _b : gameData.startingLineup) !== null && _c !== void 0 ? _c : gameData.lineup) !== null && _d !== void 0 ? _d : null);
        const insightFp = fingerprint((_e = gameData.proBrief) !== null && _e !== void 0 ? _e : null);
        const prev = (_f = gameData.pushPregame) !== null && _f !== void 0 ? _f : {};
        const changed = [];
        const next = {
            injuryFp: (_g = prev.injuryFp) !== null && _g !== void 0 ? _g : null,
            starterFp: (_h = prev.starterFp) !== null && _h !== void 0 ? _h : null,
            insightFp: (_j = prev.insightFp) !== null && _j !== void 0 ? _j : null,
        };
        if (injuryFp) {
            if (prev.injuryFp && prev.injuryFp !== injuryFp) {
                changed.push("injury_status");
            }
            next.injuryFp = injuryFp;
        }
        if (starterFp) {
            if (prev.starterFp && prev.starterFp !== starterFp) {
                changed.push("starter_change");
            }
            next.starterFp = starterFp;
        }
        if (insightFp) {
            if (prev.insightFp && prev.insightFp !== insightFp) {
                changed.push("pro_insight_update");
            }
            next.insightFp = insightFp;
        }
        const fingerprintChanged = next.injuryFp !== ((_k = prev.injuryFp) !== null && _k !== void 0 ? _k : null) ||
            next.starterFp !== ((_l = prev.starterFp) !== null && _l !== void 0 ? _l : null) ||
            next.insightFp !== ((_m = prev.insightFp) !== null && _m !== void 0 ? _m : null);
        if (changed.length === 0) {
            if (fingerprintChanged) {
                await gameDoc.ref.set({
                    pushPregame: Object.assign(Object.assign({}, next), { baselinedAt: firestore_1.Timestamp.now() }),
                }, { merge: true });
            }
            continue;
        }
        const gameId = gameDoc.id;
        const matchup = (0, pushNotificationCopy_1.resolveGameMatchupCopy)(gameData);
        const types = changed.length >= 2 ? ["pregame_digest"] : changed;
        for (const type of types) {
            const targets = targetsFromPredictorUids(gameId, type, gameData.predictorUids);
            if (targets.length === 0)
                continue;
            const result = await (0, sendExpoPush_1.sendExpoPushToUids)({ type, targets, matchup });
            console.log(`[notifyPregameAlertCron] game=${gameId} type=${type} sent=${result.sent} targets=${targets.length}`);
        }
        await gameDoc.ref.set({
            pushPregame: Object.assign(Object.assign({}, next), { notifiedAt: firestore_1.Timestamp.now(), lastKinds: changed }),
        }, { merge: true });
    }
}
//# sourceMappingURL=notifyPregameAlertCron.js.map