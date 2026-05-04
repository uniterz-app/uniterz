import { onSchedule } from "firebase-functions/v2/scheduler";
import { onRequest } from "firebase-functions/v2/https";
import { rebuildUserMonthlyStatsCore } from "../monthly/rebuildUserMonthlyStatsCore";

export const rebuildUserMonthlyStatsV2 = onRequest(
  {
    region: "us-central1",
    memory: "1GiB",
    timeoutSeconds: 540,
  },
  async (_req, res) => {
    try {
      const result = await rebuildUserMonthlyStatsCore();
      res.status(200).json({ ok: true, ...result });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: String(e) });
    }
  }
);

/** HTTP 版と同じ上限。月次は全ユーザー走査のためデフォルト 60s だとタイムアウトしやすい */
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
