import { onSchedule } from "firebase-functions/v2/scheduler";
import { onRequest } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { judgeLevels } from "./analysis/judgeLevel";
import { judgeAnalysisType } from "./analysis/judgeAnalysisType";

/* ============================================================================
 * Firestore
 * ============================================================================
 */
function db() {
  return getFirestore();
}

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
 * Types
 * ============================================================================
 */
type Agg = {
  posts: number;
  wins: number;
  brierSum: number;
  precisionSum: number;

  upsetHit: number;      // 既存
  upsetOpp: number;      // 既存
  upsetPick: number;     // ★ 追加（Upsetを予想した回数）

  leaguePosts: Record<string, number>;
};

/* ============================================================================
 * Radar Normalize (0–10)
 * ============================================================================
 */
function clamp10(v: number) {
  return Math.max(0, Math.min(10, Math.round(v)));
}

function toRadar10(params: {
  winRate: number;
  accuracy: number;
  avgPrecision: number;
  avgUpset: number;
}) {
  return {
    winRate: clamp10(params.winRate * 10),
    accuracy: clamp10(params.accuracy * 10),
    precision: clamp10((params.avgPrecision / 15) * 10),
    upset: clamp10(params.avgUpset * 10),
  };
}

/* ============================================================================
 * Percentile Utils
 * ============================================================================
 */
function percentile(sorted: number[], value: number) {
  if (sorted.length === 0) return 0;

  let below = 0;
  let equal = 0;

  for (const v of sorted) {
    if (v < value) below++;
    else if (v === value) equal++;
  }

  return Math.round(((below + equal * 0.5) / sorted.length) * 100);
}

/* ============================================================================
 * Main League Utils
 * ============================================================================
 */
function getMainLeague(leaguePosts: Record<string, number>) {
  let maxLeague: string | null = null;
  let maxPosts = 0;

  for (const [league, posts] of Object.entries(leaguePosts)) {
    if (posts > maxPosts) {
      maxPosts = posts;
      maxLeague = league;
    }
  }

  return maxLeague;
}

/* ============================================================================
 * Core
 * ============================================================================
 */
async function rebuildUserMonthlyStatsCore() {
  const range = getPreviousMonthRange();

  const startDate = toDateKeyJst(range.start);
  const endDate = toDateKeyJst(range.end);

  const snap = await db()
    .collection("user_stats_v2_daily")
    .where("date", ">=", startDate)
    .where("date", "<=", endDate)
    .get();

  const map = new Map<string, Agg>();

  for (const doc of snap.docs) {
    const d = doc.data();
    const uid = doc.id.split("_")[0];
    if (!uid) continue;

    const stats = d.all;
    if (!stats) continue;

    if (!map.has(uid)) {
      map.set(uid, {
  posts: 0,
  wins: 0,
  brierSum: 0,
  precisionSum: 0,

  upsetHit: 0,
  upsetOpp: 0,
  upsetPick: 0,   // ★ これを必ず追加

  leaguePosts: {},
});
    }

    const agg = map.get(uid)!;
    agg.posts += stats.posts ?? 0;
    agg.wins += stats.wins ?? 0;
    agg.brierSum += stats.brierSum ?? 0;
    agg.precisionSum += stats.scorePrecisionSum ?? 0;
    agg.upsetHit += stats.upsetHitCount ?? 0;
agg.upsetOpp += stats.upsetOpportunityCount ?? 0;
agg.upsetPick += stats.upsetPickCount ?? 0;

    // ★ daily.leagues からリーグ別投稿数を月間合算
    for (const [league, lstat] of Object.entries(d.leagues ?? {})) {
      const p = (lstat as any)?.posts ?? 0;
      agg.leaguePosts[league] = (agg.leaguePosts[league] ?? 0) + p;
    }
  }

  /* ===== rows ===== */
  const rows = Array.from(map.entries())
    .map(([uid, agg]) => {
      if (agg.posts === 0) return null;

      const winRate = agg.wins / agg.posts;
      const accuracy = 1 - agg.brierSum / agg.posts;
      const avgPrecision = agg.precisionSum / agg.posts;
      const MIN_UPSET_OPP = 5;

const avgUpset =
  agg.upsetOpp >= MIN_UPSET_OPP
    ? agg.upsetHit / agg.upsetOpp
    : 0;

      return {
        uid,
        posts: agg.posts,
        winRate,
        accuracy,
        avgPrecision,
        avgUpset,
        leaguePosts: agg.leaguePosts,
      };
    })
    .filter(Boolean) as {
      uid: string;
      posts: number;
      winRate: number;
      accuracy: number;
      avgPrecision: number;
      avgUpset: number;
      leaguePosts: Record<string, number>;
    }[];

  /* ===== 分布 ===== */
  const winRates = rows.map(r => r.winRate).sort((a, b) => a - b);
  const volumes = rows.map(r => r.posts).sort((a, b) => a - b);
  const accuracies = rows.map(r => r.accuracy).sort((a, b) => a - b);
  const precisions = rows.map(r => r.avgPrecision).sort((a, b) => a - b);
  const upsets = rows.map(r => r.avgUpset).sort((a, b) => a - b);

  // ★ リーグ別分布
  const leagueVolumeMap: Record<string, number[]> = {};
  for (const r of rows) {
    for (const [league, p] of Object.entries(r.leaguePosts)) {
      leagueVolumeMap[league] ??= [];
      leagueVolumeMap[league].push(p);
    }
  }
  for (const v of Object.values(leagueVolumeMap)) {
    v.sort((a, b) => a - b);
  }

  /* ============================================================================
 * Posts aggregation (monthly)
 * ============================================================================
 */

// 月内の post を一括取得（★1回だけ）
const postSnap = await db()
  .collection("posts")
  .where("status", "==", "final")
  .where("settledAt", ">=", range.start)
  .where("settledAt", "<=", range.end)
  .get();

  const postAggMap: Record<
  string,
  {
    homeAway: {
      home: { posts: number; wins: number };
      away: { posts: number; wins: number };
    };
    teamMap: Record<string, { posts: number; wins: number }>;
  }
> = {};

for (const doc of postSnap.docs) {
  const p = doc.data();
  const uid = p.authorUid;
  if (!uid) continue;

  postAggMap[uid] ??= {
    homeAway: {
      home: { posts: 0, wins: 0 },
      away: { posts: 0, wins: 0 },
    },
    teamMap: {},
  };

  const agg = postAggMap[uid];
  const pick = p.prediction?.winner; // home | away
  const isWin = p.stats?.isWin === true;

  // home / away
  if (pick === "home") {
    agg.homeAway.home.posts++;
    if (isWin) agg.homeAway.home.wins++;
  } else if (pick === "away") {
    agg.homeAway.away.posts++;
    if (isWin) agg.homeAway.away.wins++;
  }

  // team
  const teamId =
    pick === "home"
      ? p.home?.teamId
      : pick === "away"
      ? p.away?.teamId
      : null;

  if (!teamId) continue;

  agg.teamMap[teamId] ??= { posts: 0, wins: 0 };
  agg.teamMap[teamId].posts++;
  if (isWin) agg.teamMap[teamId].wins++;
}

  const batch = db().batch();

  for (const row of rows) {
    const postAgg = postAggMap[row.uid];

const homeAway = postAgg
  ? {
      home: {
        posts: postAgg.homeAway.home.posts,
        wins: postAgg.homeAway.home.wins,
        winRate:
          postAgg.homeAway.home.posts > 0
            ? postAgg.homeAway.home.wins /
              postAgg.homeAway.home.posts
            : 0,
      },
      away: {
        posts: postAgg.homeAway.away.posts,
        wins: postAgg.homeAway.away.wins,
        winRate:
          postAgg.homeAway.away.posts > 0
            ? postAgg.homeAway.away.wins /
              postAgg.homeAway.away.posts
            : 0,
      },
    }
  : {
      home: { posts: 0, wins: 0, winRate: 0 },
      away: { posts: 0, wins: 0, winRate: 0 },
    };

const teams = postAgg
  ? Object.entries(postAgg.teamMap)
      .map(([teamId, v]) => ({
        teamId,
        posts: v.posts,
        wins: v.wins,
        winRate: v.wins / v.posts,
      }))
      .filter(t => t.posts >= 5)
      .sort((a, b) =>
        b.winRate !== a.winRate
          ? b.winRate - a.winRate
          : b.posts - a.posts
      )
  : [];

// ===== strong を先に確定 =====
const strong = teams.slice(0, 3);

// ===== strong に含まれる teamId を除外 =====
const strongIds = new Set(strong.map(t => t.teamId));

// ===== 残りから weak を作る =====
const weak = teams
  .filter(t => !strongIds.has(t.teamId))
  .slice(-3)
  .reverse();

const teamStats = {
  strong,
  weak,
};

    const agg = map.get(row.uid)!;

    const raw = {
  posts: agg.posts,
  wins: agg.wins,
  winRate: row.winRate,
  accuracy: row.accuracy,
  avgPrecision: row.avgPrecision,

  avgUpset: row.avgUpset,
  upsetOpportunity: agg.upsetOpp, // ★ 追加
  upsetPick: agg.upsetPick,        // ★ 追加
  upsetHit: agg.upsetHit,          // ★ 追加

  leaguePosts: agg.leaguePosts,
};
    

    // ★ 主戦場リーグを決定
const mainLeague = getMainLeague(agg.leaguePosts);

// ★ 主戦場リーグでの volume percentile
const volumeMainLeague =
  mainLeague
    ? percentile(
        leagueVolumeMap[mainLeague] ?? [],
        agg.leaguePosts[mainLeague]
      )
    : 0;

const percentiles = {
  winRate: percentile(winRates, row.winRate),
  accuracy: percentile(accuracies, row.accuracy),
  precision: percentile(precisions, row.avgPrecision),
  upset: percentile(upsets, row.avgUpset),

  // ★ volume は主戦場リーグ基準だけにする
  volume: volumeMainLeague,

  // ★ 参考情報として残す（UIで使ってもいい）
  volumeByLeague: Object.fromEntries(
    Object.entries(agg.leaguePosts).map(([league, p]) => [
      league,
      percentile(leagueVolumeMap[league] ?? [], p),
    ])
  ),
};

    // radar10:
// - winRate / accuracy / precision / upset : 絶対評価（実力）
// - volume : 主戦場リーグ内での相対評価（活動量）
    const radar10 = {
      ...toRadar10(row),
      volume: clamp10(percentiles.volume / 10),
    };

    // ★ 分析タイプ判定
const levelSummary = judgeLevels(radar10);
const analysisTypeId = judgeAnalysisType(levelSummary);

    const ref = db()
      .collection("user_stats_v2_monthly")
      .doc(`${row.uid}_${range.id}`);

    batch.set(ref, {
      uid: row.uid,
      month: range.id,
      raw,
      radar10,
      percentiles,

      homeAway,
    teamStats,

      analysisTypeId,
  analysisLevels: levelSummary.levels,
  
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  await batch.commit();

  await buildMonthlyGlobalStats(rows, range.id);

  return {
    month: range.id,
    users: rows.length,
  };
}

/* ============================================================================
 * HTTP
 * ============================================================================
 */
export const rebuildUserMonthlyStatsV2 = onRequest(
  {
    region: "us-central1",
    memory: "1GiB",
    timeoutSeconds: 540,
  },
  async (_req, res) => {
    try {
      const result = await rebuildUserMonthlyStatsCore();
      res.status(200).json({ ok: true, ...result });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: String(e) });
    }
  }
);

async function buildMonthlyGlobalStats(
  rows: {
    winRate: number;
    accuracy: number;
    avgPrecision: number;
    avgUpset: number;
    posts: number;
  }[],
  month: string
) {
  if (rows.length === 0) return;

  /* =========================
   * 定数・ユーティリティ
   * ========================= */

  // ★ top10 用 足切り投稿数
  const MIN_POSTS_TOP = 30;

  const avg = (arr: number[]) =>
    arr.reduce((a, b) => a + b, 0) / arr.length;

  // ★ 配列ベースの top10%
  const top10Of = (arr: any[]) => {
    const n = Math.max(1, Math.floor(arr.length * 0.1));
    return arr.slice(-n);
  };

  /* =========================
   * top10 対象 rows（足切り）
   * ========================= */

  // ★ 勝率・精度系は投稿数30以上のみ
  const rowsForTop = rows.filter(r => r.posts >= MIN_POSTS_TOP);

  /* =========================
   * sort
   * ========================= */

  // ★ 実力指標（足切りあり）
  const byWinRate = [...rowsForTop].sort(
    (a, b) => a.winRate - b.winRate
  );
  const byAccuracy = [...rowsForTop].sort(
    (a, b) => a.accuracy - b.accuracy
  );
  const byPrecision = [...rowsForTop].sort(
    (a, b) => a.avgPrecision - b.avgPrecision
  );
  const byUpset = [...rowsForTop].sort(
    (a, b) => a.avgUpset - b.avgUpset
  );

  // ★ volume（活動量）は全体
  const byVolume = [...rows].sort((a, b) => a.posts - b.posts);

  /* =========================
   * document
   * ========================= */

  const doc = {
    month,

    avg: {
      winRate: avg(rows.map(r => r.winRate)),
      accuracy: avg(rows.map(r => r.accuracy)),
      precision: avg(rows.map(r => r.avgPrecision)),
      upset: avg(rows.map(r => r.avgUpset)),
      volume: avg(rows.map(r => r.posts)),
    },

    top10: {
      winRate: avg(top10Of(byWinRate).map(r => r.winRate)),
      accuracy: avg(top10Of(byAccuracy).map(r => r.accuracy)),
      precision: avg(top10Of(byPrecision).map(r => r.avgPrecision)),
      upset: avg(top10Of(byUpset).map(r => r.avgUpset)),
      volume: avg(top10Of(byVolume).map(r => r.posts)),
    },

    users: rows.length,
    top10EligibleUsers: rowsForTop.length,
    updatedAt: FieldValue.serverTimestamp(),
  };

  await db()
    .collection("monthly_global_stats_v2")
    .doc(month)
    .set(doc);
}

/* ============================================================================
 * Cron
 * ============================================================================
 */
export const rebuildUserMonthlyStatsMonthCronV2 = onSchedule(
  { schedule: "0 5 1 * *", timeZone: "Asia/Tokyo" },
  async () => {
    await rebuildUserMonthlyStatsCore();
  }
);
