"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rebuildMonthlyReportsManualV2 = exports.rebuildMonthlyReportsCronV2 = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const https_1 = require("firebase-functions/v2/https");
const buildMonthlyReportsCore_1 = require("./buildMonthlyReportsCore");
/** 毎月 1 日 8:00 JST — 前月レポートを確定書き込み（period snapshot 後を想定） */
exports.rebuildMonthlyReportsCronV2 = (0, scheduler_1.onSchedule)({
    schedule: "0 8 1 * *",
    timeZone: "Asia/Tokyo",
    memory: "1GiB",
    timeoutSeconds: 540,
}, async () => {
    const result = await (0, buildMonthlyReportsCore_1.rebuildMonthlyReportsCore)();
    console.log(`[rebuildMonthlyReportsCronV2] month=${result.monthKey} written=${result.written}`);
});
/**
 * 手動 / Cursor 用 HTTP。
 * GET/POST ?monthKey=2026-01&limit=50
 * 本番は IAM / シークレットで保護すること（暫定: 未認証可だが limit 推奨）。
 */
exports.rebuildMonthlyReportsManualV2 = (0, https_1.onRequest)({
    region: "asia-northeast1",
    memory: "1GiB",
    timeoutSeconds: 540,
}, async (req, res) => {
    var _a, _b;
    try {
        const monthKey = typeof req.query.monthKey === "string"
            ? req.query.monthKey
            : typeof ((_a = req.body) === null || _a === void 0 ? void 0 : _a.monthKey) === "string"
                ? req.body.monthKey
                : undefined;
        const limitRaw = typeof req.query.limit === "string"
            ? Number(req.query.limit)
            : typeof ((_b = req.body) === null || _b === void 0 ? void 0 : _b.limit) === "number"
                ? req.body.limit
                : undefined;
        const limit = limitRaw != null && Number.isFinite(limitRaw) && limitRaw > 0
            ? Math.floor(limitRaw)
            : undefined;
        const result = await (0, buildMonthlyReportsCore_1.rebuildMonthlyReportsCore)({ monthKey, limit });
        res.status(200).json(Object.assign({ ok: true }, result));
    }
    catch (e) {
        console.error("[rebuildMonthlyReportsManualV2]", e);
        res.status(500).json({
            ok: false,
            error: e instanceof Error ? e.message : String(e),
        });
    }
});
//# sourceMappingURL=rebuildMonthlyReportsV2.js.map