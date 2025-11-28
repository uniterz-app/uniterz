// functions/src/triggers/leaderboards.calendar.ts
import { onRequest } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getBucketForDateRangeJst, type Bucket } from "../updateUserStats";
import { getLastMonthRangeJst, getLastWeekRangeJst } from "../periods";

const db = getFirestore();

type CalendarKind = "month" | "week";
type LeagueKey = "all" | "b1" | "j1";

/** kind に応じて「対象期間」を決めるラッパー */
function resolveRange(kind: CalendarKind) {
  const now = new Date();
  return kind === "month" ? getLastMonthRangeJst(now) : getLastWeekRangeJst(now);
}

/** 「先月 / 先週」のリーダーボードを leaderboards_calendar に書き出す */
async function rebuildCalendarLeaderboard(kind: CalendarKind, league: LeagueKey) {
  const { start, end, id } = resolveRange(kind);

  const minPosts = kind === "month" ? 10 : 3;

  const usersSnap = await db.collection("users").get();

  const docId = `${kind}_${league}_${id}`;
  const periodDocRef = db.collection("leaderboards_calendar").doc(docId);

  await periodDocRef.set(
    {
      kind,
      league,
      periodId: id,
      startAtJst: start.toISOString(),
      endAtJst: end.toISOString(),
      rebuiltAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  // 古い users サブコレクションを削除
  const oldUsersSnap = await periodDocRef.collection("users").get();
  if (!oldUsersSnap.empty) {
    const batchDelete = db.batch();
    oldUsersSnap.docs.forEach((d) => batchDelete.delete(d.ref));
    await batchDelete.commit();
  }

  // 対象期間の成績を書き出す
  for (const userDoc of usersSnap.docs) {
    const uid = userDoc.id;
    const u = userDoc.data() as any;

    const bucket: Bucket = await getBucketForDateRangeJst(uid, start, end, league);

    if (bucket.posts < minPosts) continue;

    const posts   = bucket.posts   || 0;
    const hit     = bucket.hit     || 0;
    const units   = bucket.units   || 0;
    const oddsSum = bucket.oddsSum || 0;
    const oddsCnt = bucket.oddsCnt || 0;

    const winRate = posts > 0 ? hit / posts : 0;
    const avgOdds = oddsCnt > 0 ? oddsSum / oddsCnt : 0;

    const postsTotal = Number(u?.counts?.posts ?? 0);

    await periodDocRef.collection("users").doc(uid).set(
      {
        uid,
        displayName: u.displayName ?? "user",
        photoURL: u.photoURL ?? null,

        postsTotal,
        posts,
        hit,
        units,
        oddsSum,
        oddsCnt,
        winRate,
        avgOdds,

        league,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }

  return { kind, league, periodId: id };
}

/* ===================================================
 * HTTP 手動実行
 * ===================================================*/
export const rebuildCalendarLeaderboardsHttp = onRequest(async (req, res) => {
  try {
    const kindParam = (req.query.kind as string) || "month";
    const leagueParam = (req.query.league as string) || "all";

    const kind: CalendarKind = kindParam === "week" ? "week" : "month";
    const league: LeagueKey =
      leagueParam === "b1" ? "b1" :
      leagueParam === "j1" ? "j1" : "all";

    const result = await rebuildCalendarLeaderboard(kind, league);
    res.status(200).json({ ok: true, ...result });
  } catch (e: any) {
    console.error("[rebuildCalendarLeaderboardsHttp] failed:", e);
    res.status(500).json({ ok: false, error: e?.message ?? "failed" });
  }
});

/* ===================================================
 * Cron（毎月）
 * ===================================================*/
export const rebuildCalendarLeaderboardsCronMonth = onSchedule(
  {
    schedule: "0 20 31 * *", // JST 05:00
    timeZone: "Asia/Tokyo",
  },
  async () => {
    try {
      await rebuildCalendarLeaderboard("month", "all");
      await rebuildCalendarLeaderboard("month", "b1");
      await rebuildCalendarLeaderboard("month", "j1");
    } catch (e) {
      console.error("[rebuildCalendarLeaderboardsCronMonth] failed:", e);
    }
  }
);

/* ===================================================
 * Cron（毎週）
 * ===================================================*/
export const rebuildCalendarLeaderboardsCronWeek = onSchedule(
  {
    schedule: "0 20 * * 0", // JST 月曜05:00
    timeZone: "Asia/Tokyo",
  },
  async () => {
    try {
      await rebuildCalendarLeaderboard("week", "all");
      await rebuildCalendarLeaderboard("week", "b1");
      await rebuildCalendarLeaderboard("week", "j1");
    } catch (e) {
      console.error("[rebuildCalendarLeaderboardsCronWeek] failed:", e);
    }
  }
);
