/**
 * JST 毎時 — tip 3h 前の試合に Pro Insight のケガ・日程パッチ。
 *
 * env（どちらか）:
 *   NEXT_NBA_PRO_BRIEF_INGEST_URL  … 例 https://www.uniterz.app/api/admin/nba-pro-brief-ingest
 *   NEXT_NBA_STATS_DAILY_INGEST_URL … あればパスを置換して流用可
 *   INTERNAL_JOB_SECRET
 */
import { onSchedule } from "firebase-functions/v2/scheduler";
import { defineSecret } from "firebase-functions/params";

const INTERNAL_JOB_SECRET = defineSecret("INTERNAL_JOB_SECRET");

function resolveProBriefIngestUrl(): string | null {
  const direct = process.env.NEXT_NBA_PRO_BRIEF_INGEST_URL?.trim();
  if (direct) return direct;
  const daily = process.env.NEXT_NBA_STATS_DAILY_INGEST_URL?.trim();
  if (!daily) return null;
  return daily.replace(
    /\/api\/admin\/nba-stats-daily-ingest\/?$/,
    "/api/admin/nba-pro-brief-ingest"
  );
}

export const runNbaProBriefPatchCron = onSchedule(
  {
    schedule: "15 * * * *",
    timeZone: "Asia/Tokyo",
    region: "asia-northeast1",
    timeoutSeconds: 300,
    memory: "512MiB",
    secrets: [INTERNAL_JOB_SECRET],
  },
  async () => {
    const url = resolveProBriefIngestUrl();
    const secret = INTERNAL_JOB_SECRET.value()?.trim();
    if (!url || !secret) {
      console.warn(
        "[runNbaProBriefPatchCron] skip: missing NEXT_NBA_PRO_BRIEF_INGEST_URL (or DAILY URL) or INTERNAL_JOB_SECRET"
      );
      return;
    }

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-internal-job-secret": secret,
      },
      body: JSON.stringify({ mode: "patch" }),
    });
    const text = await res.text().catch(() => "");
    if (!res.ok) {
      console.error(
        `[runNbaProBriefPatchCron] failed: ${res.status} ${text.slice(0, 800)}`
      );
      throw new Error(`nba-pro-brief-ingest patch HTTP ${res.status}`);
    }
    console.log(`[runNbaProBriefPatchCron] ok: ${text.slice(0, 1200)}`);
  }
);
