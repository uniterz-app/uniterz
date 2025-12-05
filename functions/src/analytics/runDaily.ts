import { onRequest } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import { dailyAnalyticsCore } from "./_core";

export const runDailyAnalytics = onRequest(async (_req, res) => {
  try {
    const result = await dailyAnalyticsCore();
    res.status(200).json({ ok: true, result });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ ok: false, error: e?.message });
  }
});
