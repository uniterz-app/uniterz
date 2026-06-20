"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runNotifyGameStartCron = runNotifyGameStartCron;
const firestore_1 = require("firebase-admin/firestore");
const sendExpoPush_1 = require("./sendExpoPush");
const pushNotificationCopy_1 = require("./pushNotificationCopy");
const LOOKAHEAD_MS = 15 * 60 * 1000;
async function runNotifyGameStartCron() {
    const firestore = (0, firestore_1.getFirestore)();
    const now = new Date();
    const until = new Date(now.getTime() + LOOKAHEAD_MS);
    const gamesSnap = await firestore
        .collection("games")
        .where("startAtJst", ">=", firestore_1.Timestamp.fromDate(now))
        .where("startAtJst", "<=", firestore_1.Timestamp.fromDate(until))
        .get();
    for (const gameDoc of gamesSnap.docs) {
        const gameData = gameDoc.data();
        if (gameData.final === true)
            continue;
        if (gameData.pushNotifiedStartAt)
            continue;
        const gameId = gameDoc.id;
        const postsSnap = await firestore
            .collection("posts")
            .where("gameId", "==", gameId)
            .where("schemaVersion", "==", 2)
            .get();
        const targets = (0, sendExpoPush_1.uniqueAuthorTargetsFromPosts)(postsSnap.docs, "game_start", gameId);
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