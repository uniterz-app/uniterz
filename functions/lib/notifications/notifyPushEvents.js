"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifyGameFinalPush = notifyGameFinalPush;
exports.notifyRankingUpdatedPush = notifyRankingUpdatedPush;
const sendExpoPush_1 = require("./sendExpoPush");
const pushNotificationCopy_1 = require("./pushNotificationCopy");
async function notifyGameFinalPush(input) {
    if (input.after.pushNotifiedFinalAt)
        return;
    const targets = (0, sendExpoPush_1.uniqueAuthorTargetsFromPosts)(input.postsSnap.docs, "game_final", input.gameId);
    if (targets.length === 0) {
        await (0, sendExpoPush_1.markGamePushNotified)(input.gameId, "pushNotifiedFinalAt");
        return;
    }
    const matchup = (0, pushNotificationCopy_1.resolveGameMatchupCopy)(input.after, {
        home: input.homeScore,
        away: input.awayScore,
    });
    const result = await (0, sendExpoPush_1.sendExpoPushToUids)({
        type: "game_final",
        targets,
        matchup,
    });
    if (result.sent > 0 || targets.length === 0) {
        await (0, sendExpoPush_1.markGamePushNotified)(input.gameId, "pushNotifiedFinalAt");
    }
    console.log(`[notifyGameFinalPush] game=${input.gameId} sent=${result.sent} targets=${targets.length}`);
}
async function notifyRankingUpdatedPush(uids) {
    const unique = [...new Set(uids.filter(Boolean))];
    if (unique.length === 0)
        return;
    const targets = unique.map((uid) => ({
        uid,
        data: { type: "ranking_updated" },
    }));
    const result = await (0, sendExpoPush_1.sendExpoPushToUids)({
        type: "ranking_updated",
        targets,
    });
    console.log(`[notifyRankingUpdatedPush] sent=${result.sent} targets=${targets.length}`);
}
//# sourceMappingURL=notifyPushEvents.js.map