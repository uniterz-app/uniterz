// functions/src/index.ts
import { setGlobalOptions } from "firebase-functions/v2/options";
import { onRequest } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import {
  onDocumentCreated,
  onDocumentDeleted,
} from "firebase-functions/v2/firestore";

import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

import { aggregateGamesTrend } from "./trend/games.aggregate";
import { dailyAnalyticsCore } from "./analytics/_core";
import { seedTeams } from "./seed/seedTeams";

// ===============================
// V2 Core
// ===============================
export { onGameFinalV2 } from "./onGameFinalV2";
export { recomputeAllUsersStatsV2Daily } from "./updateUserStatsV2";

// 🔥 週間・月間ランキング（V2）
export {
  rebuildCalendarLeaderboardsHttpV2,
  rebuildLeaderboardWeekV2,
  rebuildLeaderboardMonthV2,
} from "./triggers/leaderboards.calendar.v2";

// 🔥 オールタイムランキング（V2）
export {
  rebuildLeaderboardAllTimeV2,
  rebuildLeaderboardAllTimeCron,
} from "./triggers/leaderboards.alltime.v2";

// ===============================
// Global
// ===============================
setGlobalOptions({ region: "asia-northeast1", maxInstances: 10 });
admin.initializeApp();
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
 * トレンド（Games）
 * ==========================================================================*/

export const aggregateTrendsGames = onRequest(async (_req, res) => {
  try {
    const result = await aggregateGamesTrend();
    res.status(200).json(result);
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message ?? "failed" });
  }
});

export const aggregateTrendsGamesCron = onSchedule(
  { schedule: "0 * * * *", timeZone: "Asia/Tokyo" },
  async () => {
    await aggregateGamesTrend(); // return しない
  }
);

/* ============================================================================
 * Team Rankings (Daily)
 * ==========================================================================*/

import { updateTeamRankings } from "./ranking/updateTeamRankings";

export const updateTeamRankingsDaily = onSchedule(
  { schedule: "0 0 * * *", timeZone: "Asia/Tokyo" },
  async () => {
    await updateTeamRankings();
  }
);

/* ============================================================================
 * Analytics
 * ==========================================================================*/

export { dailyAnalytics } from "./analytics/daily";
export { logUserActive } from "./analytics/logUserActive";
export { runDailyAnalytics } from "./analytics/runDaily";

export const runDailyAnalyticsHttp = onRequest(async (_req, res) => {
  try {
    const result = await dailyAnalyticsCore();
    res.status(200).json({ ok: true, result });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

/* ============================================================================
 * Seed
 * ==========================================================================*/

export const seedTeamsHttp = onRequest(async (_req, res) => {
  try {
    await seedTeams();
    res.status(200).json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});





