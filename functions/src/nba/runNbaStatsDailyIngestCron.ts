/**
 * JST 毎日 18:00 — NBA スタッツ日次 ingest を Next admin API 経由で起動。
 * US 試合が概ね終わったあと（西海岸深夜〜）を狙う。
 *
 * env:
 *   NEXT_NBA_STATS_DAILY_INGEST_URL  … 例 https://xxx.vercel.app/api/admin/nba-stats-daily-ingest
 *   INTERNAL_JOB_SECRET
 */
import { onSchedule } from "firebase-functions/v2/scheduler";
import { defineSecret } from "firebase-functions/params";

const INTERNAL_JOB_SECRET = defineSecret("INTERNAL_JOB_SECRET");

export const runNbaStatsDailyIngestCron = onSchedule(
  {
    schedule: "0 18 * * *",
    timeZone: "Asia/Tokyo",
    region: "asia-northeast1",
    timeoutSeconds: 540,
    memory: "512MiB",
    secrets: [INTERNAL_JOB_SECRET],
  },
  async () => {
    const url = process.env.NEXT_NBA_STATS_DAILY_INGEST_URL?.trim();
    const secret = INTERNAL_JOB_SECRET.value()?.trim();
    if (!url || !secret) {
      console.warn(
        "[runNbaStatsDailyIngestCron] skip: missing NEXT_NBA_STATS_DAILY_INGEST_URL or INTERNAL_JOB_SECRET"
      );
      return;
    }

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-internal-job-secret": secret,
      },
      body: JSON.stringify({ mode: "daily" }),
    });
    const text = await res.text().catch(() => "");
    if (!res.ok) {
      console.error(
        `[runNbaStatsDailyIngestCron] failed: ${res.status} ${text.slice(0, 800)}`
      );
      throw new Error(`nba-stats-daily-ingest HTTP ${res.status}`);
    }
    console.log(
      `[runNbaStatsDailyIngestCron] ok: ${text.slice(0, 1200)}`
    );
  }
);
