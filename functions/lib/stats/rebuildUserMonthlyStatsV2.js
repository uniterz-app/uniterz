"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rebuildUserMonthlyStatsMonthCronV2 = exports.rebuildUserMonthlyStatsV2 = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const https_1 = require("firebase-functions/v2/https");
const rebuildUserMonthlyStatsCore_1 = require("../monthly/rebuildUserMonthlyStatsCore");
exports.rebuildUserMonthlyStatsV2 = (0, https_1.onRequest)({
    region: "us-central1",
    memory: "1GiB",
    timeoutSeconds: 540,
}, async (_req, res) => {
    try {
        const result = await (0, rebuildUserMonthlyStatsCore_1.rebuildUserMonthlyStatsCore)();
        res.status(200).json(Object.assign({ ok: true }, result));
    }
    catch (e) {
        res.status(500).json({ ok: false, error: String(e) });
    }
});
exports.rebuildUserMonthlyStatsMonthCronV2 = (0, scheduler_1.onSchedule)({ schedule: "0 5 1 * *", timeZone: "Asia/Tokyo" }, async () => {
    await (0, rebuildUserMonthlyStatsCore_1.rebuildUserMonthlyStatsCore)();
});
//# sourceMappingURL=rebuildUserMonthlyStatsV2.js.map