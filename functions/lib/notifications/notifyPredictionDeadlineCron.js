"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runNotifyPredictionDeadlineCron = runNotifyPredictionDeadlineCron;
const firestore_1 = require("firebase-admin/firestore");
const sendExpoPush_1 = require("./sendExpoPush");
const pushNotificationCopy_1 = require("./pushNotificationCopy");
const PUSH_LEAGUES = ["nba", "bj", "j1", "pl", "wc"];
const LOOKAHEAD_LIMIT = 40;
const BUCKETS = [
    {
        minutes: 60,
        minMs: 55 * 60 * 1000,
        maxMs: 70 * 60 * 1000,
        field: "pushNotifiedDeadline60At",
    },
    {
        minutes: 30,
        minMs: 25 * 60 * 1000,
        maxMs: 40 * 60 * 1000,
        field: "pushNotifiedDeadline30At",
    },
    {
        minutes: 10,
        minMs: 5 * 60 * 1000,
        maxMs: 15 * 60 * 1000,
        field: "pushNotifiedDeadline10At",
    },
];
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
            data: { type: "prediction_deadline", gameId, postId: "" },
        });
    }
    return out;
}
async function runNotifyPredictionDeadlineCron() {
    var _a;
    const firestore = (0, firestore_1.getFirestore)();
    const now = Date.now();
    const until = new Date(now + 70 * 60 * 1000);
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
        const start = gameData.startAtJst instanceof firestore_1.Timestamp
            ? gameData.startAtJst.toMillis()
            : typeof ((_a = gameData.startAtJst) === null || _a === void 0 ? void 0 : _a.toMillis) === "function"
                ? gameData.startAtJst.toMillis()
                : 0;
        if (start <= now)
            continue;
        const remaining = start - now;
        const bucket = BUCKETS.find((b) => remaining >= b.minMs && remaining <= b.maxMs);
        if (!bucket)
            continue;
        if (gameData[bucket.field])
            continue;
        const gameId = gameDoc.id;
        const targets = targetsFromPredictorUids(gameId, gameData.predictorUids);
        if (targets.length === 0) {
            await (0, sendExpoPush_1.markGamePushNotified)(gameId, bucket.field);
            continue;
        }
        const matchup = (0, pushNotificationCopy_1.resolveGameMatchupCopy)(gameData);
        const result = await (0, sendExpoPush_1.sendExpoPushToUids)({
            type: "prediction_deadline",
            targets,
            matchup,
            predictionDeadlineMinutes: bucket.minutes,
        });
        await (0, sendExpoPush_1.markGamePushNotified)(gameId, bucket.field);
        console.log(`[notifyPredictionDeadlineCron] game=${gameId} min=${bucket.minutes} sent=${result.sent} targets=${targets.length}`);
    }
}
//# sourceMappingURL=notifyPredictionDeadlineCron.js.map