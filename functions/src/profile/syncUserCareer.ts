/**
 * user_career/{uid} を settle / 期間確定 / GB / Unit / Skin から差分更新。
 * lib/profile/userCareer.ts と同じスキーマ（v1）。
 */
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import {
  normalizeNbaSeasonPhase,
  resolveNbaRankingBucketKeys,
} from "../rankings/nbaSeason";

const COLLECTION = "user_career";
const SCHEMA_V = 1;

function safeInt(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

function betterRank(a: unknown, b: unknown): number | null {
  const aa = safeInt(a);
  const bb = safeInt(b);
  const aOk = aa >= 1 ? aa : null;
  const bOk = bb >= 1 ? bb : null;
  if (aOk == null) return bOk;
  if (bOk == null) return aOk;
  return Math.min(aOk, bOk);
}

function maxStreak(a: unknown, b: unknown): number | null {
  const aa = safeInt(a);
  const bb = safeInt(b);
  const aOk = aa >= 1 ? aa : null;
  const bOk = bb >= 1 ? bb : null;
  if (aOk == null) return bOk;
  if (bOk == null) return aOk;
  return Math.max(aOk, bOk);
}

function winRatePct(posts: number, wins: number): number {
  if (posts <= 0) return 0;
  return Math.round((wins / posts) * 1000) / 10;
}

function emptyBoard() {
  return {
    predictions: 0,
    hits: 0,
    exactHits: 0,
    winRatePct: 0,
    maxWinStreak: null as number | null,
    bestWeeklyRank: null as number | null,
    bestMonthlyRank: null as number | null,
    weeklyTop10Count: 0,
    monthlyTop10Count: 0,
  };
}

function readBoard(raw: unknown) {
  if (!raw || typeof raw !== "object") return emptyBoard();
  const o = raw as Record<string, unknown>;
  const predictions = safeInt(o.predictions ?? o.posts);
  const hits = safeInt(o.hits ?? o.wins);
  return {
    predictions,
    hits,
    exactHits: safeInt(o.exactHits),
    winRatePct:
      typeof o.winRatePct === "number" && Number.isFinite(o.winRatePct)
        ? o.winRatePct
        : winRatePct(predictions, hits),
    maxWinStreak: safeInt(o.maxWinStreak) >= 1 ? safeInt(o.maxWinStreak) : null,
    bestWeeklyRank: safeInt(o.bestWeeklyRank) >= 1 ? safeInt(o.bestWeeklyRank) : null,
    bestMonthlyRank:
      safeInt(o.bestMonthlyRank) >= 1 ? safeInt(o.bestMonthlyRank) : null,
    weeklyTop10Count: safeInt(o.weeklyTop10Count),
    monthlyTop10Count: safeInt(o.monthlyTop10Count),
  };
}

function toStartDate(startAt: unknown): Date {
  if (
    startAt &&
    typeof (startAt as { toDate?: () => Date }).toDate === "function"
  ) {
    return (startAt as { toDate: () => Date }).toDate();
  }
  if (startAt instanceof Date) return startAt;
  return new Date();
}

/** settle 1 件を career に反映（doc が無ければ作成） */
export async function syncUserCareerOnNbaSettle(opts: {
  uid: string;
  startAt: unknown;
  league: unknown;
  countsForRanking: boolean;
  seasonPhase: unknown;
  isWin: boolean;
  exactHit: boolean;
  activeWinStreak: number;
  /** users 上の通算最高連勝（あれば active より正確） */
  maxWinStreak?: number;
}): Promise<void> {
  if (!opts.countsForRanking) return;
  const leagueKey = String(opts.league ?? "")
    .trim()
    .toLowerCase();
  if (leagueKey !== "nba") return;

  const phase = normalizeNbaSeasonPhase(opts.seasonPhase);
  const keys = resolveNbaRankingBucketKeys(
    "nba",
    true,
    toStartDate(opts.startAt),
    phase
  );
  const board: "regular" | "playoffs" =
    phase === "playoffs" ? "playoffs" : "regular";
  const seasonKey =
    board === "playoffs" ? keys.nbaPlayoffsSeasonKey : keys.nbaSeasonKey;
  if (!seasonKey) return;

  const db = getFirestore();
  const ref = db.collection(COLLECTION).doc(opts.uid);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = (snap.exists ? snap.data() : {}) as Record<string, unknown>;
    const summaryObj =
      data.summary && typeof data.summary === "object"
        ? ({ ...(data.summary as Record<string, unknown>) } as Record<
            string,
            unknown
          >)
        : ({} as Record<string, unknown>);

    const seasons =
      data.seasons && typeof data.seasons === "object"
        ? ({ ...(data.seasons as Record<string, unknown>) } as Record<
            string,
            unknown
          >)
        : ({} as Record<string, unknown>);
    const chapterRaw =
      seasons[seasonKey] && typeof seasons[seasonKey] === "object"
        ? ({ ...(seasons[seasonKey] as Record<string, unknown>) } as Record<
            string,
            unknown
          >)
        : ({ regular: emptyBoard(), playoffs: emptyBoard() } as Record<
            string,
            unknown
          >);
    const boardStats = readBoard(chapterRaw[board]);

    boardStats.predictions += 1;
    if (opts.isWin) boardStats.hits += 1;
    if (opts.exactHit) boardStats.exactHits += 1;
    boardStats.winRatePct = winRatePct(boardStats.predictions, boardStats.hits);
    const streakPeak =
      safeInt(opts.maxWinStreak) >= 1
        ? safeInt(opts.maxWinStreak)
        : opts.activeWinStreak;
    boardStats.maxWinStreak = maxStreak(boardStats.maxWinStreak, streakPeak);
    chapterRaw[board] = boardStats;
    if (!chapterRaw.regular) chapterRaw.regular = emptyBoard();
    if (!chapterRaw.playoffs) chapterRaw.playoffs = emptyBoard();
    seasons[seasonKey] = chapterRaw;

    const nextSummaryBoard = readBoard(summaryObj);
    nextSummaryBoard.predictions += 1;
    if (opts.isWin) nextSummaryBoard.hits += 1;
    if (opts.exactHit) nextSummaryBoard.exactHits += 1;
    nextSummaryBoard.winRatePct = winRatePct(
      nextSummaryBoard.predictions,
      nextSummaryBoard.hits
    );
    nextSummaryBoard.maxWinStreak = maxStreak(
      nextSummaryBoard.maxWinStreak,
      streakPeak
    );

    tx.set(
      ref,
      {
        v: SCHEMA_V,
        uid: opts.uid,
        summary: {
          ...summaryObj,
          ...nextSummaryBoard,
          sinceYear: summaryObj.sinceYear ?? null,
          unlockedSkinCount: safeInt(summaryObj.unlockedSkinCount),
          lifetimeUnitsEarned:
            summaryObj.lifetimeUnitsEarned == null
              ? null
              : safeInt(summaryObj.lifetimeUnitsEarned),
          bestGroupBattleRank:
            safeInt(summaryObj.bestGroupBattleRank) >= 1
              ? safeInt(summaryObj.bestGroupBattleRank)
              : null,
        },
        seasons,
        updatedAtMs: Date.now(),
        source: "settle",
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  });
}

/** 週/月 totalPoints 順位を career に冪等反映 */
export async function syncUserCareerPeriodRank(opts: {
  uid: string;
  period: "weekly" | "monthly";
  label: string;
  rank: number;
  seasonKey?: string | null;
}): Promise<void> {
  const rank = safeInt(opts.rank);
  if (rank < 1) return;
  const seenKey = opts.period === "weekly" ? `w:${opts.label}` : `m:${opts.label}`;
  const db = getFirestore();
  const ref = db.collection(COLLECTION).doc(opts.uid);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = (snap.exists ? snap.data() : {}) as Record<string, unknown>;
    const periodSeen =
      data.periodSeen && typeof data.periodSeen === "object"
        ? ({ ...(data.periodSeen as Record<string, unknown>) } as Record<
            string,
            unknown
          >)
        : ({} as Record<string, unknown>);

    const already = safeInt(periodSeen[seenKey]) >= 1;
    const summaryObj =
      data.summary && typeof data.summary === "object"
        ? ({ ...(data.summary as Record<string, unknown>) } as Record<
            string,
            unknown
          >)
        : ({} as Record<string, unknown>);
    const board = readBoard(summaryObj);

    if (opts.period === "weekly") {
      board.bestWeeklyRank = betterRank(board.bestWeeklyRank, rank);
      if (!already && rank <= 10) board.weeklyTop10Count += 1;
    } else {
      board.bestMonthlyRank = betterRank(board.bestMonthlyRank, rank);
      if (!already && rank <= 10) board.monthlyTop10Count += 1;
    }
    periodSeen[seenKey] = rank;

    const seasons =
      data.seasons && typeof data.seasons === "object"
        ? ({ ...(data.seasons as Record<string, unknown>) } as Record<
            string,
            unknown
          >)
        : ({} as Record<string, unknown>);
    const seasonKey = opts.seasonKey?.trim() || "";
    if (seasonKey) {
      const chapterRaw =
        seasons[seasonKey] && typeof seasons[seasonKey] === "object"
          ? ({ ...(seasons[seasonKey] as Record<string, unknown>) } as Record<
              string,
              unknown
            >)
          : ({ regular: emptyBoard(), playoffs: emptyBoard() } as Record<
              string,
              unknown
            >);
      const regular = readBoard(chapterRaw.regular);
      if (opts.period === "weekly") {
        regular.bestWeeklyRank = betterRank(regular.bestWeeklyRank, rank);
        if (!already && rank <= 10) regular.weeklyTop10Count += 1;
      } else {
        regular.bestMonthlyRank = betterRank(regular.bestMonthlyRank, rank);
        if (!already && rank <= 10) regular.monthlyTop10Count += 1;
      }
      chapterRaw.regular = regular;
      if (!chapterRaw.playoffs) chapterRaw.playoffs = emptyBoard();
      seasons[seasonKey] = chapterRaw;
    }

    tx.set(
      ref,
      {
        v: SCHEMA_V,
        uid: opts.uid,
        summary: {
          ...summaryObj,
          ...board,
        },
        seasons,
        periodSeen,
        updatedAtMs: Date.now(),
        source: "period",
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  });
}

export async function syncUserCareerGroupBattleRank(opts: {
  uid: string;
  battleId: string;
  period: "weekly" | "monthly";
  label: string;
  rank: number;
}): Promise<void> {
  const rank = safeInt(opts.rank);
  if (rank < 1) return;
  const seenKey = `gb:${opts.battleId}:${opts.period}:${opts.label}`;
  const db = getFirestore();
  const ref = db.collection(COLLECTION).doc(opts.uid);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = (snap.exists ? snap.data() : {}) as Record<string, unknown>;
    const groupBattleSeen =
      data.groupBattleSeen && typeof data.groupBattleSeen === "object"
        ? ({ ...(data.groupBattleSeen as Record<string, unknown>) } as Record<
            string,
            unknown
          >)
        : ({} as Record<string, unknown>);
    groupBattleSeen[seenKey] = rank;
    const summaryObj =
      data.summary && typeof data.summary === "object"
        ? ({ ...(data.summary as Record<string, unknown>) } as Record<
            string,
            unknown
          >)
        : ({} as Record<string, unknown>);
    summaryObj.bestGroupBattleRank = betterRank(
      summaryObj.bestGroupBattleRank,
      rank
    );
    tx.set(
      ref,
      {
        v: SCHEMA_V,
        uid: opts.uid,
        summary: summaryObj,
        groupBattleSeen,
        updatedAtMs: Date.now(),
        source: "group_battle",
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  });
}

export async function syncUserCareerUnitsEarned(
  uid: string,
  amount: number
): Promise<void> {
  const add = safeInt(amount);
  if (add <= 0) return;
  const db = getFirestore();
  const ref = db.collection(COLLECTION).doc(uid);
  await ref.set(
    {
      v: SCHEMA_V,
      uid,
      "summary.lifetimeUnitsEarned": FieldValue.increment(add),
      updatedAtMs: Date.now(),
      source: "units",
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

export async function syncUserCareerUnlockedSkinCount(
  uid: string,
  unlockedSkinCount: number
): Promise<void> {
  const n = safeInt(unlockedSkinCount);
  const db = getFirestore();
  const ref = db.collection(COLLECTION).doc(uid);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = (snap.exists ? snap.data() : {}) as Record<string, unknown>;
    const summaryObj =
      data.summary && typeof data.summary === "object"
        ? ({ ...(data.summary as Record<string, unknown>) } as Record<
            string,
            unknown
          >)
        : ({} as Record<string, unknown>);
    const prev = safeInt(summaryObj.unlockedSkinCount);
    if (n === prev) return;
    summaryObj.unlockedSkinCount = n;
    tx.set(
      ref,
      {
        v: SCHEMA_V,
        uid,
        summary: summaryObj,
        updatedAtMs: Date.now(),
        source: "skin",
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  });
}