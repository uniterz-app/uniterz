import { onSchedule } from "firebase-functions/v2/scheduler";
import { onRequest } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

/* ============================================================================
 * Firestore
 * ============================================================================
 */
function db() {
  return getFirestore();
}

const LEAGUES = ["bj", "nba"] as const;

/* ============================================================================
 * JST Date Utils
 * ============================================================================
 */
function toDateKeyJst(d: Date): string {
  const j = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const y = j.getUTCFullYear();
  const m = String(j.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(j.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function getPreviousWeekRange() {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const base = new Date(jst.getTime() - 7 * 24 * 60 * 60 * 1000);
  const dow = base.getDay();

  const monday = new Date(
    base.getFullYear(),
    base.getMonth(),
    base.getDate() - ((dow + 6) % 7)
  );
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return {
    start: monday,
    end: sunday,
    id: toDateKeyJst(monday),
  };
}

function getPreviousMonthRange() {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);

  const year = jst.getMonth() === 0 ? jst.getFullYear() - 1 : jst.getFullYear();
  const month = jst.getMonth() === 0 ? 11 : jst.getMonth() - 1;

  const start = new Date(year, month, 1, 0, 0, 0, 0);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);

  return {
    start,
    end,
    id: `${year}-${String(month + 1).padStart(2, "0")}`,
  };
}

/* ============================================================================
 * Ranking Core
 * ============================================================================
 */
type Agg = {
  posts: number;
  wins: number;
  brierSum: number;
  precisionSum: number;
  upsetSum: number;
  calibrationErrorSum: number;
};

function topN(rows: any[], key: string, n = 10) {
  return [...rows]
    .sort((a, b) => Number(b[key] ?? 0) - Number(a[key] ?? 0))
    .slice(0, n);
}

async function buildRanking(kind: "week" | "month", league: string) {
  const range =
    kind === "week" ? getPreviousWeekRange() : getPreviousMonthRange();

  const minPosts = kind === "week" ? 5 : 10;
  const docId = `${kind}_${league}_${range.id}`;
  const ref = db().collection("leaderboards_calendar_v2").doc(docId);

  await ref.set(
    {
      kind,
      league,
      periodId: range.id,
      startAtJst: range.start,
      endAtJst: range.end,
      rebuiltAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  const startDate = toDateKeyJst(range.start);
  const endDate = toDateKeyJst(range.end);

  const statsSnap = await db()
    .collection("user_stats_v2_daily")
    .where("date", ">=", startDate)
    .where("date", "<=", endDate)
    .get();

  const map = new Map<string, Agg>();

  for (const doc of statsSnap.docs) {
    const d = doc.data();
    const uid = doc.id.split("_")[0];
    if (!uid) continue;

    const leagueStats = d.leagues?.[league];
    if (!leagueStats) continue;

    if (!map.has(uid)) {
      map.set(uid, {
        posts: 0,
        wins: 0,
        brierSum: 0,
        precisionSum: 0,
        upsetSum: 0,
        calibrationErrorSum: 0,
      });
    }

    const agg = map.get(uid)!;
    agg.posts += leagueStats.posts ?? 0;
    agg.wins += leagueStats.wins ?? 0;
    agg.brierSum += leagueStats.brierSum ?? 0;
    agg.precisionSum += leagueStats.scorePrecisionSum ?? 0;
    agg.upsetSum += leagueStats.upsetScoreSum ?? 0;
    agg.calibrationErrorSum += leagueStats.calibrationErrorSum ?? 0;
  }

  /* ---- rows 作成 ---- */
  const rows: any[] = [];

  for (const [uid, agg] of map.entries()) {
    if (agg.posts < minPosts) continue;

    const accuracy = (1 - agg.brierSum / agg.posts) * 100;
    const avgPrecision = agg.precisionSum / agg.posts;
    const avgUpset = agg.upsetSum / agg.posts;
    const winRate = agg.wins / agg.posts;

    const consistency =
      agg.calibrationErrorSum > 0
        ? Math.max(
            0,
            Math.min(100, (1 - agg.calibrationErrorSum / agg.posts) * 100)
          )
        : null;

    const userSnap = await db().collection("users").doc(uid).get();
const user = userSnap.exists ? userSnap.data() : {};

rows.push({
  uid,
  handle: user?.handle ?? null,
  displayName: user?.displayName ?? "user",
  photoURL: user?.photoURL ?? null,

  league,
  posts: agg.posts,
  wins: agg.wins,
  winRate,
  accuracy,
  avgPrecision,
  avgUpset,
  consistency,
});
  }

  /* ---- Top10 保存（★ 追加部分） ---- */
  const top10 = {
    winRate: topN(rows, "winRate"),
    accuracy: topN(rows, "accuracy"),
    consistency: topN(rows, "consistency"),
    avgPrecision: topN(rows, "avgPrecision"),
    avgUpset: topN(rows, "avgUpset"),
  };

  await ref.set({ top10 }, { merge: true });

  return { kind, league, periodId: range.id };
}

/* ============================================================================
 * HTTP
 * ============================================================================
 */
export const rebuildCalendarLeaderboardsHttpV2 = onRequest(async (req, res) => {
  try {
    const kind = req.query.kind === "week" ? "week" : "month";
    const league =
      typeof req.query.league === "string" ? req.query.league : "bj";

    const result = await buildRanking(kind, league);
    res.status(200).json({ ok: true, ...result });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ============================================================================
 * Cron
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

export const rebuildLeaderboardMonthV2 = onSchedule(
  { schedule: "0 5 1 * *", timeZone: "Asia/Tokyo" },
  async () => {
    for (const league of LEAGUES) {
      await buildRanking("month", league);
    }
  }
);
