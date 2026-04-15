// functions/src/index.ts

import { setGlobalOptions } from "firebase-functions/v2/options";
import { onRequest } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { FieldValue } from "firebase-admin/firestore";
import { admin } from "./firebase";
import { dailyAnalyticsCore } from "./analytics/_core";
import * as functions from "firebase-functions";

import { buildCumulativeStats } from "./rankings/buildCumulativeStats";
import { buildCumulativeRankingSnapshot } from "./rankings/buildCumulativeRankingSnapshot";
import { hasNbaGameScheduledJstToday } from "./schedule/hasNbaGameScheduledJstToday";

// ★追加
import { buildMonthlyLeaderboardSnapshot } from "./leaderboards/buildMonthlyLeaderboardSnapshot";
import { getLeaderboardLatestMonthKey } from "./leaderboards/jstLeaderboardMonth";
import { buildAllUsersWindowCache } from "./stats/buildUserStatsWindowCache";

// ===============================
// V2 Core
// ===============================
export { onGameFinalV2 } from "./onGameFinalV2";
export { rescorePlayoffBrackets } from "./playoff-bracket/rescorePlayoffBrackets";
export { onPlayoffResultsWrite } from "./playoff-bracket/onPlayoffResultsWrite";
export { rebuildPlayoffBracketMarket } from "./playoff-bracket/rebuildPlayoffBracketMarket";
export { getCumulativeRanking } from "./rankings/getCumulativeRanking";
export { backfillCumulativeStatsFromDailyHttp } from "./rankings/backfillCumulativeStatsFromDaily";
export { getMonthlyLeaderboard } from "./leaderboards/getMonthlyLeaderboard";
export {
  rebuildMonthlyLeaderboardsCron,
  rebuildMonthlyLeaderboardsHttp,
} from "./leaderboards/monthly";

// 🔥 Pro 期限切れユーザーを Free に戻す Cron
export { expireProUsers } from "./triggers/expireProUsers";

// 🔥 ユーザー月次スタッツ（Pro用）
export {
  rebuildUserMonthlyStatsV2,
  rebuildUserMonthlyStatsMonthCronV2,
} from "./stats/rebuildUserMonthlyStatsV2";

// ===============================
// Global
// ===============================
setGlobalOptions({ region: "asia-northeast1", maxInstances: 10 });
const db = admin.firestore();

/* ============================================================================
 * posts
 * ==========================================================================*/

export { onPostCreatedV2 } from "./onPostCreated";
export { onPostDeletedV2 } from "./onPostDeleted";

/* ============================================================================
 * Team Rankings (16:00 JST — only when NBA has games that calendar day)
 * ==========================================================================*/

import { runTeamRankingsCronIfNbaGamesToday } from "./team-standing/runTeamRankingsCron";

export const updateTeamRankingsDaily = onSchedule(
  { schedule: "0 16 * * *", timeZone: "Asia/Tokyo" },
  async () => {
    await runTeamRankingsCronIfNbaGamesToday();
  }
);

/* ============================================================================
 * Cumulative Stats (15:40) — JST 当日に NBA 試合がある日のみ
 * ==========================================================================*/

export const buildCumulativeStatsCron = onSchedule(
  {
    schedule: "40 15 * * *",
    timeZone: "Asia/Tokyo",
    memory: "1GiB",
    timeoutSeconds: 540,
  },
  async () => {
    if (!(await hasNbaGameScheduledJstToday())) {
      console.log(
        "[buildCumulativeStatsCron] skip: no NBA games scheduled this JST date"
      );
      return;
    }
    await buildCumulativeStats();
  }
);

/* ============================================================================
 * Cumulative Ranking Snapshot (15:55) — JST 当日に NBA 試合がある日のみ
 * ==========================================================================*/

export const buildCumulativeRankingSnapshotCron = onSchedule(
  { schedule: "55 15 * * *", timeZone: "Asia/Tokyo" },
  async () => {
    if (!(await hasNbaGameScheduledJstToday())) {
      console.log(
        "[buildCumulativeRankingSnapshotCron] skip: no NBA games scheduled this JST date"
      );
      return;
    }
    await buildCumulativeRankingSnapshot();
    const revalidateUrl = process.env.NEXT_REVALIDATE_CUMULATIVE_RANKING_URL;
    const token = process.env.INTERNAL_REVALIDATE_SECRET;
    if (!revalidateUrl || !token) {
      console.warn(
        "[buildCumulativeRankingSnapshotCron] skip revalidate (missing NEXT_REVALIDATE_CUMULATIVE_RANKING_URL or INTERNAL_REVALIDATE_SECRET)"
      );
      return;
    }

    try {
      const res = await fetch(revalidateUrl, {
        method: "POST",
        headers: { "x-revalidate-token": token },
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        console.error(
          `[buildCumulativeRankingSnapshotCron] revalidate failed: ${res.status} ${body}`
        );
      } else {
        console.log("[buildCumulativeRankingSnapshotCron] revalidate success");
      }
    } catch (err: any) {
      console.error(
        `[buildCumulativeRankingSnapshotCron] revalidate error: ${String(
          err?.message ?? err
        )}`
      );
    }
  }
);

/* ============================================================================
 * Monthly Leaderboard Snapshot（★追加）
 * 毎月1日 04:05 → 前月分を確定
 * ==========================================================================*/

export const buildMonthlyLeaderboardSnapshotCron = onSchedule(
  { schedule: "0 4 1 * *", timeZone: "Asia/Tokyo" },
  async () => {
    const month = getLeaderboardLatestMonthKey();

    const LEAGUES = ["nba", "j1", "bj"];

    for (const league of LEAGUES) {
      await buildMonthlyLeaderboardSnapshot({ league, month });
    }
  }
);

/* ============================================================================
 * User Stats Window Cache（7d/30d ロールアップ）
 * 毎日 05:00 にプリウォーム
 * ==========================================================================*/

export const buildUserStatsWindowCacheCron = onSchedule(
  { schedule: "0 5 * * *", timeZone: "Asia/Tokyo" },
  async () => {
    const { ok, err } = await buildAllUsersWindowCache();
    console.log(`[buildUserStatsWindowCacheCron] ok=${ok} err=${err}`);
  }
);

/* ============================================================================
 * Analytics
 * ==========================================================================*/

export { dailyAnalytics } from "./analytics/daily";
export { runDailyAnalytics } from "./analytics/runDaily";

export { fixUserStats } from "./fixUserStats";
export { backfillStreakApplyMarkersHttp } from "./backfillStreakApplyMarkers";

/* ============================================================================
 * Debug
 * ==========================================================================*/

export { listUserStatsIds } from "./debug/listUserStats";
export { xmasNba20251226 } from "./debug/xmasNba20251226";

export const runDailyAnalyticsHttp = onRequest(async (_req, res) => {
  try {
    const result = await dailyAnalyticsCore();
    res.status(200).json({ ok: true, result });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  const db = admin.firestore();

  await db.collection("users").doc(user.uid).set({
    plan: "free",
    proUntil: null,
    createdAt: FieldValue.serverTimestamp(),
  });
});









