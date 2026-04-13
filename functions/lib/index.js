"use strict";
// functions/src/index.ts
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
exports.onUserCreate = exports.runDailyAnalyticsHttp = exports.xmasNba20251226 = exports.listUserStatsIds = exports.fixUserStats = exports.runDailyAnalytics = exports.dailyAnalytics = exports.buildUserStatsWindowCacheCron = exports.buildMonthlyLeaderboardSnapshotCron = exports.buildCumulativeRankingSnapshotCron = exports.buildCumulativeStatsCron = exports.updateTeamRankingsDaily = exports.onPostDeletedV2 = exports.onPostCreatedV2 = exports.rebuildUserMonthlyStatsMonthCronV2 = exports.rebuildUserMonthlyStatsV2 = exports.expireProUsers = exports.rebuildMonthlyLeaderboardsHttp = exports.rebuildMonthlyLeaderboardsCron = exports.getMonthlyLeaderboard = exports.getCumulativeRanking = exports.rebuildPlayoffBracketMarket = exports.onPlayoffResultsWrite = exports.rescorePlayoffBrackets = exports.onGameFinalV2 = void 0;
const options_1 = require("firebase-functions/v2/options");
const https_1 = require("firebase-functions/v2/https");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const firestore_1 = require("firebase-admin/firestore");
const firebase_1 = require("./firebase");
const _core_1 = require("./analytics/_core");
const functions = __importStar(require("firebase-functions"));
const buildCumulativeStats_1 = require("./rankings/buildCumulativeStats");
const buildCumulativeRankingSnapshot_1 = require("./rankings/buildCumulativeRankingSnapshot");
// ★追加
const buildMonthlyLeaderboardSnapshot_1 = require("./leaderboards/buildMonthlyLeaderboardSnapshot");
const jstLeaderboardMonth_1 = require("./leaderboards/jstLeaderboardMonth");
const buildUserStatsWindowCache_1 = require("./stats/buildUserStatsWindowCache");
// ===============================
// V2 Core
// ===============================
var onGameFinalV2_1 = require("./onGameFinalV2");
Object.defineProperty(exports, "onGameFinalV2", { enumerable: true, get: function () { return onGameFinalV2_1.onGameFinalV2; } });
var rescorePlayoffBrackets_1 = require("./playoff-bracket/rescorePlayoffBrackets");
Object.defineProperty(exports, "rescorePlayoffBrackets", { enumerable: true, get: function () { return rescorePlayoffBrackets_1.rescorePlayoffBrackets; } });
var onPlayoffResultsWrite_1 = require("./playoff-bracket/onPlayoffResultsWrite");
Object.defineProperty(exports, "onPlayoffResultsWrite", { enumerable: true, get: function () { return onPlayoffResultsWrite_1.onPlayoffResultsWrite; } });
var rebuildPlayoffBracketMarket_1 = require("./playoff-bracket/rebuildPlayoffBracketMarket");
Object.defineProperty(exports, "rebuildPlayoffBracketMarket", { enumerable: true, get: function () { return rebuildPlayoffBracketMarket_1.rebuildPlayoffBracketMarket; } });
var getCumulativeRanking_1 = require("./rankings/getCumulativeRanking");
Object.defineProperty(exports, "getCumulativeRanking", { enumerable: true, get: function () { return getCumulativeRanking_1.getCumulativeRanking; } });
var getMonthlyLeaderboard_1 = require("./leaderboards/getMonthlyLeaderboard");
Object.defineProperty(exports, "getMonthlyLeaderboard", { enumerable: true, get: function () { return getMonthlyLeaderboard_1.getMonthlyLeaderboard; } });
var monthly_1 = require("./leaderboards/monthly");
Object.defineProperty(exports, "rebuildMonthlyLeaderboardsCron", { enumerable: true, get: function () { return monthly_1.rebuildMonthlyLeaderboardsCron; } });
Object.defineProperty(exports, "rebuildMonthlyLeaderboardsHttp", { enumerable: true, get: function () { return monthly_1.rebuildMonthlyLeaderboardsHttp; } });
// 🔥 Pro 期限切れユーザーを Free に戻す Cron
var expireProUsers_1 = require("./triggers/expireProUsers");
Object.defineProperty(exports, "expireProUsers", { enumerable: true, get: function () { return expireProUsers_1.expireProUsers; } });
// 🔥 ユーザー月次スタッツ（Pro用）
var rebuildUserMonthlyStatsV2_1 = require("./stats/rebuildUserMonthlyStatsV2");
Object.defineProperty(exports, "rebuildUserMonthlyStatsV2", { enumerable: true, get: function () { return rebuildUserMonthlyStatsV2_1.rebuildUserMonthlyStatsV2; } });
Object.defineProperty(exports, "rebuildUserMonthlyStatsMonthCronV2", { enumerable: true, get: function () { return rebuildUserMonthlyStatsV2_1.rebuildUserMonthlyStatsMonthCronV2; } });
// ===============================
// Global
// ===============================
(0, options_1.setGlobalOptions)({ region: "asia-northeast1", maxInstances: 10 });
const db = firebase_1.admin.firestore();
/* ============================================================================
 * posts
 * ==========================================================================*/
var onPostCreated_1 = require("./onPostCreated");
Object.defineProperty(exports, "onPostCreatedV2", { enumerable: true, get: function () { return onPostCreated_1.onPostCreatedV2; } });
var onPostDeleted_1 = require("./onPostDeleted");
Object.defineProperty(exports, "onPostDeletedV2", { enumerable: true, get: function () { return onPostDeleted_1.onPostDeletedV2; } });
/* ============================================================================
 * Team Rankings (16:00 JST — only when NBA has games that calendar day)
 * ==========================================================================*/
const runTeamRankingsCron_1 = require("./team-standing/runTeamRankingsCron");
exports.updateTeamRankingsDaily = (0, scheduler_1.onSchedule)({ schedule: "0 16 * * *", timeZone: "Asia/Tokyo" }, async () => {
    await (0, runTeamRankingsCron_1.runTeamRankingsCronIfNbaGamesToday)();
});
/* ============================================================================
 * Cumulative Stats (15:40)
 * ==========================================================================*/
exports.buildCumulativeStatsCron = (0, scheduler_1.onSchedule)({ schedule: "40 15 * * *", timeZone: "Asia/Tokyo" }, async () => {
    await (0, buildCumulativeStats_1.buildCumulativeStats)();
});
/* ============================================================================
 * Cumulative Ranking Snapshot (15:55)
 * ==========================================================================*/
exports.buildCumulativeRankingSnapshotCron = (0, scheduler_1.onSchedule)({ schedule: "55 15 * * *", timeZone: "Asia/Tokyo" }, async () => {
    var _a;
    await (0, buildCumulativeRankingSnapshot_1.buildCumulativeRankingSnapshot)();
    const revalidateUrl = process.env.NEXT_REVALIDATE_CUMULATIVE_RANKING_URL;
    const token = process.env.INTERNAL_REVALIDATE_SECRET;
    if (!revalidateUrl || !token) {
        console.warn("[buildCumulativeRankingSnapshotCron] skip revalidate (missing NEXT_REVALIDATE_CUMULATIVE_RANKING_URL or INTERNAL_REVALIDATE_SECRET)");
        return;
    }
    try {
        const res = await fetch(revalidateUrl, {
            method: "POST",
            headers: { "x-revalidate-token": token },
        });
        if (!res.ok) {
            const body = await res.text().catch(() => "");
            console.error(`[buildCumulativeRankingSnapshotCron] revalidate failed: ${res.status} ${body}`);
        }
        else {
            console.log("[buildCumulativeRankingSnapshotCron] revalidate success");
        }
    }
    catch (err) {
        console.error(`[buildCumulativeRankingSnapshotCron] revalidate error: ${String((_a = err === null || err === void 0 ? void 0 : err.message) !== null && _a !== void 0 ? _a : err)}`);
    }
});
/* ============================================================================
 * Monthly Leaderboard Snapshot（★追加）
 * 毎月1日 04:05 → 前月分を確定
 * ==========================================================================*/
exports.buildMonthlyLeaderboardSnapshotCron = (0, scheduler_1.onSchedule)({ schedule: "0 4 1 * *", timeZone: "Asia/Tokyo" }, async () => {
    const month = (0, jstLeaderboardMonth_1.getLeaderboardLatestMonthKey)();
    const LEAGUES = ["nba", "j1", "bj"];
    for (const league of LEAGUES) {
        await (0, buildMonthlyLeaderboardSnapshot_1.buildMonthlyLeaderboardSnapshot)({ league, month });
    }
});
/* ============================================================================
 * User Stats Window Cache（7d/30d ロールアップ）
 * 毎日 05:00 にプリウォーム
 * ==========================================================================*/
exports.buildUserStatsWindowCacheCron = (0, scheduler_1.onSchedule)({ schedule: "0 5 * * *", timeZone: "Asia/Tokyo" }, async () => {
    const { ok, err } = await (0, buildUserStatsWindowCache_1.buildAllUsersWindowCache)();
    console.log(`[buildUserStatsWindowCacheCron] ok=${ok} err=${err}`);
});
/* ============================================================================
 * Analytics
 * ==========================================================================*/
var daily_1 = require("./analytics/daily");
Object.defineProperty(exports, "dailyAnalytics", { enumerable: true, get: function () { return daily_1.dailyAnalytics; } });
var runDaily_1 = require("./analytics/runDaily");
Object.defineProperty(exports, "runDailyAnalytics", { enumerable: true, get: function () { return runDaily_1.runDailyAnalytics; } });
var fixUserStats_1 = require("./fixUserStats");
Object.defineProperty(exports, "fixUserStats", { enumerable: true, get: function () { return fixUserStats_1.fixUserStats; } });
/* ============================================================================
 * Debug
 * ==========================================================================*/
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
        createdAt: firestore_1.FieldValue.serverTimestamp(),
    });
});
//# sourceMappingURL=index.js.map