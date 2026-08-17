import { onRequest } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { buildWeeklyReportsCore } from "./buildWeeklyReportsCore";
import { previousLabel, weekStartDateKeyJST } from "../rankings/nbaPeriod";

function isMondayJst(now: Date): boolean {
  return new Date(now.getTime() + 9 * 60 * 60 * 1000).getUTCDay() === 1;
}

/**
 * 月曜 08:30 JST のみ: 先週の週間レポートを final 確定する。
 * （進行中 live 日次更新は廃止。確定週だけを履歴に残す）
 */
export const rebuildWeeklyReportsCronV2 = onSchedule(
  {
    schedule: "30 8 * * 1",
    timeZone: "Asia/Tokyo",
    memory: "1GiB",
    timeoutSeconds: 540,
  },
  async () => {
    const now = new Date();
    if (!isMondayJst(now)) {
      console.log("[rebuildWeeklyReportsCronV2] skip: not Monday JST");
      return;
    }
    const currentWeek = weekStartDateKeyJST(now);
    const final = await buildWeeklyReportsCore({
      weekLabel: previousLabel("weekly", currentWeek),
      status: "final",
      now,
    });
    console.log(
      `[rebuildWeeklyReportsCronV2] status=final week=${final.weekLabel} written=${final.written}`
    );
  }
);

/**
 * 手動 / Cursor 用 HTTP。
 * GET/POST ?weekLabel=2026-10-19&status=final&limit=50
 * status 省略時は final。live は後方互換の手動再生成用のみ。
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
      const status =
        rawStatus === "live" ? "live" : rawStatus === "final" ? "final" : "final";
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
      res.status(200).json(result);
    } catch (e) {
      console.error("[rebuildWeeklyReportsManualV2]", e);
      res.status(500).json({
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }
);
