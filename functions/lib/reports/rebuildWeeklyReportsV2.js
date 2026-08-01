"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rebuildWeeklyReportsManualV2 = exports.rebuildWeeklyReportsCronV2 = void 0;
const https_1 = require("firebase-functions/v2/https");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const buildWeeklyReportsCore_1 = require("./buildWeeklyReportsCore");
const nbaPeriod_1 = require("../rankings/nbaPeriod");
function isMondayJst(now) {
    return new Date(now.getTime() + 9 * 60 * 60 * 1000).getUTCDay() === 1;
}
/** 毎朝 08:30 JST: 今週 live、月曜のみ先週 final も確定する。 */
exports.rebuildWeeklyReportsCronV2 = (0, scheduler_1.onSchedule)({
    schedule: "30 8 * * *",
    timeZone: "Asia/Tokyo",
    memory: "1GiB",
    timeoutSeconds: 540,
}, async () => {
    const now = new Date();
    const currentWeek = (0, nbaPeriod_1.weekStartDateKeyJST)(now);
    const live = await (0, buildWeeklyReportsCore_1.buildWeeklyReportsCore)({
        weekLabel: currentWeek,
        status: "live",
        now,
    });
    console.log(`[rebuildWeeklyReportsCronV2] status=live week=${live.weekLabel} written=${live.written}`);
    if (isMondayJst(now)) {
        const final = await (0, buildWeeklyReportsCore_1.buildWeeklyReportsCore)({
            weekLabel: (0, nbaPeriod_1.previousLabel)("weekly", currentWeek),
            status: "final",
            now,
        });
        console.log(`[rebuildWeeklyReportsCronV2] status=final week=${final.weekLabel} written=${final.written}`);
    }
});
/**
 * 手動 / Cursor 用 HTTP。
 * GET/POST ?weekLabel=2026-10-19&status=final&limit=50
 */
exports.rebuildWeeklyReportsManualV2 = (0, https_1.onRequest)({
    region: "asia-northeast1",
    memory: "1GiB",
    timeoutSeconds: 540,
}, async (req, res) => {
    var _a, _b, _c;
    try {
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
        const status = rawStatus === "final" ? "final" : rawStatus === "live" ? "live" : undefined;
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
        res.status(200).json(Object.assign({ ok: true }, result));
    }
    catch (error) {
        console.error("[rebuildWeeklyReportsManualV2]", error);
        res.status(500).json({
            ok: false,
            error: error instanceof Error ? error.message : String(error),
        });
    }
});
//# sourceMappingURL=rebuildWeeklyReportsV2.js.map