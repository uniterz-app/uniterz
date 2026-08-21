"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rebuildWeeklyReportsManualV2 = exports.rebuildWeeklyReportsCronV2 = void 0;
const https_1 = require("firebase-functions/v2/https");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const params_1 = require("firebase-functions/params");
const buildWeeklyReportsCore_1 = require("./buildWeeklyReportsCore");
const nbaPeriod_1 = require("../rankings/nbaPeriod");
const assertManualJobAuth_1 = require("../http/assertManualJobAuth");
const INTERNAL_JOB_SECRET = (0, params_1.defineSecret)("INTERNAL_JOB_SECRET");
function isMondayJst(now) {
    return new Date(now.getTime() + 9 * 60 * 60 * 1000).getUTCDay() === 1;
}
/**
 * 月曜 08:30 JST のみ: 先週の週間レポートを final 確定する。
 * （進行中 live 日次更新は廃止。確定週だけを履歴に残す）
 */
exports.rebuildWeeklyReportsCronV2 = (0, scheduler_1.onSchedule)({
    schedule: "30 8 * * 1",
    timeZone: "Asia/Tokyo",
    memory: "1GiB",
    timeoutSeconds: 540,
}, async () => {
    const now = new Date();
    if (!isMondayJst(now)) {
        console.log("[rebuildWeeklyReportsCronV2] skip: not Monday JST");
        return;
    }
    const currentWeek = (0, nbaPeriod_1.weekStartDateKeyJST)(now);
    const final = await (0, buildWeeklyReportsCore_1.buildWeeklyReportsCore)({
        weekLabel: (0, nbaPeriod_1.previousLabel)("weekly", currentWeek),
        status: "final",
        now,
    });
    console.log(`[rebuildWeeklyReportsCronV2] status=final week=${final.weekLabel} written=${final.written}`);
});
/**
 * 手動 / Cursor 用 HTTP。
 * GET/POST ?weekLabel=2026-10-19&status=final&limit=50
 * 要ヘッダ: x-internal-job-secret（Secret: INTERNAL_JOB_SECRET）
 */
exports.rebuildWeeklyReportsManualV2 = (0, https_1.onRequest)({
    region: "asia-northeast1",
    memory: "1GiB",
    timeoutSeconds: 540,
    secrets: [INTERNAL_JOB_SECRET],
}, async (req, res) => {
    var _a, _b, _c;
    try {
        (0, assertManualJobAuth_1.assertManualJobAuth)(req);
        const weekLabel = typeof req.query.weekLabel === "string"
            ? req.query.weekLabel
            : typeof ((_a = req.body) === null || _a === void 0 ? void 0 : _a.weekLabel) === "string"
                ? req.body.weekLabel
                : undefined;
        const rawStatus = typeof req.query.status === "string"
            ? req.query.status
            : typeof ((_b = req.body) === null || _b === void 0 ? void 0 : _b.status) === "string"
                ? req.body.status
                : undefined;
        const status = rawStatus === "live" ? "live" : rawStatus === "final" ? "final" : "final";
        const rawLimit = typeof req.query.limit === "string"
            ? Number(req.query.limit)
            : typeof ((_c = req.body) === null || _c === void 0 ? void 0 : _c.limit) === "number"
                ? req.body.limit
                : undefined;
        const limit = rawLimit != null && Number.isFinite(rawLimit) && rawLimit > 0
            ? Math.floor(rawLimit)
            : undefined;
        const result = await (0, buildWeeklyReportsCore_1.buildWeeklyReportsCore)({ weekLabel, status, limit });
        console.log(`[rebuildWeeklyReportsManualV2] status=${result.status} week=${result.weekLabel} written=${result.written}`);
        res.status(200).json(result);
    }
    catch (e) {
        const status = e instanceof Error &&
            typeof e.status === "number"
            ? e.status
            : 500;
        if (status === 403 || status === 503) {
            res.status(status).json({
                error: e instanceof Error ? e.message : String(e),
            });
            return;
        }
        console.error("[rebuildWeeklyReportsManualV2]", e);
        res.status(500).json({
            error: e instanceof Error ? e.message : String(e),
        });
    }
});
//# sourceMappingURL=rebuildWeeklyReportsV2.js.map