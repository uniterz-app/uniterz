import { onRequest } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { buildWeeklyReportsCore } from "./buildWeeklyReportsCore";
import { previousLabel, weekStartDateKeyJST } from "../rankings/nbaPeriod";

function isMondayJst(now: Date): boolean {
  return new Date(now.getTime() + 9 * 60 * 60 * 1000).getUTCDay() === 1;
}

/** 毎朝 08:30 JST: 今週 live、月曜のみ先週 final も確定する。 */
export const rebuildWeeklyReportsCronV2 = onSchedule(
  {
    schedule: "30 8 * * *",
    timeZone: "Asia/Tokyo",
    memory: "1GiB",
    timeoutSeconds: 540,
  },
  async () => {
    const now = new Date();
    const currentWeek = weekStartDateKeyJST(now);
    const live = await buildWeeklyReportsCore({
      weekLabel: currentWeek,
      status: "live",
      now,
    });
    console.log(
      `[rebuildWeeklyReportsCronV2] status=live week=${live.weekLabel} written=${live.written}`
    );

    if (isMondayJst(now)) {
      const final = await buildWeeklyReportsCore({
        weekLabel: previousLabel("weekly", currentWeek),
        status: "final",
        now,
      });
      console.log(
        `[rebuildWeeklyReportsCronV2] status=final week=${final.weekLabel} written=${final.written}`
      );
    }
  }
);

/**
 * 手動 / Cursor 用 HTTP。
 * GET/POST ?weekLabel=2026-10-19&status=final&limit=50
 */
export const rebuildWeeklyReportsManualV2 = onRequest(
  {
    region: "asia-northeast1",
    memory: "1GiB",
    timeoutSeconds: 540,
  },
  async (req, res) => {
    try {
      const weekLabel =
        typeof req.query.weekLabel === "string"
          ? req.query.weekLabel
          : typeof req.body?.weekLabel === "string"
            ? req.body.weekLabel
            : undefined;
      const rawStatus =
        typeof req.query.status === "string"
          ? req.query.status
          : typeof req.body?.status === "string"
            ? req.body.status
            : undefined;
      const status = rawStatus === "final" ? "final" : rawStatus === "live" ? "live" : undefined;
      const rawLimit =
        typeof req.query.limit === "string"
          ? Number(req.query.limit)
          : typeof req.body?.limit === "number"
            ? req.body.limit
            : undefined;
      const limit =
        rawLimit != null && Number.isFinite(rawLimit) && rawLimit > 0
          ? Math.floor(rawLimit)
          : undefined;
      const result = await buildWeeklyReportsCore({ weekLabel, status, limit });
      console.log(
        `[rebuildWeeklyReportsManualV2] status=${result.status} week=${result.weekLabel} written=${result.written}`
      );
      res.status(200).json({ ok: true, ...result });
    } catch (error) {
      console.error("[rebuildWeeklyReportsManualV2]", error);
      res.status(500).json({
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
);
