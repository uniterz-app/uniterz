import { FieldValue, type QuerySnapshot } from "firebase-admin/firestore";
import { db } from "../firebase";
import {
  markGamePushNotified,
  sendExpoPushToUids,
  uniqueAuthorTargetsFromPosts,
} from "./sendExpoPush";
import { resolveGameMatchupCopy } from "./pushNotificationCopy";
import { userDataPlan } from "../shared/userPlanActive";

/** 同じ日本時間の日付では 1 回だけ送る */
const NBA_DAILY_RANKING_PUSH_DOC = "notificationDispatch/nbaDailyRanking";

export async function notifyGameFinalPush(input: {
  gameId: string;
  after: Record<string, unknown>;
  postsSnap: QuerySnapshot;
  homeScore: number;
  awayScore: number;
}): Promise<void> {
  if (input.after.pushNotifiedFinalAt) return;

  const targets = uniqueAuthorTargetsFromPosts(
    input.postsSnap.docs,
    "game_final",
    input.gameId
  );
  if (targets.length === 0) {
    await markGamePushNotified(input.gameId, "pushNotifiedFinalAt");
    return;
  }

  // ネタバレ回避 — スコアは載せない（対戦名のみ）
  const matchup = resolveGameMatchupCopy(input.after);

  const result = await sendExpoPushToUids({
    type: "game_final",
    targets,
    matchup,
  });

  if (result.sent > 0 || targets.length === 0) {
    await markGamePushNotified(input.gameId, "pushNotifiedFinalAt");
  }

  console.log(
    `[notifyGameFinalPush] game=${input.gameId} sent=${result.sent} targets=${targets.length}`
  );
}

export async function notifyRankingUpdatedPush(uids: string[]): Promise<void> {
  const unique = [...new Set(uids.filter(Boolean))];
  if (unique.length === 0) return;

  const targets = unique.map((uid) => ({
    uid,
    data: { type: "ranking_updated" as const },
  }));

  const result = await sendExpoPushToUids({
    type: "ranking_updated",
    targets,
  });

  console.log(
    `[notifyRankingUpdatedPush] sent=${result.sent} targets=${targets.length}`
  );
}

/**
 * 累積ランキングの日次更新後。順位が付いたユーザーへ 1 日 1 回。
 * 設定がオフの人は sendExpoPush 側で落とす。
 */
export async function notifyDailyRankingUpdatedPush(input: {
  uids: string[];
  dateKey: string;
}): Promise<void> {
  const unique = [...new Set(input.uids.filter(Boolean))];
  const dateKey = input.dateKey.trim();
  if (unique.length === 0 || !dateKey) return;

  const ref = db.doc(NBA_DAILY_RANKING_PUSH_DOC);
  const claimed = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const prev = snap.data();
    if (
      prev?.dateKey === dateKey &&
      (prev.status === "sent" || prev.status === "sending")
    ) {
      return false;
    }
    tx.set(
      ref,
      {
        dateKey,
        status: "sending",
        targets: unique.length,
        claimedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    return true;
  });
  if (!claimed) {
    console.log(
      `[notifyDailyRankingUpdatedPush] skip date=${dateKey} already claimed`
    );
    return;
  }

  try {
    await notifyRankingUpdatedPush(unique);
    await ref.set(
      {
        dateKey,
        status: "sent",
        sentAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    await ref.set(
      {
        dateKey,
        status: "error",
        errorAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    throw err;
  }
}

/** 週次レポート確定後 — Pro ユーザーへ（prefs.weeklyReport） */
export async function notifyWeeklyReportPush(input: {
  uids: string[];
  weekLabel: string;
}): Promise<void> {
  const unique = [...new Set(input.uids.filter(Boolean))];
  if (unique.length === 0) return;

  const { getFirestore } = await import("firebase-admin/firestore");
  const { canViewWeeklyReport } = await import("../reports/reportEntitlements");
  const db = getFirestore();
  const eligibleUids: string[] = [];
  for (let i = 0; i < unique.length; i += 80) {
    const chunk = unique.slice(i, i + 80);
    const refs = chunk.map((uid) => db.collection("users").doc(uid));
    const snaps = await db.getAll(...refs);
    for (const snap of snaps) {
      if (!snap.exists) continue;
      const data = snap.data() ?? {};
      if (
        canViewWeeklyReport({
          plan: userDataPlan(data),
          planType: data.planType,
        })
      ) {
        eligibleUids.push(snap.id);
      }
    }
  }
  if (eligibleUids.length === 0) return;

  const targets = eligibleUids.map((uid) => ({
    uid,
    data: {
      type: "weekly_report" as const,
      weekLabel: input.weekLabel,
    },
  }));

  const result = await sendExpoPushToUids({
    type: "weekly_report",
    targets,
    matchup: {
      detail: input.weekLabel,
    },
  });

  console.log(
    `[notifyWeeklyReportPush] week=${input.weekLabel} sent=${result.sent} targets=${targets.length}`
  );
}

/** 月次レポート確定後 — Monthly/Season Pro へ（prefs.monthlyReport）。Weekly プランは除外 */
export async function notifyMonthlyReportPush(input: {
  uids: string[];
  monthKey: string;
}): Promise<void> {
  const unique = [...new Set(input.uids.filter(Boolean))];
  if (unique.length === 0) return;

  const { getFirestore } = await import("firebase-admin/firestore");
  const { canViewMonthlyReport } = await import("../reports/reportEntitlements");
  const db = getFirestore();
  const eligibleUids: string[] = [];
  for (let i = 0; i < unique.length; i += 80) {
    const chunk = unique.slice(i, i + 80);
    const refs = chunk.map((uid) => db.collection("users").doc(uid));
    const snaps = await db.getAll(...refs);
    for (const snap of snaps) {
      if (!snap.exists) continue;
      const data = snap.data() ?? {};
      if (
        canViewMonthlyReport({
          plan: userDataPlan(data),
          planType: data.planType,
        })
      ) {
        eligibleUids.push(snap.id);
      }
    }
  }
  if (eligibleUids.length === 0) return;

  const targets = eligibleUids.map((uid) => ({
    uid,
    data: {
      type: "monthly_report" as const,
      monthKey: input.monthKey,
    },
  }));

  const result = await sendExpoPushToUids({
    type: "monthly_report",
    targets,
    matchup: {
      detail: input.monthKey,
    },
  });

  console.log(
    `[notifyMonthlyReportPush] month=${input.monthKey} sent=${result.sent} targets=${targets.length}`
  );
}
