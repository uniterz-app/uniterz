/**
 * NBA injury 専用 ingest（Next admin API 経由）。
 *
 * - 16:00 JST … ランキング更新日のベースライン（試合ある日のみ）
 * - 23:00 JST … 今夜試合向けベースライン
 * - 10分毎 … T-3h / T-1h / T-30m 窓（20分 dedupe は API 側）
 *
 * env:
 *   NEXT_NBA_INJURY_INGEST_URL … 例 https://xxx.vercel.app/api/admin/nba-injury-ingest
 *   NEXT_NBA_STATS_DAILY_INGEST_URL … 未設定時はパス置換で流用可
 *   INTERNAL_JOB_SECRET
 */
import { onSchedule } from "firebase-functions/v2/scheduler";
import { defineSecret } from "firebase-functions/params";

const INTERNAL_JOB_SECRET = defineSecret("INTERNAL_JOB_SECRET");

function resolveInjuryIngestUrl(): string | null {
  const direct = process.env.NEXT_NBA_INJURY_INGEST_URL?.trim();
  if (direct) return direct;
  const daily = process.env.NEXT_NBA_STATS_DAILY_INGEST_URL?.trim();
  if (!daily) return null;
  return daily.replace(
    /\/api\/admin\/nba-stats-daily-ingest\/?$/,
    "/api/admin/nba-injury-ingest"
  );
}

async function postInjuryIngest(body: Record<string, unknown>): Promise<void> {
  const url = resolveInjuryIngestUrl();
  const secret = INTERNAL_JOB_SECRET.value()?.trim();
  if (!url || !secret) {
    console.warn(
      "[runNbaInjuryIngestCron] skip: missing NEXT_NBA_INJURY_INGEST_URL (or DAILY URL) or INTERNAL_JOB_SECRET"
    );
    return;
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-internal-job-secret": secret,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text().catch(() => "");
  if (!res.ok) {
    console.error(
      `[runNbaInjuryIngestCron] failed: ${res.status} ${text.slice(0, 800)}`
    );
    throw new Error(`nba-injury-ingest HTTP ${res.status}`);
  }
  console.log(`[runNbaInjuryIngestCron] ok: ${text.slice(0, 1200)}`);
}

export const runNbaInjuryBaseline16Cron = onSchedule(
  {
    schedule: "0 16 * * *",
    timeZone: "Asia/Tokyo",
    region: "asia-northeast1",
    timeoutSeconds: 120,
    memory: "512MiB",
    secrets: [INTERNAL_JOB_SECRET],
  },
  async () => {
    await postInjuryIngest({
      trigger: "baseline",
      baselineSlot: "16",
    });
  }
);

export const runNbaInjuryBaseline23Cron = onSchedule(
  {
    schedule: "0 23 * * *",
    timeZone: "Asia/Tokyo",
    region: "asia-northeast1",
    timeoutSeconds: 120,
    memory: "512MiB",
    secrets: [INTERNAL_JOB_SECRET],
  },
  async () => {
    await postInjuryIngest({ trigger: "baseline", baselineSlot: "23" });
  }
);

export const runNbaInjuryPregameCron = onSchedule(
  {
    schedule: "*/10 * * * *",
    timeZone: "Asia/Tokyo",
    region: "asia-northeast1",
    timeoutSeconds: 120,
    memory: "512MiB",
    secrets: [INTERNAL_JOB_SECRET],
  },
  async () => {
    await postInjuryIngest({ trigger: "pregame" });
  }
);
