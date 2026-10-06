/**
 * 毎週月曜 10:00 JST — ペイロール + プレイヤー契約、続けて選手欠場の影響を Next admin API 経由で同期。
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

    const post = (target: string) =>
      fetch(target, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-internal-job-secret": secret,
        },
        body: JSON.stringify({}),
      });

    const res = await post(url);
    const text = await res.text().catch(() => "");
    if (!res.ok) {
      console.error(
        `[runNbaStatsWeeklyIngestCron] failed: ${res.status} ${text.slice(0, 800)}`
      );
    } else {
      console.log(`[runNbaStatsWeeklyIngestCron] ok: ${text.slice(0, 1200)}`);
    }

    // 選手欠場の影響は BDL stats 全ページを読むので別リクエスト（Next の 300 秒枠を分ける）
    const outImpactUrl = url.replace(
      "nba-stats-weekly-ingest",
      "nba-player-out-impact-ingest"
    );
    const impactRes = await post(outImpactUrl);
    const impactText = await impactRes.text().catch(() => "");
    if (!impactRes.ok) {
      console.error(
        `[runNbaStatsWeeklyIngestCron] out-impact failed: ${impactRes.status} ${impactText.slice(0, 800)}`
      );
    } else {
      console.log(`[runNbaStatsWeeklyIngestCron] out-impact ok: ${impactText.slice(0, 800)}`);
    }

    if (!res.ok) throw new Error(`nba-stats-weekly-ingest HTTP ${res.status}`);
    if (!impactRes.ok) throw new Error(`nba-player-out-impact-ingest HTTP ${impactRes.status}`);
  }
);
