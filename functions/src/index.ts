// functions/src/index.ts
import { setGlobalOptions } from "firebase-functions/v2/options";
import { onRequest } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { onDocumentCreated, onDocumentDeleted } from "firebase-functions/v2/firestore";

import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

import { aggregateGamesTrend } from "./trend/games.aggregate";
import { aggregateUsersTrend } from "./trend/users.aggregate";
import { recomputeUserStatsFromDaily } from "./updateUserStats";

// ★★★ onGameFinal を確実に有効化する import
import { onGameFinal } from "./onGameFinal";

// ====== Global Options / Admin ======
setGlobalOptions({ region: "asia-northeast1", maxInstances: 10 });
initializeApp();
const db = getFirestore();

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

// ★★★ これが重要。export onGameFinal（1行だけでOK）
export { onGameFinal };

/* ============================================================================
 * NEW: 毎日1回、user_stats 再集計
 * ==========================================================================*/

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
