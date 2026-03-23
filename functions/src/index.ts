// functions/src/index.ts

import { setGlobalOptions } from "firebase-functions/v2/options";
import { onRequest } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import {
  onDocumentCreated,
  onDocumentDeleted,
} from "firebase-functions/v2/firestore";

import { FieldValue } from "firebase-admin/firestore";
import { admin } from "./firebase";
import { dailyAnalyticsCore } from "./analytics/_core";
import * as functions from "firebase-functions";

import { buildCumulativeStats } from "./rankings/buildCumulativeStats";
import { buildCumulativeRankingSnapshot } from "./rankings/buildCumulativeRankingSnapshot";

// ★追加
import { buildMonthlyLeaderboardSnapshot } from "./leaderboards/buildMonthlyLeaderboardSnapshot";

// ===============================
// V2 Core
// ===============================
export { onGameFinalV2 } from "./onGameFinalV2";
export { rescorePlayoffBrackets } from "./playoff-bracket/rescorePlayoffBrackets";
export { onPlayoffResultsWrite } from "./playoff-bracket/onPlayoffResultsWrite";
export { rebuildPlayoffBracketMarket } from "./playoff-bracket/rebuildPlayoffBracketMarket";
export { getCumulativeRanking } from "./rankings/getCumulativeRanking";
export { getMonthlyLeaderboard } from "./leaderboards/getMonthlyLeaderboard";

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
 * followers / following
 * ==========================================================================*/

export const onFollowerAdded = onDocumentCreated(
  "users/{uid}/followers/{followerUid}",
  async (event) => {
    const { uid, followerUid } = event.params;
    try {
      await db.doc(`users/${uid}`).set(
        { counts: { followers: FieldValue.increment(1) } },
        { merge: true }
      );
      await db.collection("events_follow").add({
        targetUid: uid,
        actorUid: followerUid,
        op: "follow",
        createdAt: FieldValue.serverTimestamp(),
      });
    } catch (e) {
      console.error("[onFollowerAdded] failed:", e);
    }
  }
);

export const onFollowerRemoved = onDocumentDeleted(
  "users/{uid}/followers/{followerUid}",
  async (event) => {
    const { uid } = event.params;
    try {
      await db.doc(`users/${uid}`).set(
        { counts: { followers: FieldValue.increment(-1) } },
        { merge: true }
      );
    } catch (e) {
      console.error("[onFollowerRemoved] failed:", e);
    }
  }
);

export const onFollowingAdded = onDocumentCreated(
  "users/{ownerUid}/following/{targetUid}",
  async (event) => {
    const { ownerUid } = event.params;
    try {
      await db.doc(`users/${ownerUid}`).set(
        { counts: { following: FieldValue.increment(1) } },
        { merge: true }
      );
    } catch (e) {
      console.error("[onFollowingAdded] failed:", e);
    }
  }
);

export const onFollowingRemoved = onDocumentDeleted(
  "users/{ownerUid}/following/{targetUid}",
  async (event) => {
    const { ownerUid } = event.params;
    try {
      await db.doc(`users/${ownerUid}`).set(
        { counts: { following: FieldValue.increment(-1) } },
        { merge: true }
      );
    } catch (e) {
      console.error("[onFollowingRemoved] failed:", e);
    }
  }
);

/* ============================================================================
 * posts
 * ==========================================================================*/

export { onPostCreatedV2 } from "./onPostCreated";
export { onPostDeletedV2 } from "./onPostDeleted";

/* ============================================================================
 * Team Rankings (Daily)
 * ==========================================================================*/

import { updateTeamRankings } from "./team-standing/updateTeamRankings";

export const updateTeamRankingsDaily = onSchedule(
  { schedule: "0 0 * * *", timeZone: "Asia/Tokyo" },
  async () => {
    await updateTeamRankings();
  }
);

/* ============================================================================
 * Cumulative Stats (15:40)
 * ==========================================================================*/

export const buildCumulativeStatsCron = onSchedule(
  { schedule: "40 15 * * *", timeZone: "Asia/Tokyo" },
  async () => {
    await buildCumulativeStats();
  }
);

/* ============================================================================
 * Cumulative Ranking Snapshot (15:55)
 * ==========================================================================*/

export const buildCumulativeRankingSnapshotCron = onSchedule(
  { schedule: "55 15 * * *", timeZone: "Asia/Tokyo" },
  async () => {
    await buildCumulativeRankingSnapshot();
  }
);

/* ============================================================================
 * Monthly Leaderboard Snapshot（★追加）
 * 毎月1日 04:05 → 前月分を確定
 * ==========================================================================*/

export const buildMonthlyLeaderboardSnapshotCron = onSchedule(
  { schedule: "0 4 1 * *", timeZone: "Asia/Tokyo" },
  async () => {
    const now = new Date();
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const y = prev.getFullYear();
    const m = String(prev.getMonth() + 1).padStart(2, "0");
    const month = `${y}-${m}`;

    const LEAGUES = ["nba", "j1", "bj"];

    for (const league of LEAGUES) {
      await buildMonthlyLeaderboardSnapshot({ league, month });
    }
  }
);

/* ============================================================================
 * Analytics
 * ==========================================================================*/

export { dailyAnalytics } from "./analytics/daily";
export { logUserActive } from "./analytics/logUserActive";
export { runDailyAnalytics } from "./analytics/runDaily";

export { fixUserStats } from "./fixUserStats";

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









