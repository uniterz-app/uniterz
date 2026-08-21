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
exports.onUserCreate = exports.notifyGameStartPushCron = exports.buildCumulativeRankingSnapshotCron = exports.buildCumulativeStatsCron = exports.updateTeamRankingsDaily = exports.onPostDeletedV2 = exports.rebuildWeeklyReportsManualV2 = exports.rebuildWeeklyReportsCronV2 = exports.rebuildMonthlyReportsManualV2 = exports.rebuildMonthlyReportsCronV2 = exports.expireProUsers = exports.getCumulativeRanking = exports.onPlayoffBracketRescoreTaskCreated = exports.onPlayoffResultsWrite = exports.onGameFinalV2 = void 0;
const options_1 = require("firebase-functions/v2/options");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const firestore_1 = require("firebase-admin/firestore");
const firebase_1 = require("./firebase");
const functions = __importStar(require("firebase-functions"));
const buildCumulativeStats_1 = require("./rankings/buildCumulativeStats");
const buildCumulativeRankingSnapshot_1 = require("./rankings/buildCumulativeRankingSnapshot");
const buildNbaPeriodRankingSnapshots_1 = require("./rankings/buildNbaPeriodRankingSnapshots");
const buildGroupBattlePeriodSnapshots_1 = require("./groupBattles/buildGroupBattlePeriodSnapshots");
const grantGroupBattleUnits_1 = require("./groupBattles/grantGroupBattleUnits");
const advanceDuePhases_1 = require("./groupBattles/advanceDuePhases");
const hasRankingAggregationScheduledJstToday_1 = require("./schedule/hasRankingAggregationScheduledJstToday");
const notifyGameStartCron_1 = require("./notifications/notifyGameStartCron");
const notifyPushEvents_1 = require("./notifications/notifyPushEvents");
// ===============================
// V2 Core
// ===============================
var onGameFinalV2_1 = require("./onGameFinalV2");
Object.defineProperty(exports, "onGameFinalV2", { enumerable: true, get: function () { return onGameFinalV2_1.onGameFinalV2; } });
var onPlayoffResultsWrite_1 = require("./playoff-bracket/onPlayoffResultsWrite");
Object.defineProperty(exports, "onPlayoffResultsWrite", { enumerable: true, get: function () { return onPlayoffResultsWrite_1.onPlayoffResultsWrite; } });
var onPlayoffBracketRescoreTaskCreated_1 = require("./playoff-bracket/onPlayoffBracketRescoreTaskCreated");
Object.defineProperty(exports, "onPlayoffBracketRescoreTaskCreated", { enumerable: true, get: function () { return onPlayoffBracketRescoreTaskCreated_1.onPlayoffBracketRescoreTaskCreated; } });
var getCumulativeRanking_1 = require("./rankings/getCumulativeRanking");
Object.defineProperty(exports, "getCumulativeRanking", { enumerable: true, get: function () { return getCumulativeRanking_1.getCumulativeRanking; } });
// 🔥 Pro 期限切れユーザーを Free に戻す Cron
var expireProUsers_1 = require("./triggers/expireProUsers");
Object.defineProperty(exports, "expireProUsers", { enumerable: true, get: function () { return expireProUsers_1.expireProUsers; } });
// 🔥 Pro 月次レポート（user_reports）
var rebuildMonthlyReportsV2_1 = require("./reports/rebuildMonthlyReportsV2");
Object.defineProperty(exports, "rebuildMonthlyReportsCronV2", { enumerable: true, get: function () { return rebuildMonthlyReportsV2_1.rebuildMonthlyReportsCronV2; } });
Object.defineProperty(exports, "rebuildMonthlyReportsManualV2", { enumerable: true, get: function () { return rebuildMonthlyReportsV2_1.rebuildMonthlyReportsManualV2; } });
var rebuildWeeklyReportsV2_1 = require("./reports/rebuildWeeklyReportsV2");
Object.defineProperty(exports, "rebuildWeeklyReportsCronV2", { enumerable: true, get: function () { return rebuildWeeklyReportsV2_1.rebuildWeeklyReportsCronV2; } });
Object.defineProperty(exports, "rebuildWeeklyReportsManualV2", { enumerable: true, get: function () { return rebuildWeeklyReportsV2_1.rebuildWeeklyReportsManualV2; } });
// ===============================
// Global
// ===============================
(0, options_1.setGlobalOptions)({ region: "asia-northeast1", maxInstances: 10 });
/* ============================================================================
 * posts
 * ==========================================================================*/
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
 * Cumulative Stats reconcile (15:40) — JST 当日に NBA 試合がある日
 * 確定時インクリメントの照合。日次合計と不一致なら cumulative_stats を上書き修復。
 * ==========================================================================*/
exports.buildCumulativeStatsCron = (0, scheduler_1.onSchedule)({
    schedule: "40 15 * * *",
    timeZone: "Asia/Tokyo",
    memory: "1GiB",
    timeoutSeconds: 540,
}, async () => {
    if (!(await (0, hasRankingAggregationScheduledJstToday_1.hasRankingAggregationScheduledJstToday)())) {
        console.log("[buildCumulativeStatsCron] skip: no NBA games scheduled this JST date");
        return;
    }
    await (0, buildCumulativeStats_1.buildCumulativeStats)();
});
/* ============================================================================
 * Cumulative Ranking Snapshot (16:00) — JST 当日に NBA 試合がある日
 * 連勝はこの時点の「今日確定投稿者 × 連勝>0」でスナップショット化
 * ==========================================================================*/
exports.buildCumulativeRankingSnapshotCron = (0, scheduler_1.onSchedule)({ schedule: "0 16 * * *", timeZone: "Asia/Tokyo" }, async () => {
    var _a;
    const hasGamesToday = await (0, hasRankingAggregationScheduledJstToday_1.hasRankingAggregationScheduledJstToday)();
    if (hasGamesToday) {
        const snapshotResult = await (0, buildCumulativeRankingSnapshot_1.buildCumulativeRankingSnapshot)();
        const revalidateUrl = process.env.NEXT_REVALIDATE_CUMULATIVE_RANKING_URL;
        const token = process.env.INTERNAL_REVALIDATE_SECRET;
        if (!revalidateUrl || !token) {
            console.warn("[buildCumulativeRankingSnapshotCron] skip revalidate (missing NEXT_REVALIDATE_CUMULATIVE_RANKING_URL or INTERNAL_REVALIDATE_SECRET)");
        }
        else {
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
                const message = err instanceof Error ? err.message : String(err !== null && err !== void 0 ? err : "");
                console.error(`[buildCumulativeRankingSnapshotCron] revalidate error: ${message}`);
            }
        }
        try {
            await (0, notifyPushEvents_1.notifyRankingUpdatedPush)((_a = snapshotResult.notifiedUids) !== null && _a !== void 0 ? _a : []);
        }
        catch (err) {
            console.error("[buildCumulativeRankingSnapshotCron] push notify failed", err);
        }
    }
    else {
        console.log("[buildCumulativeRankingSnapshotCron] skip cumulative: no NBA games scheduled this JST date");
    }
    // 期間スナップショット + Unit 付与は無試合日も実行（猶予後の確定付与のため）
    try {
        await (0, buildNbaPeriodRankingSnapshots_1.buildNbaPeriodRankingSnapshots)();
    }
    catch (err) {
        console.error("[buildCumulativeRankingSnapshotCron] period snapshots failed", err);
    }
    try {
        await (0, advanceDuePhases_1.advanceDueGroupBattlePhases)();
        await (0, buildGroupBattlePeriodSnapshots_1.buildGroupBattlePeriodSnapshots)();
        await (0, grantGroupBattleUnits_1.grantAllFinalGroupBattleUnits)();
    }
    catch (err) {
        console.error("[buildCumulativeRankingSnapshotCron] group battle snapshots/units failed", err);
    }
});
/* ============================================================================
 * Game start push (10 min) — 15 分以内に開始する試合の予想者へ
 * ==========================================================================*/
exports.notifyGameStartPushCron = (0, scheduler_1.onSchedule)({ schedule: "*/10 * * * *", timeZone: "Asia/Tokyo" }, async () => {
    try {
        await (0, notifyGameStartCron_1.runNotifyGameStartCron)();
    }
    catch (err) {
        console.error("[notifyGameStartPushCron] failed", err);
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