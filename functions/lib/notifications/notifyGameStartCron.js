"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runNotifyGameStartCron = runNotifyGameStartCron;
const firestore_1 = require("firebase-admin/firestore");
const sendExpoPush_1 = require("./sendExpoPush");
const pushNotificationCopy_1 = require("./pushNotificationCopy");
const LOOKAHEAD_MS = 20 * 60 * 1000;
const LOOKAHEAD_LIMIT = 40;
const PUSH_LEAGUES = ["nba", "bj", "j1", "pl", "wc"];
function targetsFromPredictorUids(gameId, uids) {
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
        out.push({
            uid,
            data: { type: "game_start", gameId, postId: "" },
        });
    }
    return out;
}
/**
 * レガシー: predictorUids 未整備の試合だけ posts から uid を拾う（select のみ）。
 * 新規投稿は posts_v2 で games.predictorUids に積む。
 */
async function legacyTargetsFromPosts(gameId) {
    var _a;
    const snap = await (0, firestore_1.getFirestore)()
        .collection("posts")
        .where("gameId", "==", gameId)
        .where("schemaVersion", "==", 2)
        .select("authorUid")
        .get();
    const byUid = new Map();
    for (const doc of snap.docs) {
        const uid = (_a = doc.data()) === null || _a === void 0 ? void 0 : _a.authorUid;
        if (typeof uid !== "string" || !uid)
            continue;
        if (!byUid.has(uid)) {
            byUid.set(uid, {
                uid,
                data: { type: "game_start", gameId, postId: doc.id },
            });
        }
    }
    return [...byUid.values()];
}
async function runNotifyGameStartCron() {
    const firestore = (0, firestore_1.getFirestore)();
    const now = new Date();
    const until = new Date(now.getTime() + LOOKAHEAD_MS);
    const leagueSnaps = await Promise.all(PUSH_LEAGUES.map((league) => firestore
        .collection("games")
        .where("league", "==", league)
        .where("startAtJst", ">=", firestore_1.Timestamp.fromDate(now))
        .where("startAtJst", "<=", firestore_1.Timestamp.fromDate(until))
        .limit(LOOKAHEAD_LIMIT)
        .get()));
    const gameDocs = leagueSnaps.flatMap((snap) => snap.docs);
    for (const gameDoc of gameDocs) {
        const gameData = gameDoc.data();
        if (gameData.final === true)
            continue;
        if (gameData.pushNotifiedStartAt)
            continue;
        const gameId = gameDoc.id;
        let targets = targetsFromPredictorUids(gameId, gameData.predictorUids);
        if (targets.length === 0 &&
            !Array.isArray(gameData.predictorUids)) {
            targets = await legacyTargetsFromPosts(gameId);
            if (targets.length > 0) {
                await firestore.doc(`games/${gameId}`).set({
                    predictorUids: targets.map((t) => t.uid),
                    predictorCount: targets.length,
                }, { merge: true });
            }
        }
        if (targets.length === 0) {
            await (0, sendExpoPush_1.markGamePushNotified)(gameId, "pushNotifiedStartAt");
            continue;
        }
        const matchup = (0, pushNotificationCopy_1.resolveGameMatchupCopy)(gameData);
        const result = await (0, sendExpoPush_1.sendExpoPushToUids)({
            type: "game_start",
            targets,
            matchup,
        });
        if (result.sent > 0 || targets.length === 0) {
            await (0, sendExpoPush_1.markGamePushNotified)(gameId, "pushNotifiedStartAt");
        }
        console.log(`[notifyGameStartCron] game=${gameId} sent=${result.sent} targets=${targets.length}`);
    }
}
//# sourceMappingURL=notifyGameStartCron.js.map