// functions/src/triggers/leaderboards.calendar.v2.ts
import { onSchedule } from "firebase-functions/v2/scheduler";
import { onRequest } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

import { getStatsForDateRangeV2 } from "../updateUserStatsV2";

// Firestore はトップレベルで保持しない
function db() {
  return getFirestore();
}

const LEAGUES = ["bj", "nba", "pl"] as const;

/* ============================================================================
 * JST Utilities
 * ============================================================================
 */
function getJstDate(d = new Date()): Date {
  return new Date(d.getTime() + 9 * 60 * 60 * 1000);
}

/** 月曜〜日曜の週レンジを取得（現在日時に依存せず固定週） */
function getFixedWeekRangeJST() {
  const now = getJstDate();

  // JST の曜日 (0: 日, 1: 月, ...)
  const dow = now.getDay();

  // 今週の月曜日
  const monday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - ((dow + 6) % 7)
  );
  monday.setHours(0, 0, 0, 0);

  // 今週の日曜日
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const id = monday.toISOString().slice(0, 10);

  return { start: monday, end: sunday, id };
}

/** 前月 1日〜末日レンジ */
function getPreviousMonthRangeJST() {
  const now = getJstDate();

  const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const month = now.getMonth() === 0 ? 11 : now.getMonth() - 1;

  const start = new Date(year, month, 1, 0, 0, 0, 0);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999); // 前月末日

  const id = `${year}-${String(month + 1).padStart(2, "0")}`;

  return { start, end, id };
}

/* ============================================================================
 * ランキング構築ロジック（週 / 月 共通）
 * ============================================================================
 */
async function buildRanking(kind: "week" | "month", league: string) {
  const usersSnap = await db().collection("users").get();

  const range =
    kind === "week" ? getFixedWeekRangeJST() : getPreviousMonthRangeJST();

  const minPosts = kind === "week" ? 5 : 10;

  // ドキュメント ID 例：
  //   week_bj_2024-12-02
  //   month_bj_2024-11
  const docId = `${kind}_${league}_${range.id}`;
  const ref = db().collection("leaderboards_calendar_v2").doc(docId);

  // メタ情報更新
  await ref.set(
    {
      kind,
      league,
      periodId: range.id,
      startAtJst: range.start.toISOString(),
      endAtJst: range.end.toISOString(),
      rebuiltAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  // 古いデータ削除
  const old = await ref.collection("users").get();
  if (!old.empty) {
    const batch = db().batch();
    old.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }

  // -----------------------------
  // ランキング再集計
  // -----------------------------
  for (const user of usersSnap.docs) {
    const uid = user.id;

    const bucket = await getStatsForDateRangeV2(
      uid,
      range.start,
      range.end,
      league
    );

    if (bucket.posts < minPosts) continue;

    const accuracy = (1 - bucket.avgBrier) * 100;

const avgCalibration =
  typeof bucket.avgCalibration === "number"
    ? bucket.avgCalibration
    : null;

const consistency =
  avgCalibration !== null
    ? Math.max(0, Math.min(100, (1 - avgCalibration) * 100))
    : null;

const payload: any = {
  uid,
  league,
  posts: bucket.posts,

  winRate: bucket.winRate,
  accuracy,
  avgPrecision: bucket.avgPrecision ?? null,
  avgUpset: bucket.avgUpset ?? null,
  consistency, // ✅ 計算結果を保存

  updatedAt: FieldValue.serverTimestamp(),
};

    await ref.collection("users").doc(uid).set(payload, { merge: true });
  }

  return { kind, league, periodId: range.id };
}

/* ============================================================================
 * HTTP（手動実行）
 * ============================================================================
 */
export const rebuildCalendarLeaderboardsHttpV2 = onRequest(async (req, res) => {
  try {
    const kind = req.query.kind === "week" ? "week" : "month";
    const league = typeof req.query.league === "string" ? req.query.league : "bj";

    const result = await buildRanking(kind as any, league);
    res.status(200).json({ ok: true, ...result });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ============================================================================
 * Cron（毎週：月曜 05:00 JST）
 * ============================================================================
 */
export const rebuildLeaderboardWeekV2 = onSchedule(
  { schedule: "0 5 * * 1", timeZone: "Asia/Tokyo" },
  async () => {
    for (const league of LEAGUES) {
      await buildRanking("week", league);
    }
  }
);

/* ============================================================================
 * Cron（毎月 1日：05:00 JST）
 * ============================================================================
 */
export const rebuildLeaderboardMonthV2 = onSchedule(
  { schedule: "0 5 1 * *", timeZone: "Asia/Tokyo" },
  async () => {
    for (const league of LEAGUES) {
      await buildRanking("month", league);
    }
  }
);

