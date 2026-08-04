import { onSchedule } from "firebase-functions/v2/scheduler";
import { onRequest } from "firebase-functions/v2/https";
import { rebuildMonthlyReportsCore } from "./buildMonthlyReportsCore";
import { notifyMonthlyReportPush } from "../notifications/notifyPushEvents";

/** 毎月 1 日 8:00 JST — 前月レポートを確定書き込み（period snapshot 後を想定） */
export const rebuildMonthlyReportsCronV2 = onSchedule(
  {
    schedule: "0 8 1 * *",
    timeZone: "Asia/Tokyo",
    memory: "1GiB",
    timeoutSeconds: 540,
  },
  async () => {
    const result = await rebuildMonthlyReportsCore();
    console.log(
      `[rebuildMonthlyReportsCronV2] month=${result.monthKey} written=${result.written}`
    );
    try {
      await notifyMonthlyReportPush({
        uids: result.writtenUids,
        monthKey: result.monthKey,
      });
    } catch (e) {
      console.error("[rebuildMonthlyReportsCronV2] monthly push failed", e);
    }
  }
);

/**
 * 手動 / Cursor 用 HTTP。
 * GET/POST ?monthKey=2026-01&limit=50
 * 本番は IAM / シークレットで保護すること（暫定: 未認証可だが limit 推奨）。
 */
export const rebuildMonthlyReportsManualV2 = onRequest(
  {
    region: "asia-northeast1",
    memory: "1GiB",
    timeoutSeconds: 540,
  },
  async (req, res) => {
    try {
      const monthKey =
        typeof req.query.monthKey === "string"
          ? req.query.monthKey
          : typeof req.body?.monthKey === "string"
            ? req.body.monthKey
            : undefined;
      const limitRaw =
        typeof req.query.limit === "string"
          ? Number(req.query.limit)
          : typeof req.body?.limit === "number"
            ? req.body.limit
            : undefined;
      const limit =
        limitRaw != null && Number.isFinite(limitRaw) && limitRaw > 0
          ? Math.floor(limitRaw)
          : undefined;

      const result = await rebuildMonthlyReportsCore({ monthKey, limit });
      res.status(200).json({ ok: true, ...result });
    } catch (e) {
      console.error("[rebuildMonthlyReportsManualV2]", e);
      res.status(500).json({ ok: false, error: String(e) });
    }
  }
);
