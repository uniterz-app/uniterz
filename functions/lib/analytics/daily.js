"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dailyAnalytics = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const _core_1 = require("./_core");
exports.dailyAnalytics = (0, scheduler_1.onSchedule)("0 3 * * *", async () => {
    await (0, _core_1.dailyAnalyticsCore)();
});
//# sourceMappingURL=daily.js.map