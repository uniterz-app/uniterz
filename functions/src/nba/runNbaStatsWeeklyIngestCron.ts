/**
 * 毎週月曜 10:00 JST — ペイロール + プレイヤー契約を Next admin API 経由で同期。
 *
 * env:
 *   NEXT_NBA_STATS_WEEKLY_INGEST_URL  … 例 https://www.uniterz.app/api/admin/nba-stats-weekly-ingest
 *   INTERNAL_JOB_SECRET
 */
import { onSchedule } from "firebase-functions/v2/scheduler";
import { defineSecret } from "firebase-functions/params";

const INTERNAL_JOB_SECRET = defineSecret("INTERNAL_JOB_SECRET");

export const runNbaStatsWeeklyIngestCron = onSchedule(
  {
    schedule: "0 10 * * 1",
    timeZone: "Asia/Tokyo",
    region: "asia-northeast1",
    timeoutSeconds: 540,
    memory: "512MiB",
    secrets: [INTERNAL_JOB_SECRET],
  },
  async () => {
    const url = process.env.NEXT_NBA_STATS_WEEKLY_INGEST_URL?.trim();
    const secret = INTERNAL_JOB_SECRET.value()?.trim();
    if (!url || !secret) {
      console.warn(
        "[runNbaStatsWeeklyIngestCron] skip: missing NEXT_NBA_STATS_WEEKLY_INGEST_URL or INTERNAL_JOB_SECRET"
      );
      return;
    }

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-internal-job-secret": secret,
      },
      body: JSON.stringify({}),
    });
    const text = await res.text().catch(() => "");
    if (!res.ok) {
      console.error(
        `[runNbaStatsWeeklyIngestCron] failed: ${res.status} ${text.slice(0, 800)}`
      );
      throw new Error(`nba-stats-weekly-ingest HTTP ${res.status}`);
    }
    console.log(`[runNbaStatsWeeklyIngestCron] ok: ${text.slice(0, 1200)}`);
  }
);
