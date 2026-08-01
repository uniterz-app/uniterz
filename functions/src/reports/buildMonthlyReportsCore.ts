// 月次レポート builder — daily 1 パス + period snapshots → user_reports
// 旧 user_stats_v2_monthly は読まない。
// docs/pro-subscription-plan.md § 月次レポート集計スキーム

import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { CURRENT_NBA_SEASON_KEY } from "../rankings/nbaSeason";
import {
  addDaysToDateKey,
  monthLabelJST,
  previousLabel,
  rangeForLabel,
} from "../rankings/nbaPeriod";
import {
  buildMonthlyRadarPercentiles,
  collectMonthlyRadarStrengths,
  judgeMonthlyAnalysisType,
  type MonthlyRadarStrengthInput,
} from "./monthlyRadarJudge";
import type { MonthlyReportRadarAxisKey } from "./monthlyReportTypes";
import {
  accumulateTeamAffinityPost,
  buildMonthlyTeamAffinity,
  type MonthlyTeamAffinityAgg,
} from "./buildMonthlyTeamAffinity";
import { resolveNbaTeamAbbr } from "./resolveNbaTeamAbbr";
import {
  buildMonthlyHighlights,
  type MonthlyHighlightPostEvent,
} from "./buildMonthlyHighlights";
import { buildMonthlyOutlookSummary } from "./buildMonthlyOutlookSummary";
import {
  buildMonthlyHabits,
  type MonthlyHabitsRaw,
} from "./buildMonthlyHabits";

function db() {
  return getFirestore();
}

type DailyInc = {
  posts?: number;
  wins?: number;
  pointsSumV3?: number;
  upsetPointsSum?: number;
  goalScorerHitCount?: number;
};

type Agg = {
  posts: number;
  wins: number;
  points: number;
  upset: number;
  scorer: number;
};

type PeriodMetric =
  | "totalPoints"
  | "winRate"
  | "totalUpset"
  | "totalGoalScorerHits";

const PERIOD_METRICS: PeriodMetric[] = [
  "totalPoints",
  "winRate",
  "totalUpset",
  "totalGoalScorerHits",
];

/** 耐性 raw（既存月次 Pro Stats と同系） */
const STREAK_RUN_CAP = 10;

function emptyAgg(): Agg {
  return { posts: 0, wins: 0, points: 0, upset: 0, scorer: 0 };
}

function emptyHabitsRaw(): MonthlyHabitsRaw {
  return {
    home: { posts: 0, wins: 0 },
    away: { posts: 0, wins: 0 },
    favorite: { posts: 0, wins: 0 },
    underdog: { posts: 0, wins: 0 },
  };
}

function addInc(agg: Agg, inc: DailyInc | null | undefined) {
  if (!inc || typeof inc !== "object") return;
  agg.posts += Number(inc.posts ?? 0) || 0;
  agg.wins += Number(inc.wins ?? 0) || 0;
  agg.points += Number(inc.pointsSumV3 ?? 0) || 0;
  agg.upset += Number(inc.upsetPointsSum ?? 0) || 0;
  agg.scorer += Number(inc.goalScorerHitCount ?? 0) || 0;
}

function pickNbaInc(data: Record<string, unknown>): DailyInc | null {
  const bySeason = data.rankingBySeason as
    | Record<string, DailyInc>
    | undefined;
  const seasonInc = bySeason?.[CURRENT_NBA_SEASON_KEY];
  if (seasonInc && typeof seasonInc === "object") return seasonInc;
  const leagues = data.leagues as { nba?: DailyInc } | undefined;
  if (leagues?.nba && typeof leagues.nba === "object") return leagues.nba;
  return null;
}

function uidFromDailyDocId(docId: string, dateKey: string): string | null {
  const suffix = `_${dateKey}`;
  if (docId.endsWith(suffix)) return docId.slice(0, -suffix.length);
  const i = docId.lastIndexOf("_");
  if (i <= 0) return null;
  return docId.slice(0, i);
}

function calcStreakFromEvents(
  events: { settledAtMs: number; isWin: boolean }[]
): { maxWin: number; maxLose: number } {
  const sorted = [...events].sort((a, b) => a.settledAtMs - b.settledAtMs);
  let curWin = 0;
  let maxWin = 0;
  let curLose = 0;
  let maxLose = 0;
  for (const e of sorted) {
    if (e.isWin) {
      curWin += 1;
      curLose = 0;
      if (curWin > maxWin) maxWin = curWin;
    } else {
      curLose += 1;
      curWin = 0;
      if (curLose > maxLose) maxLose = curLose;
    }
  }
  return { maxWin, maxLose };
}

function staminaRaw(maxWin: number, maxLose: number): number {
  return (
    7 +
    Math.min(maxWin, STREAK_RUN_CAP) * 0.35 -
    Math.min(maxLose, STREAK_RUN_CAP) * 0.9
  );
}

/** 暦月 YYYY-MM の daily NBA 合算 */
async function loadMonthAggByUid(
  monthKey: string
): Promise<Map<string, Agg>> {
  const [y, m] = monthKey.split("-").map(Number);
  const lastDay = new Date(Date.UTC(y!, m!, 0)).getUTCDate();
  const startKey = `${y}-${String(m).padStart(2, "0")}-01`;
  const endKey = `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  const statsSnap = await db()
    .collection("user_stats_v2_daily")
    .where("date", ">=", startKey)
    .where("date", "<=", endKey)
    .get();

  const aggByUid = new Map<string, Agg>();
  for (const doc of statsSnap.docs) {
    const data = doc.data() as Record<string, unknown>;
    const dateKey = String(data.date ?? "");
    const uid = uidFromDailyDocId(doc.id, dateKey);
    if (!uid) continue;
    const inc = pickNbaInc(data);
    if (!inc) continue;
    if (!aggByUid.has(uid)) aggByUid.set(uid, emptyAgg());
    addInc(aggByUid.get(uid)!, inc);
  }
  return aggByUid;
}

function percentile(sorted: number[], value: number): number {
  if (sorted.length === 0) return 0;
  let below = 0;
  let equal = 0;
  for (const v of sorted) {
    if (v < value) below++;
    else if (v === value) equal++;
  }
  return ((below + equal * 0.5) / sorted.length) * 100;
}

function median(sorted: number[]): number {
  if (sorted.length === 0) return 0;
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid]!;
  return (sorted[mid - 1]! + sorted[mid]!) / 2;
}

function top10Mean(sorted: number[]): number {
  if (sorted.length === 0) return 0;
  const n = Math.max(1, Math.ceil(sorted.length * 0.1));
  const slice = sorted.slice(-n);
  return slice.reduce((a, b) => a + b, 0) / slice.length;
}

function previousMonthKey(monthKey: string): string {
  return previousLabel("monthly", monthKey);
}

/** 月に重なるピックアップ試合数（週 doc の gameIds 和集合） */
async function resolvePickupGameCount(monthKey: string): Promise<{
  pickupGameCount: number;
  pickupGameIds: string[];
}> {
  const range = rangeForLabel("monthly", monthKey);
  // 月初の週月曜〜月末をカバーする weekKey を列挙
  const weekKeys: string[] = [];
  let cursor = range.startKey;
  // 月曜揃え
  const [y, m, d] = cursor.split("-").map(Number);
  const dt = new Date(Date.UTC(y!, m! - 1, d!));
  const daysSinceMonday = (dt.getUTCDay() + 6) % 7;
  cursor = addDaysToDateKey(cursor, -daysSinceMonday);
  while (cursor <= range.endKey) {
    weekKeys.push(cursor);
    cursor = addDaysToDateKey(cursor, 7);
  }

  const refs = weekKeys.map((wk) =>
    db().collection("nba_pickup_weeks").doc(wk)
  );
  if (refs.length === 0) return { pickupGameCount: 0, pickupGameIds: [] };

  const snaps = await db().getAll(...refs);
  const idSet = new Set<string>();
  for (const snap of snaps) {
    if (!snap.exists) continue;
    const data = snap.data() ?? {};
    if (data.status !== "final" && data.status !== "draft") continue;
    const ids = Array.isArray(data.gameIds) ? data.gameIds : [];
    for (const id of ids) {
      if (typeof id === "string" && id) idSet.add(id);
    }
  }
  const pickupGameIds = [...idSet];
  return { pickupGameCount: pickupGameIds.length, pickupGameIds };
}

async function loadPeriodRanks(monthKey: string): Promise<{
  ranks: Record<PeriodMetric, Record<string, number>>;
  prevPointsRanks: Record<string, number>;
  participantCount: number;
}> {
  const firestore = db();
  const refs = PERIOD_METRICS.map((metric) =>
    firestore
      .collection("period_ranking_snapshots")
      .doc(`nba_monthly_${monthKey}_${metric}`)
  );
  const snaps = await firestore.getAll(...refs);
  const ranks = {} as Record<PeriodMetric, Record<string, number>>;
  let participantCount = 0;

  PERIOD_METRICS.forEach((metric, i) => {
    const data = snaps[i]?.exists ? snaps[i].data() ?? {} : {};
    ranks[metric] =
      data.ranks && typeof data.ranks === "object"
        ? (data.ranks as Record<string, number>)
        : {};
    if (metric === "totalPoints") {
      participantCount = Number(data.count ?? 0) || Object.keys(ranks[metric]).length;
    }
  });

  const prevKey = previousMonthKey(monthKey);
  const prevSnap = await firestore
    .collection("period_ranking_snapshots")
    .doc(`nba_monthly_${prevKey}_totalPoints`)
    .get();
  const prevPointsRanks =
    prevSnap.exists && prevSnap.data()?.ranks
      ? (prevSnap.data()!.ranks as Record<string, number>)
      : {};

  return { ranks, prevPointsRanks, participantCount };
}

function toDateKeyJstFromDate(d: Date): string {
  const j = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const y = j.getUTCFullYear();
  const m = String(j.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(j.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function numOr(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function metricRow(
  key: string,
  value: number,
  prev: number | null,
  med: number | null,
  top10: number | null,
  rank: number | null
) {
  return {
    key,
    value,
    prevDelta: prev == null ? null : value - prev,
    median: med,
    top10,
    rank,
  };
}

/**
 * @param monthKey YYYY-MM。省略時は前月 JST。
 */
export async function rebuildMonthlyReportsCore(opts?: {
  monthKey?: string;
  /** 書き込み上限（テスト用）。未指定で全員 */
  limit?: number;
}): Promise<{ monthKey: string; written: number }> {
  const now = new Date();
  const currentMonth = monthLabelJST(now);
  const monthKey =
    opts?.monthKey ?? previousLabel("monthly", currentMonth);
  const range = rangeForLabel("monthly", monthKey, now);
  // 確定月は月末までフル範囲
  const [y, m] = monthKey.split("-").map(Number);
  const lastDay = new Date(Date.UTC(y!, m!, 0)).getUTCDate();
  const fullEnd = `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  const startKey = range.startKey;
  const endKey = fullEnd;

  const { pickupGameCount, pickupGameIds } =
    await resolvePickupGameCount(monthKey);
  const pickupSet = new Set(pickupGameIds);
  const { ranks, prevPointsRanks, participantCount } =
    await loadPeriodRanks(monthKey);

  const prevMonthKey = previousMonthKey(monthKey);
  const [aggByUid, prevAggByUid] = await Promise.all([
    loadMonthAggByUid(monthKey),
    loadMonthAggByUid(prevMonthKey),
  ]);

  // posts 1 パス: チーム相性 + ハイライト + クセ（ピックアップのみ）
  const teamAffinityByUid = new Map<
    string,
    Map<string, MonthlyTeamAffinityAgg>
  >();
  const highlightEventsByUid = new Map<string, MonthlyHighlightPostEvent[]>();
  const habitsRawByUid = new Map<string, MonthlyHabitsRaw>();

  if (pickupSet.size > 0) {
    const settledStart = new Date(`${startKey}T00:00:00+09:00`);
    const settledEnd = new Date(`${endKey}T23:59:59.999+09:00`);
    const postSnap = await db()
      .collection("posts")
      .where("status", "==", "final")
      .where("settledAt", ">=", settledStart)
      .where("settledAt", "<=", settledEnd)
      .get();

    for (const doc of postSnap.docs) {
      const p = doc.data();
      const uid = p.authorUid as string | undefined;
      if (!uid) continue;

      const league = String(p.league ?? p.sportLeague ?? "nba").toLowerCase();
      if (league && league !== "nba") continue;

      const gameId = String(p.gameId ?? "");
      if (!gameId || !pickupSet.has(gameId)) continue;

      const pick = p.prediction?.winner as string | undefined;
      const isWin = p.stats?.isWin === true;
      const homeId = p.home?.teamId ? String(p.home.teamId) : "";
      const awayId = p.away?.teamId ? String(p.away.teamId) : "";
      const homeAbbr =
        (p.home?.abbr as string | undefined) ||
        (p.home?.shortName as string | undefined) ||
        (homeId ? resolveNbaTeamAbbr(homeId) : "HOME");
      const awayAbbr =
        (p.away?.abbr as string | undefined) ||
        (p.away?.shortName as string | undefined) ||
        (awayId ? resolveNbaTeamAbbr(awayId) : "AWAY");

      const settledAt: Date =
        p.settledAt?.toDate?.() instanceof Date
          ? p.settledAt.toDate()
          : settledStart;
      const resultHome = numOr(p.result?.home ?? p.result?.homeScore, 0);
      const resultAway = numOr(p.result?.away ?? p.result?.awayScore, 0);
      const myHome = numOr(p.prediction?.score?.home, 0);
      const myAway = numOr(p.prediction?.score?.away, 0);
      if (!highlightEventsByUid.has(uid)) {
        highlightEventsByUid.set(uid, []);
      }
      highlightEventsByUid.get(uid)!.push({
        settledAtMs: settledAt.getTime(),
        dateKey: toDateKeyJstFromDate(settledAt),
        points: numOr(p.stats?.pointsV3, 0),
        isWin,
        upsetPoints: numOr(p.stats?.upsetPoints, 0),
        home: {
          teamId: homeId || "home",
          abbr: homeAbbr,
          score: resultHome,
        },
        away: {
          teamId: awayId || "away",
          abbr: awayAbbr,
          score: resultAway,
        },
        myHome,
        myAway,
      });

      // 予想のクセ
      if (!habitsRawByUid.has(uid)) {
        habitsRawByUid.set(uid, emptyHabitsRaw());
      }
      const habit = habitsRawByUid.get(uid)!;
      if (pick === "home") {
        habit.home.posts += 1;
        if (isWin) habit.home.wins += 1;
      } else if (pick === "away") {
        habit.away.posts += 1;
        if (isWin) habit.away.wins += 1;
      }
      const majority = p.marketMeta?.majoritySide as string | undefined;
      if (majority && pick && (pick === "home" || pick === "away")) {
        if (pick === majority) {
          habit.favorite.posts += 1;
          if (isWin) habit.favorite.wins += 1;
        } else {
          habit.underdog.posts += 1;
          if (isWin) habit.underdog.wins += 1;
        }
      }

      const side =
        pick === "home" ? p.home : pick === "away" ? p.away : null;
      const teamId = side?.teamId ? String(side.teamId) : "";
      if (!teamId) continue;

      if (!teamAffinityByUid.has(uid)) {
        teamAffinityByUid.set(uid, new Map());
      }
      const abbr =
        (side?.abbr as string | undefined) ||
        (side?.shortName as string | undefined) ||
        resolveNbaTeamAbbr(teamId);
      accumulateTeamAffinityPost(teamAffinityByUid.get(uid)!, {
        teamId,
        abbr,
        isWin,
        points: numOr(p.stats?.pointsV3, 0),
      });
    }
  }

  let uids = [...aggByUid.keys()].filter(
    (uid) => (aggByUid.get(uid)?.posts ?? 0) > 0
  );
  if (opts?.limit != null) uids = uids.slice(0, opts.limit);

  const sampleMinPosts =
    pickupGameCount > 0 ? Math.ceil(pickupGameCount * 0.5) : 10;

  type Row = {
    uid: string;
    agg: Agg;
    winRate: number;
    activityRate: number;
    sampleEligible: boolean;
    maxWinStreak: number;
    maxLoseStreak: number;
    stamina: number;
  };

  const rows: Row[] = uids.map((uid) => {
    const agg = aggByUid.get(uid)!;
    const winRate = agg.posts > 0 ? agg.wins / agg.posts : 0;
    const activityRate =
      pickupGameCount > 0
        ? Math.min(1, agg.posts / pickupGameCount)
        : agg.posts >= 10
          ? 1
          : agg.posts / 10;
    const streak = calcStreakFromEvents(highlightEventsByUid.get(uid) ?? []);
    return {
      uid,
      agg,
      winRate,
      activityRate,
      sampleEligible: agg.posts >= sampleMinPosts,
      maxWinStreak: streak.maxWin,
      maxLoseStreak: streak.maxLose,
      stamina: staminaRaw(streak.maxWin, streak.maxLose),
    };
  });

  const cohort = rows.filter((r) => r.sampleEligible);
  const sortNums = (xs: number[]) => [...xs].sort((a, b) => a - b);

  const winRates = sortNums(cohort.map((r) => r.winRate));
  const scorers = sortNums(cohort.map((r) => r.agg.scorer));
  const upsets = sortNums(cohort.map((r) => r.agg.upset));
  const activities = sortNums(cohort.map((r) => r.activityRate));
  const pointsArr = sortNums(cohort.map((r) => r.agg.points));
  const postsArr = sortNums(cohort.map((r) => r.agg.posts));
  const staminaArr = sortNums(cohort.map((r) => r.stamina));

  const scorerMedian = median(scorers);
  const upsetMedian = median(upsets);

  const WRITE_CHUNK = 400;
  let written = 0;

  for (let offset = 0; offset < rows.length; offset += WRITE_CHUNK) {
    const chunk = rows.slice(offset, offset + WRITE_CHUNK);
    const batch = db().batch();

    for (const row of chunk) {
      const {
        uid,
        agg,
        winRate,
        activityRate,
        sampleEligible,
        maxLoseStreak,
        stamina,
      } = row;

      const consistencyPct = percentile(staminaArr, stamina);

      const radarPercentiles = {
        win: percentile(winRates, winRate),
        scorer: percentile(scorers, agg.scorer),
        upset: percentile(upsets, agg.upset),
        activity: percentile(activities, activityRate),
        consistency: consistencyPct,
      };

      const strengthInput: MonthlyRadarStrengthInput = {
        win: { percentile: radarPercentiles.win, winRate },
        scorer: {
          percentile: radarPercentiles.scorer,
          scorerHits: agg.scorer,
          scorerMedian,
        },
        upset: {
          percentile: radarPercentiles.upset,
          upsetPoints: agg.upset,
          upsetMedian,
          // V1 proxy: 投稿数を機会の上限として使う
          upsetOpportunity: Math.max(agg.posts, agg.upset > 0 ? 5 : 0),
        },
        activity: {
          percentile: radarPercentiles.activity,
          activityRate,
        },
        consistency: {
          percentile: radarPercentiles.consistency,
          maxLoseStreak,
        },
      };

      const strengths: MonthlyReportRadarAxisKey[] = sampleEligible
        ? collectMonthlyRadarStrengths(strengthInput)
        : [];
      const analysisTypeId = judgeMonthlyAnalysisType({
        strengths,
        sampleEligible,
      });
      const radar = buildMonthlyRadarPercentiles(strengthInput);

      const pointsRank = ranks.totalPoints[uid] ?? null;
      const prevRank = prevPointsRanks[uid] ?? null;
      const rank =
        pointsRank ??
        (participantCount > 0 ? participantCount : rows.length);
      const rankDeltaPlaces =
        prevRank != null && pointsRank != null ? prevRank - pointsRank : null;
      const topPercent =
        participantCount > 0 && pointsRank != null
          ? (pointsRank / participantCount) * 100
          : null;

      const prevAgg = prevAggByUid.get(uid) ?? null;
      const prevPosts = prevAgg != null ? prevAgg.posts : null;
      const prevWinRatePct =
        prevAgg != null && prevAgg.posts > 0
          ? (prevAgg.wins / prevAgg.posts) * 100
          : null;
      const prevPoints = prevAgg != null ? prevAgg.points : null;
      const prevScorer = prevAgg != null ? prevAgg.scorer : null;
      const prevUpset = prevAgg != null ? prevAgg.upset : null;

      const metrics = [
        metricRow(
          "posts",
          agg.posts,
          prevPosts,
          median(postsArr),
          top10Mean(postsArr),
          null
        ),
        metricRow(
          "winRate",
          winRate * 100,
          prevWinRatePct,
          median(winRates) * 100,
          top10Mean(winRates) * 100,
          null
        ),
        metricRow("units", 0, null, null, null, null),
        metricRow(
          "points",
          agg.points,
          prevPoints,
          median(pointsArr),
          top10Mean(pointsArr),
          ranks.totalPoints[uid] ?? null
        ),
        metricRow(
          "goalScorerHits",
          agg.scorer,
          prevScorer,
          scorerMedian,
          top10Mean(scorers),
          ranks.totalGoalScorerHits[uid] ?? null
        ),
        metricRow(
          "upsetPoints",
          agg.upset,
          prevUpset,
          upsetMedian,
          top10Mean(upsets),
          ranks.totalUpset[uid] ?? null
        ),
      ];

      const teamMap = teamAffinityByUid.get(uid);
      const teamAffinity = teamMap
        ? buildMonthlyTeamAffinity([...teamMap.values()])
        : { strong: [], weak: [] };

      const habitsRaw = habitsRawByUid.get(uid);
      const habits = habitsRaw
        ? buildMonthlyHabits({
            ...habitsRaw,
            winRate,
          })
        : null;

      const highlights = buildMonthlyHighlights(
        highlightEventsByUid.get(uid) ?? [],
        {
          winRate: ranks.winRate[uid] ?? null,
          goalScorerHits: ranks.totalGoalScorerHits[uid] ?? null,
          upset: ranks.totalUpset[uid] ?? null,
        }
      );

      const outlook = buildMonthlyOutlookSummary({
        sampleEligible,
        strengths,
        radar,
        facts: {
          winRate,
          posts: agg.posts,
          scorerHits: agg.scorer,
          upsetPoints: agg.upset,
          activityRate,
          prevDelta: {
            win:
              prevWinRatePct != null
                ? winRate * 100 - prevWinRatePct
                : null,
            scorer:
              prevScorer != null ? agg.scorer - prevScorer : null,
            upset: prevUpset != null ? agg.upset - prevUpset : null,
            points:
              prevPoints != null ? agg.points - prevPoints : null,
          },
        },
      });

      const reportDoc = {
        uid,
        league: "nba",
        monthKey,
        status: "final",
        sampleEligible,
        strengths,
        participantCount: participantCount || rows.length,
        rank,
        prevRank,
        rankDeltaPlaces,
        topPercent,
        totalPoints: agg.points,
        totalPosts: agg.posts,
        totalWins: agg.wins,
        unitsEarned: 0,
        unitsEarnedRank: null,
        analysisTypeId,
        metrics,
        radar,
        habits,
        unitsBreakdown: [],
        teamAffinity,
        highlights,
        outlook,
        pickupGameCount,
        builtAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      const ref = db().collection("user_reports").doc(`${uid}_monthly_${monthKey}`);
      batch.set(ref, reportDoc, { merge: true });
      written++;
    }

    await batch.commit();
  }

  return { monthKey, written };
}
