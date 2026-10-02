/**
 * Pro Insight ナラティブ — OpenAI Batch 完了ポーリング。
 * 15 分ごと。生成トークン以外の課金なし（GET /batches は無料帯）。
 *
 * env（どちらか）:
 *   NEXT_NBA_PRO_BRIEF_INGEST_URL
 *   NEXT_NBA_STATS_DAILY_INGEST_URL … パス置換で流用可
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

export const runNbaProInsightBatchPollCron = onSchedule(
  {
    schedule: "*/15 * * * *",
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
        "[runNbaProInsightBatchPollCron] skip: missing NEXT_NBA_PRO_BRIEF_INGEST_URL (or DAILY URL) or INTERNAL_JOB_SECRET"
      );
      return;
    }

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-internal-job-secret": secret,
      },
      body: JSON.stringify({ mode: "batch_poll" }),
    });
    const text = await res.text().catch(() => "");
    if (!res.ok) {
      console.error(
        `[runNbaProInsightBatchPollCron] failed: ${res.status} ${text.slice(0, 800)}`
      );
      throw new Error(`nba-pro-brief-ingest batch_poll HTTP ${res.status}`);
    }
    console.log(`[runNbaProInsightBatchPollCron] ok: ${text.slice(0, 1200)}`);
  }
);
