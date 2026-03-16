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
exports.onUserCreate = exports.runDailyAnalyticsHttp = exports.xmasNba20251226 = exports.listUserStatsIds = exports.fixUserStats = exports.runDailyAnalytics = exports.logUserActive = exports.dailyAnalytics = exports.updateTeamRankingsDaily = exports.aggregateHitPostsTodayNBACron = exports.aggregateUsersTrendCron = exports.aggregateTrendsGamesCron = exports.aggregateTrendsGames = exports.onPostDeletedV2 = exports.onPostCreatedV2 = exports.onFollowingRemoved = exports.onFollowingAdded = exports.onFollowerRemoved = exports.onFollowerAdded = exports.rebuildLeaderboardAllTimeCron = exports.rebuildLeaderboardAllTimeV2 = exports.rebuildUserMonthlyStatsMonthCronV2 = exports.rebuildUserMonthlyStatsV2 = exports.rebuildLeaderboardMonthV2 = exports.rebuildLeaderboardWeekV2 = exports.rebuildCalendarLeaderboardsHttpV2 = exports.expireProUsers = exports.rebuildPlayoffBracketMarket = exports.onPlayoffResultsWrite = exports.rescorePlayoffBrackets = exports.rebuildUsersTrend = exports.onGameFinalV2 = void 0;
// functions/src/index.ts
const options_1 = require("firebase-functions/v2/options");
const https_1 = require("firebase-functions/v2/https");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const firestore_1 = require("firebase-functions/v2/firestore");
const firestore_2 = require("firebase-admin/firestore");
const firebase_1 = require("./firebase");
const games_aggregate_1 = require("./trend/games.aggregate");
const _core_1 = require("./analytics/_core");
const users_aggregate_1 = require("./trend/users.aggregate");
const hitPosts_aggregate_1 = require("./trend/hitPosts.aggregate");
const functions = __importStar(require("firebase-functions"));
// ===============================
// V2 Core
// ===============================
var onGameFinalV2_1 = require("./onGameFinalV2");
Object.defineProperty(exports, "onGameFinalV2", { enumerable: true, get: function () { return onGameFinalV2_1.onGameFinalV2; } });
var users_rebuild_1 = require("./trend/users.rebuild");
Object.defineProperty(exports, "rebuildUsersTrend", { enumerable: true, get: function () { return users_rebuild_1.rebuildUsersTrend; } });
var rescorePlayoffBrackets_1 = require("./playoff/rescorePlayoffBrackets");
Object.defineProperty(exports, "rescorePlayoffBrackets", { enumerable: true, get: function () { return rescorePlayoffBrackets_1.rescorePlayoffBrackets; } });
var onPlayoffResultsWrite_1 = require("./playoff/onPlayoffResultsWrite");
Object.defineProperty(exports, "onPlayoffResultsWrite", { enumerable: true, get: function () { return onPlayoffResultsWrite_1.onPlayoffResultsWrite; } });
var rebuildPlayoffBracketMarket_1 = require("./playoff/rebuildPlayoffBracketMarket");
Object.defineProperty(exports, "rebuildPlayoffBracketMarket", { enumerable: true, get: function () { return rebuildPlayoffBracketMarket_1.rebuildPlayoffBracketMarket; } });
// 🔥 Pro 期限切れユーザーを Free に戻す Cron
var expireProUsers_1 = require("./triggers/expireProUsers");
Object.defineProperty(exports, "expireProUsers", { enumerable: true, get: function () { return expireProUsers_1.expireProUsers; } });
// 🔥 週間・月間ランキング（V2）
var leaderboards_calendar_v2_1 = require("./triggers/leaderboards.calendar.v2");
Object.defineProperty(exports, "rebuildCalendarLeaderboardsHttpV2", { enumerable: true, get: function () { return leaderboards_calendar_v2_1.rebuildCalendarLeaderboardsHttpV2; } });
Object.defineProperty(exports, "rebuildLeaderboardWeekV2", { enumerable: true, get: function () { return leaderboards_calendar_v2_1.rebuildLeaderboardWeekV2; } });
Object.defineProperty(exports, "rebuildLeaderboardMonthV2", { enumerable: true, get: function () { return leaderboards_calendar_v2_1.rebuildLeaderboardMonthV2; } });
// 🔥 ユーザー月次スタッツ（Pro用）
var rebuildUserMonthlyStatsV2_1 = require("./stats/rebuildUserMonthlyStatsV2");
Object.defineProperty(exports, "rebuildUserMonthlyStatsV2", { enumerable: true, get: function () { return rebuildUserMonthlyStatsV2_1.rebuildUserMonthlyStatsV2; } });
Object.defineProperty(exports, "rebuildUserMonthlyStatsMonthCronV2", { enumerable: true, get: function () { return rebuildUserMonthlyStatsV2_1.rebuildUserMonthlyStatsMonthCronV2; } });
// 🔥 オールタイムランキング（V2）
var leaderboards_alltime_v2_1 = require("./triggers/leaderboards.alltime.v2");
Object.defineProperty(exports, "rebuildLeaderboardAllTimeV2", { enumerable: true, get: function () { return leaderboards_alltime_v2_1.rebuildLeaderboardAllTimeV2; } });
Object.defineProperty(exports, "rebuildLeaderboardAllTimeCron", { enumerable: true, get: function () { return leaderboards_alltime_v2_1.rebuildLeaderboardAllTimeCron; } });
// ===============================
// Global
// ===============================
(0, options_1.setGlobalOptions)({ region: "asia-northeast1", maxInstances: 10 });
const db = firebase_1.admin.firestore();
/* ============================================================================
 * followers / following
 * ==========================================================================*/
exports.onFollowerAdded = (0, firestore_1.onDocumentCreated)("users/{uid}/followers/{followerUid}", async (event) => {
    const { uid, followerUid } = event.params;
    try {
        await db.doc(`users/${uid}`).set({ counts: { followers: firestore_2.FieldValue.increment(1) } }, { merge: true });
        await db.collection("events_follow").add({
            targetUid: uid,
            actorUid: followerUid,
            op: "follow",
            createdAt: firestore_2.FieldValue.serverTimestamp(),
        });
    }
    catch (e) {
        console.error("[onFollowerAdded] failed:", e);
    }
});
exports.onFollowerRemoved = (0, firestore_1.onDocumentDeleted)("users/{uid}/followers/{followerUid}", async (event) => {
    const { uid } = event.params;
    try {
        await db.doc(`users/${uid}`).set({ counts: { followers: firestore_2.FieldValue.increment(-1) } }, { merge: true });
    }
    catch (e) {
        console.error("[onFollowerRemoved] failed:", e);
    }
});
exports.onFollowingAdded = (0, firestore_1.onDocumentCreated)("users/{ownerUid}/following/{targetUid}", async (event) => {
    const { ownerUid } = event.params;
    try {
        await db.doc(`users/${ownerUid}`).set({ counts: { following: firestore_2.FieldValue.increment(1) } }, { merge: true });
    }
    catch (e) {
        console.error("[onFollowingAdded] failed:", e);
    }
});
exports.onFollowingRemoved = (0, firestore_1.onDocumentDeleted)("users/{ownerUid}/following/{targetUid}", async (event) => {
    const { ownerUid } = event.params;
    try {
        await db.doc(`users/${ownerUid}`).set({ counts: { following: firestore_2.FieldValue.increment(-1) } }, { merge: true });
    }
    catch (e) {
        console.error("[onFollowingRemoved] failed:", e);
    }
});
/* ============================================================================
 * posts
 * ==========================================================================*/
var onPostCreated_1 = require("./onPostCreated");
Object.defineProperty(exports, "onPostCreatedV2", { enumerable: true, get: function () { return onPostCreated_1.onPostCreatedV2; } });
var onPostDeleted_1 = require("./onPostDeleted");
Object.defineProperty(exports, "onPostDeletedV2", { enumerable: true, get: function () { return onPostDeleted_1.onPostDeletedV2; } });
/* ============================================================================
 * トレンド（Games）
 * ==========================================================================*/
exports.aggregateTrendsGames = (0, https_1.onRequest)(async (_req, res) => {
    var _a;
    try {
        const result = await (0, games_aggregate_1.aggregateGamesTrend)();
        res.status(200).json(result);
    }
    catch (e) {
        res.status(500).json({ ok: false, error: (_a = e === null || e === void 0 ? void 0 : e.message) !== null && _a !== void 0 ? _a : "failed" });
    }
});
exports.aggregateTrendsGamesCron = (0, scheduler_1.onSchedule)({ schedule: "0 * * * *", timeZone: "Asia/Tokyo" }, async () => {
    await (0, games_aggregate_1.aggregateGamesTrend)(); // return しない
});
exports.aggregateUsersTrendCron = (0, scheduler_1.onSchedule)({ schedule: "0 0 * * *", timeZone: "Asia/Tokyo" }, // 毎日24:00
async () => {
    await (0, users_aggregate_1.aggregateUsersTrend)();
});
/* ============================================================================
 * Hit Posts Trend (NBA / Today)
 * ==========================================================================*/
exports.aggregateHitPostsTodayNBACron = (0, scheduler_1.onSchedule)({
    schedule: "30 15 * * *", // ★ 15:30 JST
    timeZone: "Asia/Tokyo",
}, async () => {
    await (0, hitPosts_aggregate_1.aggregateHitPostsTodayNBA)();
});
/* ============================================================================
 * Team Rankings (Daily)
 * ==========================================================================*/
const updateTeamRankings_1 = require("./ranking/updateTeamRankings");
exports.updateTeamRankingsDaily = (0, scheduler_1.onSchedule)({ schedule: "0 0 * * *", timeZone: "Asia/Tokyo" }, async () => {
    await (0, updateTeamRankings_1.updateTeamRankings)();
});
/* ============================================================================
 * Analytics
 * ==========================================================================*/
var daily_1 = require("./analytics/daily");
Object.defineProperty(exports, "dailyAnalytics", { enumerable: true, get: function () { return daily_1.dailyAnalytics; } });
var logUserActive_1 = require("./analytics/logUserActive");
Object.defineProperty(exports, "logUserActive", { enumerable: true, get: function () { return logUserActive_1.logUserActive; } });
var runDaily_1 = require("./analytics/runDaily");
Object.defineProperty(exports, "runDailyAnalytics", { enumerable: true, get: function () { return runDaily_1.runDailyAnalytics; } });
var fixUserStats_1 = require("./fixUserStats");
Object.defineProperty(exports, "fixUserStats", { enumerable: true, get: function () { return fixUserStats_1.fixUserStats; } });
// ============================================================
// Debug: 全ユーザーを一括で再計算する HTTP エンドポイント
// ============================================================
var listUserStats_1 = require("./debug/listUserStats");
Object.defineProperty(exports, "listUserStatsIds", { enumerable: true, get: function () { return listUserStats_1.listUserStatsIds; } });
var xmasNba20251226_1 = require("./debug/xmasNba20251226");
Object.defineProperty(exports, "xmasNba20251226", { enumerable: true, get: function () { return xmasNba20251226_1.xmasNba20251226; } });
exports.runDailyAnalyticsHttp = (0, https_1.onRequest)(async (_req, res) => {
    try {
        const result = await (0, _core_1.dailyAnalyticsCore)();
        res.status(200).json({ ok: true, result });
    }
    catch (err) {
        res.status(500).json({ ok: false, error: String(err) });
    }
});
exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
    const db = firebase_1.admin.firestore();
    await db.collection("users").doc(user.uid).set({
        plan: "free",
        proUntil: null,
        createdAt: firestore_2.FieldValue.serverTimestamp(),
    });
});
//# sourceMappingURL=index.js.map