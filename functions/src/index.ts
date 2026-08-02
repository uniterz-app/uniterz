// functions/src/index.ts

import { setGlobalOptions } from "firebase-functions/v2/options";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { FieldValue } from "firebase-admin/firestore";
import { admin } from "./firebase";
import * as functions from "firebase-functions";

import { buildCumulativeStats } from "./rankings/buildCumulativeStats";
import { buildCumulativeRankingSnapshot } from "./rankings/buildCumulativeRankingSnapshot";
import { buildNbaPeriodRankingSnapshots } from "./rankings/buildNbaPeriodRankingSnapshots";
import { buildGroupBattlePeriodSnapshots } from "./groupBattles/buildGroupBattlePeriodSnapshots";
import { grantAllFinalGroupBattleUnits } from "./groupBattles/grantGroupBattleUnits";
import { hasRankingAggregationScheduledJstToday } from "./schedule/hasRankingAggregationScheduledJstToday";
import { runNotifyGameStartCron } from "./notifications/notifyGameStartCron";
import { notifyRankingUpdatedPush } from "./notifications/notifyPushEvents";

// ===============================
// V2 Core
// ===============================
export { onGameFinalV2 } from "./onGameFinalV2";
export { onPlayoffResultsWrite } from "./playoff-bracket/onPlayoffResultsWrite";
export { onPlayoffBracketRescoreTaskCreated } from "./playoff-bracket/onPlayoffBracketRescoreTaskCreated";
export { getCumulativeRanking } from "./rankings/getCumulativeRanking";

// 🔥 Pro 期限切れユーザーを Free に戻す Cron
export { expireProUsers } from "./triggers/expireProUsers";

// 🔥 Pro 月次レポート（user_reports）
export {
  rebuildMonthlyReportsCronV2,
  rebuildMonthlyReportsManualV2,
} from "./reports/rebuildMonthlyReportsV2";
export {
  rebuildWeeklyReportsCronV2,
  rebuildWeeklyReportsManualV2,
} from "./reports/rebuildWeeklyReportsV2";

// ===============================
// Global
// ===============================
setGlobalOptions({ region: "asia-northeast1", maxInstances: 10 });

/* ============================================================================
 * posts
 * ==========================================================================*/

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
 * Cumulative Stats reconcile (15:40) — JST 当日に NBA / WC 試合がある日
 * 確定時インクリメントの照合。日次合計と不一致なら cumulative_stats を上書き修復。
 * ==========================================================================*/

export const buildCumulativeStatsCron = onSchedule(
  {
    schedule: "40 15 * * *",
    timeZone: "Asia/Tokyo",
    memory: "1GiB",
    timeoutSeconds: 540,
  },
  async () => {
    if (!(await hasRankingAggregationScheduledJstToday())) {
      console.log(
        "[buildCumulativeStatsCron] skip: no NBA/WC games scheduled this JST date"
      );
      return;
    }
    await buildCumulativeStats();
  }
);

/* ============================================================================
 * Cumulative Ranking Snapshot (16:00) — JST 当日に NBA / WC 試合がある日
 * 連勝はこの時点の「今日確定投稿者 × 連勝>0」でスナップショット化
 * ==========================================================================*/

export const buildCumulativeRankingSnapshotCron = onSchedule(
  { schedule: "0 16 * * *", timeZone: "Asia/Tokyo" },
  async () => {
    if (!(await hasRankingAggregationScheduledJstToday())) {
      console.log(
        "[buildCumulativeRankingSnapshotCron] skip: no NBA/WC games scheduled this JST date"
      );
      return;
    }
    const snapshotResult = await buildCumulativeRankingSnapshot();

    // NBA Weekly / Monthly の期間スナップショット（過去期間のアーカイブ兼用）
    try {
      await buildNbaPeriodRankingSnapshots();
    } catch (err) {
      console.error(
        "[buildCumulativeRankingSnapshotCron] period snapshots failed",
        err
      );
    }

    // グループバトル 週/月スナップショット + final への Unit 付与
    try {
      await buildGroupBattlePeriodSnapshots();
      await grantAllFinalGroupBattleUnits();
    } catch (err) {
      console.error(
        "[buildCumulativeRankingSnapshotCron] group battle snapshots/units failed",
        err
      );
    }

    const revalidateUrl = process.env.NEXT_REVALIDATE_CUMULATIVE_RANKING_URL;
    const token = process.env.INTERNAL_REVALIDATE_SECRET;
    if (!revalidateUrl || !token) {
      console.warn(
        "[buildCumulativeRankingSnapshotCron] skip revalidate (missing NEXT_REVALIDATE_CUMULATIVE_RANKING_URL or INTERNAL_REVALIDATE_SECRET)"
      );
    } else {
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

    try {
      await notifyRankingUpdatedPush(snapshotResult.notifiedUids ?? []);
    } catch (err) {
      console.error("[buildCumulativeRankingSnapshotCron] push notify failed", err);
    }
  }
);

/* ============================================================================
 * Game start push (10 min) — 15 分以内に開始する試合の予想者へ
 * ==========================================================================*/

export const notifyGameStartPushCron = onSchedule(
  { schedule: "*/10 * * * *", timeZone: "Asia/Tokyo" },
  async () => {
    try {
      await runNotifyGameStartCron();
    } catch (err) {
      console.error("[notifyGameStartPushCron] failed", err);
    }
  }
);

/* ============================================================================
 * Analytics
 * ==========================================================================*/

export { dailyAnalytics } from "./analytics/daily";

export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  const db = admin.firestore();

  await db.collection("users").doc(user.uid).set({
    plan: "free",
    proUntil: null,
    createdAt: FieldValue.serverTimestamp(),
  });
});









