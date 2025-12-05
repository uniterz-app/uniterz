import { onSchedule } from "firebase-functions/v2/scheduler";
import { dailyAnalyticsCore } from "./_core";

export const dailyAnalytics = onSchedule("0 3 * * *", async () => {
  await dailyAnalyticsCore();
});
