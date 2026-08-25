/**
 * 毎分 — NBA ライブ試合スコア / liveStats を Next admin API 経由で同期。
 *
 * env:
 *   NEXT_NBA_LIVE_GAMES_INGEST_URL  … 例 https://xxx.vercel.app/api/admin/nba-live-games-ingest
 *   INTERNAL_JOB_SECRET
 */
import { onSchedule } from "firebase-functions/v2/scheduler";
import { defineSecret } from "firebase-functions/params";

const INTERNAL_JOB_SECRET = defineSecret("INTERNAL_JOB_SECRET");

export const runNbaLiveGamesIngestCron = onSchedule(
  {
    schedule: "every 1 minutes",
    timeZone: "America/New_York",
    region: "asia-northeast1",
    timeoutSeconds: 120,
    memory: "512MiB",
    secrets: [INTERNAL_JOB_SECRET],
  },
  async () => {
    const url = process.env.NEXT_NBA_LIVE_GAMES_INGEST_URL?.trim();
    const secret = INTERNAL_JOB_SECRET.value()?.trim();
    if (!url || !secret) {
      console.warn(
        "[runNbaLiveGamesIngestCron] skip: missing NEXT_NBA_LIVE_GAMES_INGEST_URL or INTERNAL_JOB_SECRET"
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
        `[runNbaLiveGamesIngestCron] failed: ${res.status} ${text.slice(0, 800)}`
      );
      throw new Error(`nba-live-games-ingest HTTP ${res.status}`);
    }
    console.log(`[runNbaLiveGamesIngestCron] ok: ${text.slice(0, 1200)}`);
  }
);
