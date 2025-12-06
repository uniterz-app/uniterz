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
exports.seedTeamsHttp = exports.runDailyAnalyticsHttp = exports.runDailyAnalytics = exports.logUserActive = exports.dailyAnalytics = exports.rebuildLeaderboardV2Cron = exports.recomputeAllUsersStatsV2Daily = exports.rebuildUserStatsDailyCron = exports.onGameFinalV2 = exports.onGameFinal = exports.aggregateTrendsUsersCron = exports.aggregateTrendsUsers = exports.aggregateTrendsGamesCron = exports.aggregateTrendsGames = exports.rebuildCalendarLeaderboardsCronWeek = exports.rebuildCalendarLeaderboardsCronMonth = exports.rebuildCalendarLeaderboardsHttp = exports.onPostDeleted = exports.onPostCreated = exports.onFollowingRemoved = exports.onFollowingAdded = exports.onFollowerRemoved = exports.onFollowerAdded = void 0;
// functions/src/index.ts
const options_1 = require("firebase-functions/v2/options");
const https_1 = require("firebase-functions/v2/https");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const firestore_1 = require("firebase-functions/v2/firestore");
const admin = __importStar(require("firebase-admin"));
const firestore_2 = require("firebase-admin/firestore");
const games_aggregate_1 = require("./trend/games.aggregate");
const users_aggregate_1 = require("./trend/users.aggregate");
const updateUserStats_1 = require("./updateUserStats");
const _core_1 = require("./analytics/_core");
const seedTeams_1 = require("./seed/seedTeams");
// ★★★ onGameFinal を確実に有効化する import
const onGameFinal_1 = require("./onGameFinal");
Object.defineProperty(exports, "onGameFinal", { enumerable: true, get: function () { return onGameFinal_1.onGameFinal; } });
// ✅ V2 追加
const onGameFinalV2_1 = require("./onGameFinalV2");
Object.defineProperty(exports, "onGameFinalV2", { enumerable: true, get: function () { return onGameFinalV2_1.onGameFinalV2; } });
const updateUserStatsV2_1 = require("./updateUserStatsV2");
Object.defineProperty(exports, "recomputeAllUsersStatsV2Daily", { enumerable: true, get: function () { return updateUserStatsV2_1.recomputeAllUsersStatsV2Daily; } });
const leaderboards_calendar_v2_1 = require("./triggers/leaderboards.calendar.v2");
Object.defineProperty(exports, "rebuildLeaderboardV2Cron", { enumerable: true, get: function () { return leaderboards_calendar_v2_1.rebuildLeaderboardV2Cron; } });
// ====== Global Options / Admin ======
(0, options_1.setGlobalOptions)({ region: "asia-northeast1", maxInstances: 10 });
admin.initializeApp();
const db = admin.firestore();
/* ============================================================================
 * followers / following のカウント反映
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
var onPostCreated_1 = require("./onPostCreated");
Object.defineProperty(exports, "onPostCreated", { enumerable: true, get: function () { return onPostCreated_1.onPostCreated; } });
var onPostDeleted_1 = require("./onPostDeleted");
Object.defineProperty(exports, "onPostDeleted", { enumerable: true, get: function () { return onPostDeleted_1.onPostDeleted; } });
/* ============================================================================
 * 🔽 カレンダーベース・ランキング再集計
 * ==========================================================================*/
var leaderboards_calendar_1 = require("./triggers/leaderboards.calendar");
Object.defineProperty(exports, "rebuildCalendarLeaderboardsHttp", { enumerable: true, get: function () { return leaderboards_calendar_1.rebuildCalendarLeaderboardsHttp; } });
Object.defineProperty(exports, "rebuildCalendarLeaderboardsCronMonth", { enumerable: true, get: function () { return leaderboards_calendar_1.rebuildCalendarLeaderboardsCronMonth; } });
Object.defineProperty(exports, "rebuildCalendarLeaderboardsCronWeek", { enumerable: true, get: function () { return leaderboards_calendar_1.rebuildCalendarLeaderboardsCronWeek; } });
/* ============================================================================
 * トレンド集計（Games / HTTP & Cron）
 * ==========================================================================*/
exports.aggregateTrendsGames = (0, https_1.onRequest)(async (_req, res) => {
    var _a;
    try {
        const result = await (0, games_aggregate_1.aggregateGamesTrend)();
        res.status(200).json(result);
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ ok: false, error: (_a = e === null || e === void 0 ? void 0 : e.message) !== null && _a !== void 0 ? _a : "failed" });
    }
});
exports.aggregateTrendsGamesCron = (0, scheduler_1.onSchedule)({ schedule: "0 * * * *", timeZone: "Asia/Tokyo" }, async () => {
    await (0, games_aggregate_1.aggregateGamesTrend)();
});
/* ============================================================================
 * トレンド集計（Users / HTTP & Cron）
 * ==========================================================================*/
exports.aggregateTrendsUsers = (0, https_1.onRequest)(async (req, res) => {
    var _a, _b;
    try {
        const windowHours = Number((_a = req.query.windowHours) !== null && _a !== void 0 ? _a : 72);
        const result = await (0, users_aggregate_1.aggregateUsersTrend)(windowHours);
        res.status(200).json(result);
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ ok: false, error: (_b = e === null || e === void 0 ? void 0 : e.message) !== null && _b !== void 0 ? _b : "failed" });
    }
});
exports.aggregateTrendsUsersCron = (0, scheduler_1.onSchedule)({ schedule: "0 * * * *", timeZone: "Asia/Tokyo" }, async () => {
    await (0, users_aggregate_1.aggregateUsersTrend)(72);
});
/* ============================================================================
 * NEW: 毎日1回、user_stats 再集計
 * ==========================================================================*/
// ✅ V1
exports.rebuildUserStatsDailyCron = (0, scheduler_1.onSchedule)({ schedule: "10 4 * * *", timeZone: "Asia/Tokyo" }, async () => {
    console.log("[rebuildUserStatsDailyCron] start");
    try {
        const snap = await db.collection("users").select().get();
        for (const docSnap of snap.docs) {
            const uid = docSnap.id;
            try {
                await (0, updateUserStats_1.recomputeUserStatsFromDaily)(uid);
            }
            catch (e) {
                console.error(`[rebuildUserStatsDailyCron] failed for uid=${uid}`, e);
            }
        }
        console.log(`[rebuildUserStatsDailyCron] done. processed users=${snap.size}`);
    }
    catch (e) {
        console.error("[rebuildUserStatsDailyCron] fatal error", e);
    }
});
/* ============================================================================
 * その他 Analytics
 * ==========================================================================*/
var daily_1 = require("./analytics/daily");
Object.defineProperty(exports, "dailyAnalytics", { enumerable: true, get: function () { return daily_1.dailyAnalytics; } });
var logUserActive_1 = require("./analytics/logUserActive");
Object.defineProperty(exports, "logUserActive", { enumerable: true, get: function () { return logUserActive_1.logUserActive; } });
var runDaily_1 = require("./analytics/runDaily");
Object.defineProperty(exports, "runDailyAnalytics", { enumerable: true, get: function () { return runDaily_1.runDailyAnalytics; } });
// ==========================
// 手動実行できる Daily Analytics HTTP 関数
// ==========================
exports.runDailyAnalyticsHttp = (0, https_1.onRequest)(async (req, res) => {
    try {
        const result = await (0, _core_1.dailyAnalyticsCore)();
        res.status(200).json({ ok: true, result });
    }
    catch (err) {
        console.error("[runDailyAnalyticsHttp] failed:", err);
        res.status(500).json({ ok: false, error: String(err) });
    }
});
/* ============================================================================
 * 手動 Seed: teams JSON を Firestore に一括投入
 * ==========================================================================*/
exports.seedTeamsHttp = (0, https_1.onRequest)(async (_req, res) => {
    try {
        await (0, seedTeams_1.seedTeams)();
        res.status(200).json({ ok: true });
    }
    catch (err) {
        console.error("[seedTeamsHttp] failed:", err);
        res.status(500).json({ ok: false, error: String(err) });
    }
});
//# sourceMappingURL=index.js.map