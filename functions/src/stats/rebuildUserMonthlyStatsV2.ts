import { onSchedule } from "firebase-functions/v2/scheduler";
import { rebuildUserMonthlyStatsCore } from "../monthly/rebuildUserMonthlyStatsCore";

/** 月次は全ユーザー走査のためデフォルト 60s だとタイムアウトしやすい */
export const rebuildUserMonthlyStatsMonthCronV2 = onSchedule(
  {
    schedule: "0 5 1 * *",
    timeZone: "Asia/Tokyo",
    memory: "1GiB",
    timeoutSeconds: 540,
  },
  async () => {
    await rebuildUserMonthlyStatsCore();
  }
);
