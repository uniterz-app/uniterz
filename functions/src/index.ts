// functions/src/index.ts
import { setGlobalOptions } from "firebase-functions/v2/options";
import { onRequest } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { onDocumentCreated, onDocumentDeleted } from "firebase-functions/v2/firestore";

import * as admin from "firebase-admin";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

import { aggregateGamesTrend } from "./trend/games.aggregate";
import { aggregateUsersTrend } from "./trend/users.aggregate";
import { recomputeUserStatsFromDaily } from "./updateUserStats";
import { dailyAnalyticsCore } from "./analytics/_core";
import { seedTeams } from "./seed/seedTeams";


// ★★★ onGameFinal を確実に有効化する import
import { onGameFinal } from "./onGameFinal";

// ✅ V2 追加
import { onGameFinalV2 } from "./onGameFinalV2";
import { recomputeAllUsersStatsV2Daily } from "./updateUserStatsV2";
import { rebuildLeaderboardV2Cron } from "./triggers/leaderboards.calendar.v2";

// ====== Global Options / Admin ======
setGlobalOptions({ region: "asia-northeast1", maxInstances: 10 });
admin.initializeApp();
const db = admin.firestore();

/* ============================================================================
 * followers / following のカウント反映
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

export { onPostCreated } from "./onPostCreated";
export { onPostDeleted } from "./onPostDeleted";

/* ============================================================================
 * 🔽 カレンダーベース・ランキング再集計
 * ==========================================================================*/
export {
  rebuildCalendarLeaderboardsHttp,
  rebuildCalendarLeaderboardsCronMonth,
  rebuildCalendarLeaderboardsCronWeek,
} from "./triggers/leaderboards.calendar";

/* ============================================================================
 * トレンド集計（Games / HTTP & Cron）
 * ==========================================================================*/

export const aggregateTrendsGames = onRequest(async (_req, res) => {
  try {
    const result = await aggregateGamesTrend();
    res.status(200).json(result);
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ ok: false, error: e?.message ?? "failed" });
  }
});

export const aggregateTrendsGamesCron = onSchedule(
  { schedule: "0 * * * *", timeZone: "Asia/Tokyo" },
  async () => {
    await aggregateGamesTrend();
  }
);

/* ============================================================================
 * トレンド集計（Users / HTTP & Cron）
 * ==========================================================================*/

export const aggregateTrendsUsers = onRequest(async (req, res) => {
  try {
    const windowHours = Number(req.query.windowHours ?? 72);
    const result = await aggregateUsersTrend(windowHours);
    res.status(200).json(result);
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ ok: false, error: e?.message ?? "failed" });
  }
});

export const aggregateTrendsUsersCron = onSchedule(
  { schedule: "0 * * * *", timeZone: "Asia/Tokyo" },
  async () => {
    await aggregateUsersTrend(72);
  }
);

/* ============================================================================
 * ゲーム確定トリガー（posts 判定 → 集計反映）
 * ==========================================================================*/

// ✅ V1
export { onGameFinal };

// ✅ V2
export { onGameFinalV2 };

/* ============================================================================
 * NEW: 毎日1回、user_stats 再集計
 * ==========================================================================*/

// ✅ V1
export const rebuildUserStatsDailyCron = onSchedule(
  { schedule: "10 4 * * *", timeZone: "Asia/Tokyo" },
  async () => {
    console.log("[rebuildUserStatsDailyCron] start");

    try {
      const snap = await db.collection("users").select().get();

      for (const docSnap of snap.docs) {
        const uid = docSnap.id;
        try {
          await recomputeUserStatsFromDaily(uid);
        } catch (e) {
          console.error(`[rebuildUserStatsDailyCron] failed for uid=${uid}`, e);
        }
      }

      console.log(
        `[rebuildUserStatsDailyCron] done. processed users=${snap.size}`
      );
    } catch (e) {
      console.error("[rebuildUserStatsDailyCron] fatal error", e);
    }
  }
);
// ★ チームランキングを毎日 24:00 に更新
import { updateTeamRankings } from "./ranking/updateTeamRankings";

export const updateTeamRankingsDaily = onSchedule(
  { schedule: "0 0 * * *", timeZone: "Asia/Tokyo" },
  async () => {
    console.log("[updateTeamRankingsDaily] start");
    await updateTeamRankings();
    console.log("[updateTeamRankingsDaily] done");
  }
);

// ✅ V2
export { recomputeAllUsersStatsV2Daily };

/* ============================================================================
 * ✅ V2 リーグ別ランキング Cron
 * ==========================================================================*/

export { rebuildLeaderboardV2Cron };

/* ============================================================================
 * その他 Analytics
 * ==========================================================================*/

export { dailyAnalytics } from "./analytics/daily";
export { logUserActive } from "./analytics/logUserActive";
export { runDailyAnalytics } from "./analytics/runDaily";

// ==========================
// 手動実行できる Daily Analytics HTTP 関数
// ==========================

export const runDailyAnalyticsHttp = onRequest(async (req, res) => {
  try {
    const result = await dailyAnalyticsCore();
    res.status(200).json({ ok: true, result });
  } catch (err: any) {
    console.error("[runDailyAnalyticsHttp] failed:", err);
    res.status(500).json({ ok: false, error: String(err) });
  }
});

/* ============================================================================
 * 手動 Seed: teams JSON を Firestore に一括投入
 * ==========================================================================*/

export const seedTeamsHttp = onRequest(async (_req, res) => {
  try {
    await seedTeams();
    res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("[seedTeamsHttp] failed:", err);
    res.status(500).json({ ok: false, error: String(err) });
  }
});





