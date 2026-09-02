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
import { advanceDueGroupBattlePhases } from "./groupBattles/advanceDuePhases";
import { hasRankingAggregationScheduledJstToday } from "./schedule/hasRankingAggregationScheduledJstToday";
import { runNotifyGameStartCron } from "./notifications/notifyGameStartCron";
import { runNotifyPredictionDeadlineCron } from "./notifications/notifyPredictionDeadlineCron";
import { runNotifyPregameAlertCron } from "./notifications/notifyPregameAlertCron";
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

// 旧 Pro Stats の `user_stats_v2_monthly` cron は **意図的に export しない**。
// 月次は user_reports に一本化済み（docs/pro-subscription-plan.md「Pro Stats 廃止」）。
// 唯一の読み手だった ProAnalysis はプロフィールから外れており、再 export すると
// 全ユーザー走査の集計が無駄に毎月走る。ソースは参照整理まで orphan で残す。

// NBA スタッツ日次 ingest（Next admin API 経由）
export { runNbaStatsDailyIngestCron } from "./nba/runNbaStatsDailyIngestCron";
// NBA injury 専用 ingest（16:00 / 23:00 / 試合前窓）
export {
  runNbaInjuryBaseline16Cron,
  runNbaInjuryBaseline23Cron,
  runNbaInjuryPregameCron,
} from "./nba/runNbaInjuryIngestCron";
// NBA スタッツ週次（ペイロール + 契約）
export { runNbaStatsWeeklyIngestCron } from "./nba/runNbaStatsWeeklyIngestCron";
// Pro Insight 前日 19:00 フル生成
export { runNbaProBriefFullCron } from "./nba/runNbaProBriefFullCron";
// Pro Insight tip 1h 前パッチ（injury は専用 cron が更新済みスナップショットを読む）
export { runNbaProBriefPatchCron } from "./nba/runNbaProBriefPatchCron";
// NBA ライブ試合スコア / box（60 秒）— オフシーズンは停止。再開時に export を戻す
// export { runNbaLiveGamesIngestCron } from "./nba/runNbaLiveGamesIngestCron";

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
 * Cumulative Stats reconcile (15:40) — JST 当日に NBA 試合がある日
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
        "[buildCumulativeStatsCron] skip: no NBA games scheduled this JST date"
      );
      return;
    }
    await buildCumulativeStats();
  }
);

/* ============================================================================
 * Cumulative Ranking Snapshot (16:00) — JST 当日に NBA 試合がある日
 * 連勝はこの時点の「今日確定投稿者 × 連勝>0」でスナップショット化
 * ==========================================================================*/

export const buildCumulativeRankingSnapshotCron = onSchedule(
  {
    schedule: "0 16 * * *",
    timeZone: "Asia/Tokyo",
    memory: "1GiB",
    timeoutSeconds: 540,
  },
  async () => {
    const hasGamesToday = await hasRankingAggregationScheduledJstToday();

    if (hasGamesToday) {
      const snapshotResult = await buildCumulativeRankingSnapshot();

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
            console.log(
              "[buildCumulativeRankingSnapshotCron] revalidate success"
            );
          }
        } catch (err: unknown) {
          const message =
            err instanceof Error ? err.message : String(err ?? "");
          console.error(
            `[buildCumulativeRankingSnapshotCron] revalidate error: ${message}`
          );
        }
      }

      try {
        await notifyRankingUpdatedPush(snapshotResult.notifiedUids ?? []);
      } catch (err) {
        console.error(
          "[buildCumulativeRankingSnapshotCron] push notify failed",
          err
        );
      }
    } else {
      console.log(
        "[buildCumulativeRankingSnapshotCron] skip cumulative: no NBA games scheduled this JST date"
      );
    }

    // 期間スナップショット + Unit 付与は無試合日も実行（猶予後の確定付与のため）
    try {
      await buildNbaPeriodRankingSnapshots();
    } catch (err) {
      console.error(
        "[buildCumulativeRankingSnapshotCron] period snapshots failed",
        err
      );
    }

    try {
      await advanceDueGroupBattlePhases();
      await buildGroupBattlePeriodSnapshots();
      await grantAllFinalGroupBattleUnits();
    } catch (err) {
      console.error(
        "[buildCumulativeRankingSnapshotCron] group battle snapshots/units failed",
        err
      );
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

export const notifyPredictionDeadlinePushCron = onSchedule(
  { schedule: "*/10 * * * *", timeZone: "Asia/Tokyo" },
  async () => {
    try {
      await runNotifyPredictionDeadlineCron();
    } catch (err) {
      console.error("[notifyPredictionDeadlinePushCron] failed", err);
    }
  }
);

export const notifyPregameAlertPushCron = onSchedule(
  { schedule: "*/10 * * * *", timeZone: "Asia/Tokyo" },
  async () => {
    try {
      await runNotifyPregameAlertCron();
    } catch (err) {
      console.error("[notifyPregameAlertPushCron] failed", err);
    }
  }
);

/**
 * サインアップ直後の初期化。
 *
 * merge 必須: クライアントが先に users/{uid} を作る経路（プロフィール設定）があり、
 * 上書き set だと displayName / handle を消してしまう。
 */
export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  const db = admin.firestore();

  await db.collection("users").doc(user.uid).set(
    {
      plan: "free",
      proUntil: null,
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
});









