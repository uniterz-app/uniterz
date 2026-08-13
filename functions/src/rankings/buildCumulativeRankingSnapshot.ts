// functions/src/rankings/buildCumulativeRankingSnapshot.ts
// NBA シーズンキー付きスライス（rankingBySeason.<key>）から s<key>_<metric> doc を日次で作る。

import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { safeRankMetricNum } from "./safeRankMetricNum";
import {
  isActiveWinStreakRankingEligible,
  loadAuthorUidsSettledToday,
} from "./activeWinStreakRanking";
import { loadUidsWhoPredictedOnDateFromDaily } from "../notifications/loadUidsWhoPredictedOnDateFromDaily";
import {
  cumulativeStatsDocsToMap,
  loadCumulativeStatsForRankingSnapshot,
} from "./cumulativeSnapshotIndex";
import {
  CURRENT_NBA_SEASON_KEY,
  nbaSeasonOpenSnapshotDocId,
  nbaSeasonSnapshotDocId,
} from "./nbaSeason";
import { mergeProfileChartsOnRankSnapshot } from "../profile/mergeProfileCharts";
import { buildProfileHeroSnapshotFromCumulative } from "../profile/profileHeroSnapshot";

/* =========================================================
 * Firestore
 * =======================================================*/
function db() {
  return getFirestore();
}

type Metric =
  | "winRate"
  | "totalPoints"
  | "totalPrecision"
  | "totalExactHits"
  | "totalUpset"
  | "activeWinStreak"
  | "totalGoalScorerHits";

const MIN_POSTS_FOR_WIN_RATE_BASE = 1;

/** NBA シーズン勝率ランキングの最低投稿数（Next の minPostsForWinRate と同期） */
export const NBA_SEASON_WIN_RATE_MIN_POSTS = 20;

function filterRowsForMetricEligibility(
  baseRows: BaseRow[],
  metric: Metric,
  opts: {
    postedTodayUids?: Set<string>;
    /** 手動スナップショット: 当日確定フィルタなし（連勝>0 のみ） */
    streakAllEligible?: boolean;
  }
): BaseRow[] {
  if (metric === "winRate") {
    return baseRows.filter(
      (row) =>
        (row.totalPosts ?? 0) >=
        Math.max(NBA_SEASON_WIN_RATE_MIN_POSTS, MIN_POSTS_FOR_WIN_RATE_BASE)
    );
  }
  if (metric === "activeWinStreak") {
    if (opts.streakAllEligible) {
      return baseRows.filter((row) => (row.activeWinStreak ?? 0) > 0);
    }
    if (opts.postedTodayUids) {
      // JST 16:00 スナップショット: 当日確定投稿者かつ連勝>0 のみ
      return baseRows.filter((row) =>
        isActiveWinStreakRankingEligible(
          row.uid,
          row.activeWinStreak ?? 0,
          opts.postedTodayUids!
        )
      );
    }
  }
  return baseRows;
}

const METRICS: Metric[] = [
  "totalPoints",
  "winRate",
  "totalUpset",
  "totalGoalScorerHits",
];

/** Client: list cumulative_stats/{uid}/rankSnapshotHistory ordered by dateKey. */
export const RANK_SNAPSHOT_HISTORY_SUBCOL = "rankSnapshotHistory";

function toDateKeyJST(d: Date) {
  const j = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const y = j.getUTCFullYear();
  const m = String(j.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(j.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function getTodayJST(now: Date = new Date()) {
  return toDateKeyJST(now);
}

/** JST の「昨日」の dateKey（履歴 doc id と一致） */
export function getYesterdayDateKeyJST(now: Date = new Date()): string {
  const todayKey = getTodayJST(now);
  const [y, m, d] = todayKey.split("-").map(Number);
  const prev = new Date(Date.UTC(y, m - 1, d - 1));
  const yy = prev.getUTCFullYear();
  const mm = String(prev.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(prev.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

/** Step a JST calendar dateKey (YYYY-MM-DD) back one day (rankSnapshotHistory doc id). */
export function subtractOneDayFromDateKeyJST(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const prev = new Date(Date.UTC(y, m - 1, d - 1));
  const yy = prev.getUTCFullYear();
  const mm = String(prev.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(prev.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

/** Max days to walk back when yesterday's per-user rank snapshot doc is missing. */
export const RANK_DELTA_PRIOR_MAX_LOOKBACK_DAYS = 30;

/* =========================================================
 * Utils
 * =======================================================*/

type RankingSliceTotals = {
  totalPosts: number;
  totalWins: number;
  winRate: number;
  totalPoints: number;
  totalPrecision: number;
  totalUpset: number;
  totalGoalScorerHits: number;
};

const EMPTY_SLICE: RankingSliceTotals = {
  totalPosts: 0,
  totalWins: 0,
  winRate: 0,
  totalPoints: 0,
  totalPrecision: 0,
  totalUpset: 0,
  totalGoalScorerHits: 0,
};

function sliceFromBucket(
  rr: Record<string, unknown> | undefined | null
): RankingSliceTotals {
  if (!rr || typeof rr !== "object") return { ...EMPTY_SLICE };
  const tp = Number(rr.totalPosts ?? 0);
  const tw = Number(rr.totalWins ?? 0);
  return {
    totalPosts: tp,
    totalWins: tw,
    winRate: tp > 0 ? tw / tp : Number(rr.winRate ?? 0),
    totalPoints: Number(rr.totalPoints ?? 0),
    totalPrecision: Number(rr.totalPrecision ?? 0),
    totalUpset: Number(rr.totalUpset ?? 0),
    totalGoalScorerHits: safeRankMetricNum(rr.totalGoalScorerHits),
  };
}

/** NBA 現行シーズンのスライス（rankingBySeason.<CURRENT_NBA_SEASON_KEY>） */
export function nbaSeasonRankingSlice(
  d: Record<string, unknown>,
  seasonKey: string = CURRENT_NBA_SEASON_KEY
): RankingSliceTotals {
  const bySeason = d.rankingBySeason as
    | Record<string, Record<string, unknown>>
    | undefined;
  return sliceFromBucket(bySeason?.[seasonKey]);
}

/** PRO LEAGUE 用。openRankingBySeason 優先、未移行は rankingBySeason にフォールバック */
export function nbaOpenSeasonRankingSlice(
  d: Record<string, unknown>,
  seasonKey: string = CURRENT_NBA_SEASON_KEY
): RankingSliceTotals {
  const openBySeason = d.openRankingBySeason as
    | Record<string, Record<string, unknown>>
    | undefined;
  const open = sliceFromBucket(openBySeason?.[seasonKey]);
  if ((open.totalPosts ?? 0) > 0) return open;
  return nbaSeasonRankingSlice(d, seasonKey);
}

function activeBasketballStreak(d: any): number {
  const signed =
    d.activeWinStreakBasketball ??
    d.streakBySport?.basketball ??
    d.currentStreak ??
    d.activeWinStreak ??
    0;
  return typeof signed === "number" && signed > 0 ? signed : 0;
}

type BaseRow = {
  uid: string;
  displayName: string;
  handle: string | null;
  photoURL: string | null;
  countryCode?: string | null;
  plan: "free" | "pro";
  totalPosts: number;
  totalWins: number;
  winRate: number;
  totalPoints: number;
  totalPrecision: number;
  totalUpset: number;
  totalGoalScorerHits: number;
  activeWinStreak: number;
};

function getRowMetricValue(row: BaseRow, metric: Metric): number {
  if (metric === "activeWinStreak") return safeRankMetricNum(row.activeWinStreak);
  if (metric === "winRate") return safeRankMetricNum(row.winRate);
  if (metric === "totalPoints") return safeRankMetricNum(row.totalPoints);
  if (metric === "totalExactHits") return safeRankMetricNum(row.totalPrecision);
  if (metric === "totalPrecision") return safeRankMetricNum(row.totalPrecision);
  if (metric === "totalGoalScorerHits")
    return safeRankMetricNum(row.totalGoalScorerHits);
  return safeRankMetricNum(row.totalUpset);
}

/** Same ordering as snapshot sort (desc). Returns 0 when tied for rank. */
function cmpSortRows(a: BaseRow, b: BaseRow, metric: Metric): number {
  const diff = getRowMetricValue(b, metric) - getRowMetricValue(a, metric);
  if (diff !== 0) return diff;
  if (metric === "winRate") {
    const postsDiff = (b.totalPosts ?? 0) - (a.totalPosts ?? 0);
    if (postsDiff !== 0) return postsDiff;
  }
  return safeRankMetricNum(b.totalPoints) - safeRankMetricNum(a.totalPoints);
}

/** Matches getCumulativeRanking: rank = 1 + #{ strictly better values }. */
function assignCompetitionRanks(
  sorted: BaseRow[],
  metric: Metric
): Map<string, number> {
  const out = new Map<string, number>();
  let rank = 1;
  for (let i = 0; i < sorted.length; i++) {
    if (
      i > 0 &&
      cmpSortRows(sorted[i - 1]!, sorted[i]!, metric) !== 0
    ) {
      rank = i + 1;
    }
    out.set(sorted[i]!.uid, rank);
  }
  return out;
}

type PhaseRankMap = Partial<Record<Metric, number>>;

type PriorRankBlock = {
  seasons: Partial<Record<string, PhaseRankMap>>;
};

type SnapshotRow = BaseRow & {
  rank: number;
  rankDeltaPlaces: number | null;
  metricValueDelta?: number | null;
};

type SnapshotMetricValues = {
  totalPoints: number;
  totalPrecision: number;
  totalUpset: number;
  winRate: number;
  exactHitCount: number;
  upsetBonusSum: number;
  streakBonusSum: number;
  goalScorerBonusSum: number;
};

type HistoryMetricValuesBlock = {
  seasons: Partial<Record<string, SnapshotMetricValues>>;
};

function toSnapshotMetricValues(r: {
  totalPosts?: number;
  totalWins?: number;
  winRate?: number;
  totalPoints?: number;
  totalPrecision?: number;
  totalUpset?: number;
  exactHitCount?: number;
  upsetBonusSum?: number;
  streakBonusSum?: number;
  goalScorerBonusSum?: number;
}): SnapshotMetricValues {
  const tp = r.totalPosts ?? 0;
  const tw = r.totalWins ?? 0;
  return {
    totalPoints: r.totalPoints ?? 0,
    totalPrecision: r.totalPrecision ?? 0,
    totalUpset: r.totalUpset ?? 0,
    winRate: tp > 0 ? tw / tp : (r.winRate ?? 0),
    exactHitCount: r.exactHitCount ?? r.totalPrecision ?? 0,
    upsetBonusSum: r.upsetBonusSum ?? r.totalUpset ?? 0,
    streakBonusSum: r.streakBonusSum ?? 0,
    goalScorerBonusSum: r.goalScorerBonusSum ?? 0,
  };
}

function buildMetricValuesBlock(d: Record<string, unknown>): HistoryMetricValuesBlock {
  const seasons: Partial<Record<string, SnapshotMetricValues>> = {};
  const bySeason = (d.rankingBySeason ?? {}) as Record<
    string,
    Record<string, unknown>
  >;
  for (const [seasonKey, bucket] of Object.entries(bySeason)) {
    const slice = sliceFromBucket(bucket);
    if (slice.totalPosts > 0) {
      seasons[seasonKey] = toSnapshotMetricValues(slice);
    }
  }

  return { seasons };
}

function computeRankDeltaPlaces(
  prevRank: number | null,
  currentRank: number
): number | null {
  if (prevRank == null || currentRank < 1) return null;
  const d = prevRank - currentRank;
  if (d === 0) return null;
  return d;
}

function pickPriorMetricValues(
  block: HistoryMetricValuesBlock | null | undefined,
  opts: { kind: "season"; seasonKey: string }
): SnapshotMetricValues | null {
  if (!block) return null;
  return block.seasons?.[opts.seasonKey] ?? null;
}

function metricValueFromRow(row: BaseRow, metric: Metric): number | null {
  if (metric === "activeWinStreak") return row.activeWinStreak ?? 0;
  if (metric === "totalGoalScorerHits") return row.totalGoalScorerHits ?? 0;
  if (metric === "winRate") return row.winRate ?? 0;
  if (metric === "totalPoints") return row.totalPoints ?? 0;
  if (metric === "totalExactHits") return row.totalPrecision ?? 0;
  if (metric === "totalPrecision") return row.totalPrecision ?? 0;
  return row.totalUpset ?? 0;
}

function metricValueFromSnapshot(
  values: SnapshotMetricValues,
  metric: Metric
): number | null {
  if (metric === "activeWinStreak" || metric === "totalGoalScorerHits") {
    return null;
  }
  if (metric === "winRate") return values.winRate ?? 0;
  if (metric === "totalPoints") return values.totalPoints ?? 0;
  if (metric === "totalExactHits" || metric === "totalPrecision") {
    return values.totalPrecision ?? 0;
  }
  return values.totalUpset ?? 0;
}

function computeMetricValueDelta(
  row: BaseRow,
  metric: Metric,
  prior: SnapshotMetricValues | null
): number | null {
  if (!prior) return null;
  const curRaw = metricValueFromRow(row, metric);
  const prevRaw = metricValueFromSnapshot(prior, metric);
  if (curRaw == null || prevRaw == null) return null;

  if (metric === "winRate") {
    const curPct = curRaw <= 1 ? curRaw * 100 : curRaw;
    const prevPct = prevRaw <= 1 ? prevRaw * 100 : prevRaw;
    const d = curPct - prevPct;
    if (!Number.isFinite(d) || Math.abs(d) < 1e-9) return null;
    return d;
  }

  const d = curRaw - prevRaw;
  if (!Number.isFinite(d) || Math.abs(d) < 1e-9) return null;
  return d;
}

/**
 * For each uid, use the first existing rankSnapshotHistory doc when walking back
 * from startKey (usually yesterday) up to maxLookbackDays days.
 */
async function fetchLatestPriorRankMapsForUids(
  uids: string[],
  startKey: string,
  maxLookbackDays: number
): Promise<Map<string, PriorRankBlock | null>> {
  const out = new Map<string, PriorRankBlock | null>();
  if (uids.length === 0) return out;

  const pending = new Set(uids);
  let key = startKey;
  const firestore = db();
  const CHUNK = 200;

  for (let day = 0; day < maxLookbackDays && pending.size > 0; day++) {
    const chunkList = [...pending];
    for (let i = 0; i < chunkList.length; i += CHUNK) {
      const chunk = chunkList.slice(i, i + CHUNK);
      const refs = chunk.map((uid) =>
        firestore
          .collection("cumulative_stats")
          .doc(uid)
          .collection(RANK_SNAPSHOT_HISTORY_SUBCOL)
          .doc(key)
      );
      const snaps = await firestore.getAll(...refs);
      snaps.forEach((s, j) => {
        const uid = chunk[j]!;
        if (!pending.has(uid)) return;
        if (s.exists) {
          const d = s.data() as {
            seasons?: Partial<Record<string, PhaseRankMap>>;
          };
          out.set(uid, {
            seasons: (d?.seasons ?? {}) as Partial<
              Record<string, PhaseRankMap>
            >,
          });
          pending.delete(uid);
        }
      });
    }
    key = subtractOneDayFromDateKeyJST(key);
  }

  for (const uid of pending) {
    out.set(uid, null);
  }
  return out;
}

async function fetchLatestPriorMetricValuesForUids(
  uids: string[],
  startKey: string,
  maxLookbackDays: number
): Promise<Map<string, HistoryMetricValuesBlock | null>> {
  const out = new Map<string, HistoryMetricValuesBlock | null>();
  if (uids.length === 0) return out;

  const pending = new Set(uids);
  let key = startKey;
  const firestore = db();
  const CHUNK = 200;

  for (let day = 0; day < maxLookbackDays && pending.size > 0; day++) {
    const chunkList = [...pending];
    for (let i = 0; i < chunkList.length; i += CHUNK) {
      const chunk = chunkList.slice(i, i + CHUNK);
      const refs = chunk.map((uid) =>
        firestore
          .collection("cumulative_stats")
          .doc(uid)
          .collection(RANK_SNAPSHOT_HISTORY_SUBCOL)
          .doc(key)
      );
      const snaps = await firestore.getAll(...refs);
      snaps.forEach((s, j) => {
        const uid = chunk[j]!;
        if (!pending.has(uid)) return;
        if (s.exists) {
          const d = s.data() as { metricValues?: HistoryMetricValuesBlock };
          if (d?.metricValues) {
            out.set(uid, d.metricValues);
            pending.delete(uid);
          }
        }
      });
    }
    key = subtractOneDayFromDateKeyJST(key);
  }

  for (const uid of pending) {
    out.set(uid, null);
  }
  return out;
}

/**
 * 日次スナップショット doc が無い/空のとき、getCumulativeRanking が一覧を出せるよう
 * cumulative_stats からその場で Top20 を算出する。
 */
export type LiveTop20Payload = {
  rows: SnapshotRow[];
  /** 指標の対象参加者数（Top20 ではない） */
  totalCount: number;
  /** 全参加者の順位（Top20 外 uid の myRank 用） */
  rankByUid: Map<string, number>;
};

/** NBA 現行シーズンの live フォールバック */
export async function loadNbaSeasonTop20RowsLive(
  metric: Metric,
  postedTodayUids?: Set<string>
): Promise<LiveTop20Payload> {
  const snap = await db().collection("cumulative_stats").get();
  const baseRows: BaseRow[] = snap.docs
    .map((doc) => {
      const d = doc.data();
      const r = nbaSeasonRankingSlice(d);
      return {
        uid: doc.id,
        displayName: d.displayName ?? "user",
        handle: d.handle ?? null,
        photoURL: d.photoURL ?? null,
        countryCode: d.countryCode ?? null,
        plan: (d.plan === "pro" ? "pro" : "free") as BaseRow["plan"],
        totalPosts: r.totalPosts,
        totalWins: r.totalWins,
        winRate: r.winRate,
        totalPoints: r.totalPoints,
        totalPrecision: r.totalPrecision,
        totalUpset: r.totalUpset,
        totalGoalScorerHits: r.totalGoalScorerHits,
        activeWinStreak: activeBasketballStreak(d),
      };
    })
    .filter((row) => (row.totalPosts ?? 0) > 0);

  const eligibleRows = filterRowsForMetricEligibility(baseRows, metric, {
    postedTodayUids: postedTodayUids,
  });
  const sortedFull = [...eligibleRows].sort((a, b) =>
    cmpSortRows(a, b, metric)
  );
  const ranks = assignCompetitionRanks(sortedFull, metric);
  return {
    totalCount: sortedFull.length,
    rankByUid: ranks,
    rows: sortedFull.slice(0, 20).map((row) => ({
      ...row,
      rank: ranks.get(row.uid) ?? 0,
      rankDeltaPlaces: null,
    })),
  };
}

/* =========================================================
 * Main
 * =======================================================*/
export type BuildCumulativeRankingSnapshotOptions = {
  /**
   * 手動実行向け: 連勝ランキングは「当日確定」条件を外し、連勝>0 のみで Top20 を作る。
   * 本番 Cron では指定しないこと。
   */
  streakAllEligible?: boolean;
};

export async function buildCumulativeRankingSnapshot(
  options: BuildCumulativeRankingSnapshotOptions = {}
) {
  const streakAllEligible = options.streakAllEligible === true;
  const seasonKey = CURRENT_NBA_SEASON_KEY;

  const snap = await loadCumulativeStatsForRankingSnapshot(db());
  const statsByUid = cumulativeStatsDocsToMap(snap);

  const nbaSettledTodayUids = await loadAuthorUidsSettledToday("nba");

  /** uid → 現行シーズンの指標別順位 */
  const rankByUidSeason = new Map<string, PhaseRankMap>();

  function ensureSeason(uid: string) {
    if (!rankByUidSeason.has(uid)) {
      rankByUidSeason.set(uid, {});
    }
    return rankByUidSeason.get(uid)!;
  }

  type Top20Job = {
    metric: Metric;
    rows: Array<BaseRow & { rank: number }>;
    totalCount: number;
  };
  const seasonTop20Jobs: Top20Job[] = [];
  const topUidSet = new Set<string>();

  const baseRows: BaseRow[] = snap.docs
    .map((doc) => {
      const d = doc.data();
      const r = nbaSeasonRankingSlice(d, seasonKey);

      return {
        uid: doc.id,
        displayName: d.displayName ?? "user",
        handle: d.handle ?? null,
        photoURL: d.photoURL ?? null,
        countryCode: d.countryCode ?? null,
        plan: (d.plan === "pro" ? "pro" : "free") as BaseRow["plan"],

        totalPosts: r.totalPosts,
        totalWins: r.totalWins,
        winRate: r.winRate,

        totalPoints: r.totalPoints,
        totalPrecision: r.totalPrecision,
        totalUpset: r.totalUpset,
        totalGoalScorerHits: r.totalGoalScorerHits,
        activeWinStreak: activeBasketballStreak(d),
      };
    })
    .filter((row) => (row.totalPosts ?? 0) > 0);

  const openSeasonBaseRows: BaseRow[] = snap.docs
    .map((doc) => {
      const d = doc.data();
      const r = nbaOpenSeasonRankingSlice(d, seasonKey);
      return {
        uid: doc.id,
        displayName: d.displayName ?? "user",
        handle: d.handle ?? null,
        photoURL: d.photoURL ?? null,
        countryCode: d.countryCode ?? null,
        plan: (d.plan === "pro" ? "pro" : "free") as BaseRow["plan"],
        totalPosts: r.totalPosts,
        totalWins: r.totalWins,
        winRate: r.winRate,
        totalPoints: r.totalPoints,
        totalPrecision: r.totalPrecision,
        totalUpset: r.totalUpset,
        totalGoalScorerHits: r.totalGoalScorerHits,
        activeWinStreak: activeBasketballStreak(d),
      };
    })
    .filter((row) => (row.totalPosts ?? 0) > 0)
    .filter((row) => row.plan === "pro");

  const baseRowsForOpenSeason = openSeasonBaseRows;

  for (const metric of METRICS) {
    const eligibleRows = filterRowsForMetricEligibility(baseRows, metric, {
      postedTodayUids:
        metric === "activeWinStreak" && !streakAllEligible
          ? nbaSettledTodayUids
          : undefined,
      streakAllEligible:
        metric === "activeWinStreak" ? streakAllEligible : undefined,
    });
    const sortedFull = [...eligibleRows].sort((a, b) =>
      cmpSortRows(a, b, metric)
    );
    const ranks = assignCompetitionRanks(sortedFull, metric);

    for (const [uid, rank] of ranks) {
      ensureSeason(uid)[metric] = rank;
    }

    const top20 = sortedFull.slice(0, 20).map((row) => ({
      ...row,
      rank: ranks.get(row.uid) ?? 0,
    }));
    for (const r of top20) {
      topUidSet.add(r.uid);
    }
    seasonTop20Jobs.push({
      metric,
      rows: top20,
      totalCount: sortedFull.length,
    });
  }

  const yesterdayKey = getYesterdayDateKeyJST();
  const topUids = [...topUidSet];
  const [prevByUid, priorMetricByUid] = await Promise.all([
    fetchLatestPriorRankMapsForUids(
      topUids,
      yesterdayKey,
      RANK_DELTA_PRIOR_MAX_LOOKBACK_DAYS
    ),
    fetchLatestPriorMetricValuesForUids(
      topUids,
      yesterdayKey,
      RANK_DELTA_PRIOR_MAX_LOOKBACK_DAYS
    ),
  ]);

  for (const { metric, rows, totalCount } of seasonTop20Jobs) {
      const enriched: SnapshotRow[] = rows.map((row) => {
        const prevBlock = prevByUid.get(row.uid);
        const prevRaw = prevBlock?.seasons?.[seasonKey]?.[metric];
        const prevRank =
          typeof prevRaw === "number" &&
          Number.isFinite(prevRaw) &&
          prevRaw >= 1
            ? Math.floor(prevRaw)
            : null;
        const priorMetrics = pickPriorMetricValues(
          priorMetricByUid.get(row.uid),
          { kind: "season", seasonKey }
        );
        return {
          ...row,
          rankDeltaPlaces: computeRankDeltaPlaces(prevRank, row.rank),
          metricValueDelta: computeMetricValueDelta(row, metric, priorMetrics),
        };
      });

      await db()
        .collection("cumulative_ranking_snapshots")
        .doc(nbaSeasonSnapshotDocId(seasonKey, metric))
        .set(
          {
            kind: "nbaSeason",
            seasonKey,
            metric,
            rows: enriched,
            totalCount,
            updatedAt: FieldValue.serverTimestamp(),
            rankDeltaBasisDateKey: yesterdayKey,
          },
          { merge: true }
        );
  }

  // 無差別級（Pro のみ）シーズンスナップショット
  const openBaseRows = baseRowsForOpenSeason;
  for (const metric of METRICS) {
    const eligibleRows = filterRowsForMetricEligibility(openBaseRows, metric, {
      postedTodayUids:
        metric === "activeWinStreak" && !streakAllEligible
          ? nbaSettledTodayUids
          : undefined,
      streakAllEligible:
        metric === "activeWinStreak" ? streakAllEligible : undefined,
    });
    const sortedFull = [...eligibleRows].sort((a, b) =>
      cmpSortRows(a, b, metric)
    );
    const ranksMap = assignCompetitionRanks(sortedFull, metric);
    const ranks: Record<string, number> = {};
    for (const [uid, rank] of ranksMap) ranks[uid] = rank;

    const top20 = sortedFull.slice(0, 20).map((row) => ({
      ...row,
      rank: ranksMap.get(row.uid) ?? 0,
      rankDeltaPlaces: null as number | null,
      metricValueDelta: null as number | null,
    }));

    await db()
      .collection("cumulative_ranking_snapshots")
      .doc(nbaSeasonOpenSnapshotDocId(seasonKey, metric))
      .set(
        {
          kind: "nbaSeasonOpen",
          division: "open",
          seasonKey,
          metric,
          rows: top20,
          ranks,
          totalCount: sortedFull.length,
          updatedAt: FieldValue.serverTimestamp(),
          rankDeltaBasisDateKey: yesterdayKey,
        },
        { merge: true }
      );
  }

  const firestore = db();
  const dateKey = getTodayJST();
  let batch = firestore.batch();
  let ops = 0;

  const flush = async () => {
    if (ops > 0) {
      await batch.commit();
      batch = firestore.batch();
      ops = 0;
    }
  };

  const historyUids = new Set<string>(rankByUidSeason.keys());
  const metricValuesByUid = new Map<string, HistoryMetricValuesBlock>();
  for (const uid of historyUids) {
    const docData = statsByUid.get(uid);
    if (docData) {
      metricValuesByUid.set(uid, buildMetricValuesBlock(docData));
    }
  }

  for (const uid of historyUids) {
    const seasonRanks = rankByUidSeason.get(uid) ?? {};
    const totalPointsRank = Number(seasonRanks.totalPoints ?? 0);
    const cumData = statsByUid.get(uid) as Record<string, unknown> | undefined;
    const profileChartsPatch =
      Number.isFinite(totalPointsRank) && totalPointsRank > 0
        ? (() => {
            const charts = mergeProfileChartsOnRankSnapshot({
              cumulative: cumData ?? null,
              seasonKey,
              dateKey,
              totalPointsRank,
            });
            return {
              "profileCharts.v": charts.v,
              "profileCharts.seasonKey": charts.seasonKey,
              "profileCharts.dailyTrend": charts.dailyTrend ?? [],
              "profileCharts.rankTrend": charts.rankTrend,
              "profileCharts.last20": charts.last20 ?? [],
              "profileCharts.builtAtMs": Date.now(),
            };
          })()
        : {};
    batch.set(
      firestore.doc(`cumulative_stats/${uid}`),
      {
        "snapshotRanks.updatedAt": FieldValue.serverTimestamp(),
        [`snapshotRanks.seasons.${seasonKey}`]: seasonRanks,
        ...profileChartsPatch,
      },
      { merge: true }
    );
    if (profileChartsPatch && Object.keys(profileChartsPatch).length > 0) {
      batch.set(
        firestore
          .collection("cumulative_stats")
          .doc(uid)
          .collection("profileCharts")
          .doc(seasonKey),
        {
          v: profileChartsPatch["profileCharts.v"],
          seasonKey: profileChartsPatch["profileCharts.seasonKey"],
          dailyTrend: profileChartsPatch["profileCharts.dailyTrend"] ?? [],
          rankTrend: profileChartsPatch["profileCharts.rankTrend"] ?? [],
          last20: profileChartsPatch["profileCharts.last20"] ?? [],
          builtAtMs: profileChartsPatch["profileCharts.builtAtMs"] ?? Date.now(),
        },
        { merge: true }
      );
      ops += 1;
    }
    if (cumData) {
      const hero = buildProfileHeroSnapshotFromCumulative(cumData, seasonKey);
      batch.set(
        firestore.doc(`users/${uid}`),
        { profileHeroSnapshot: hero },
        { merge: true }
      );
      ops += 1;
    }
    batch.set(
      firestore
        .collection("cumulative_stats")
        .doc(uid)
        .collection(RANK_SNAPSHOT_HISTORY_SUBCOL)
        .doc(dateKey),
      {
        dateKey,
        seasons: { [seasonKey]: seasonRanks },
        metricValues: metricValuesByUid.get(uid),
        writtenAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    ops += 2;
    if (ops >= 500) {
      await flush();
    }
  }
  await flush();

  const generationMs = Date.now();
  await db()
    .collection("cumulative_ranking_snapshots")
    .doc("_generation")
    .set(
      {
        updatedAt: FieldValue.serverTimestamp(),
        nba: {
          updatedAtMs: generationMs,
          rankDeltaBasisDateKey: yesterdayKey,
        },
      },
      { merge: true }
    );

  const todayPredictorUids = await loadUidsWhoPredictedOnDateFromDaily(dateKey);

  return {
    ok: true,
    seasonKey,
    metrics: METRICS.length,
    ranksWritten: rankByUidSeason.size,
    historyDateKey: dateKey,
    rankDeltaBasisDateKey: yesterdayKey,
    snapshotGenerationMs: generationMs,
    notifiedUids: todayPredictorUids,
  };
}
