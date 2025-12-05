"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runDailyAnalytics = void 0;
const https_1 = require("firebase-functions/v2/https");
const _core_1 = require("./_core");
exports.runDailyAnalytics = (0, https_1.onRequest)(async (_req, res) => {
    try {
        const result = await (0, _core_1.dailyAnalyticsCore)();
        res.status(200).json({ ok: true, result });
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ ok: false, error: e === null || e === void 0 ? void 0 : e.message });
    }
});
//# sourceMappingURL=runDaily.js.map