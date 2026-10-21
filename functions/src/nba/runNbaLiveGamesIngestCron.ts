/**
 * NBA ライブ試合スコア / liveStats を Next admin API 経由で同期。
 *
 * オフシーズン: `functions/src/index.ts` から export しない（現在停止中）。
 * シーズン中: export を戻してデプロイ。スケジュールは毎分だが、
 * Firestore にライブ枠の試合があるときだけ Next（→ BDL）を叩く。
 *
 * 10 分ごとに試合後スタッツ監視も相乗り（終了試合の BDL シーズン集計待ちがあるときだけ
 * Next `/api/admin/nba-post-game-stats-refresh`）。URL はライブ ingest と同じオリジン。
 *
 * env:
 *   NEXT_NBA_LIVE_GAMES_INGEST_URL  … 例 https://www.uniterz.app/api/admin/nba-live-games-ingest
 *   INTERNAL_JOB_SECRET
 */
import { onSchedule } from "firebase-functions/v2/scheduler";
import { defineSecret } from "firebase-functions/params";
import { shouldRunNbaLiveGamesIngest } from "./shouldRunNbaLiveGamesIngest";
import { hasPendingNbaPostGameStatsRefresh } from "./hasPendingNbaPostGameStatsRefresh";

const INTERNAL_JOB_SECRET = defineSecret("INTERNAL_JOB_SECRET");

const POST_GAME_STATS_EVERY_MIN = 10;

async function postJob(url: string, secret: string, tag: string): Promise<void> {
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
    console.error(`[runNbaLiveGamesIngestCron] ${tag} failed: ${res.status} ${text.slice(0, 800)}`);
    throw new Error(`${tag} HTTP ${res.status}`);
  }
  console.log(`[runNbaLiveGamesIngestCron] ${tag} ok: ${text.slice(0, 1200)}`);
}

export const runNbaLiveGamesIngestCron = onSchedule(
  {
    schedule: "every 1 minutes",
    timeZone: "America/New_York",
    region: "asia-northeast1",
    timeoutSeconds: 300,
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

    let liveError: unknown = null;
    if (await shouldRunNbaLiveGamesIngest()) {
      try {
        await postJob(url, secret, "nba-live-games-ingest");
      } catch (e) {
        liveError = e;
      }
    } else {
      console.log("[runNbaLiveGamesIngestCron] skip: no NBA games in live window");
    }

    if (new Date().getMinutes() % POST_GAME_STATS_EVERY_MIN === 0) {
      try {
        if (await hasPendingNbaPostGameStatsRefresh()) {
          const refreshUrl = new URL("/api/admin/nba-post-game-stats-refresh", url).toString();
          await postJob(refreshUrl, secret, "nba-post-game-stats-refresh");
        }
      } catch (e) {
        console.error("[runNbaLiveGamesIngestCron] post-game stats refresh failed", e);
      }
    }

    if (liveError) throw liveError;
  }
);
