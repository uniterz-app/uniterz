"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rebuildUserMonthlyStatsMonthCronV2 = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const rebuildUserMonthlyStatsCore_1 = require("../monthly/rebuildUserMonthlyStatsCore");
/** 月次は全ユーザー走査のためデフォルト 60s だとタイムアウトしやすい */
exports.rebuildUserMonthlyStatsMonthCronV2 = (0, scheduler_1.onSchedule)({
    schedule: "0 5 1 * *",
    timeZone: "Asia/Tokyo",
    memory: "1GiB",
    timeoutSeconds: 540,
}, async () => {
    await (0, rebuildUserMonthlyStatsCore_1.rebuildUserMonthlyStatsCore)();
});
//# sourceMappingURL=rebuildUserMonthlyStatsV2.js.map