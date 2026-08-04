"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifyGameFinalPush = notifyGameFinalPush;
exports.notifyRankingUpdatedPush = notifyRankingUpdatedPush;
exports.notifyMonthlyReportPush = notifyMonthlyReportPush;
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
/** 月次レポート確定後 — Pro ユーザーへ（prefs.monthlyReport） */
async function notifyMonthlyReportPush(input) {
    var _a, _b;
    const unique = [...new Set(input.uids.filter(Boolean))];
    if (unique.length === 0)
        return;
    const { getFirestore } = await Promise.resolve().then(() => __importStar(require("firebase-admin/firestore")));
    const db = getFirestore();
    const proUids = [];
    for (let i = 0; i < unique.length; i += 80) {
        const chunk = unique.slice(i, i + 80);
        const refs = chunk.map((uid) => db.collection("users").doc(uid));
        const snaps = await db.getAll(...refs);
        for (const snap of snaps) {
            if (!snap.exists)
                continue;
            const plan = String((_b = (_a = snap.data()) === null || _a === void 0 ? void 0 : _a.plan) !== null && _b !== void 0 ? _b : "free").toLowerCase();
            if (plan === "pro")
                proUids.push(snap.id);
        }
    }
    if (proUids.length === 0)
        return;
    const targets = proUids.map((uid) => ({
        uid,
        data: {
            type: "monthly_report",
            monthKey: input.monthKey,
        },
    }));
    const result = await (0, sendExpoPush_1.sendExpoPushToUids)({
        type: "monthly_report",
        targets,
        matchup: {
            detail: input.monthKey,
        },
    });
    console.log(`[notifyMonthlyReportPush] month=${input.monthKey} sent=${result.sent} targets=${targets.length}`);
}
//# sourceMappingURL=notifyPushEvents.js.map