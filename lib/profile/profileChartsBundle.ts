/**
 * プロフィール overview チャート用の denormalized バンドル。
 * cumulative_stats/{uid}.profileCharts に載せ、カードと同じ 1 read で出す。
 */
import type { ProfileDailyTrendRow } from "@/lib/profile/profileDailyTrendRow";
import { dailyTrendRowHasSeasonActivity } from "@/lib/profile/dailyTrendSeasonActivity";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";

export const PROFILE_CHARTS_BUNDLE_VERSION = 1 as const;
export const PROFILE_CHARTS_DAILY_MAX = 40;
export const PROFILE_CHARTS_RANK_MAX = 10;
export const PROFILE_CHARTS_LAST20_MAX = 20;

export type ProfileChartsRankPoint = {
  dateKey: string;
  rank: number;
};

export type ProfileChartsLast20Point = {
  postId: string;
  settledAtMs: number;
  isWin: boolean;
};

export type ProfileChartsBundle = {
  v: typeof PROFILE_CHARTS_BUNDLE_VERSION;
  seasonKey: string;
  /** null = 未書き込み（ensure / 従来パスへ） */
  dailyTrend: ProfileDailyTrendRow[] | null;
  rankTrend: ProfileChartsRankPoint[] | null;
  last20: ProfileChartsLast20Point[] | null;
};

/** overview 3 チャートが揃っているか（クライアントはこれなら追加 read 不要） */
export function isProfileChartsComplete(
  bundle: ProfileChartsBundle | null
): bundle is ProfileChartsBundle & {
  dailyTrend: ProfileDailyTrendRow[];
  rankTrend: ProfileChartsRankPoint[];
  last20: ProfileChartsLast20Point[];
} {
  return (
    bundle != null &&
    Array.isArray(bundle.dailyTrend) &&
    Array.isArray(bundle.rankTrend) &&
    Array.isArray(bundle.last20)
  );
}

/** 26-27 活動ゼロでも「揃っている」とみなせる空バンドル */
export function emptyProfileChartsBundle(
  seasonKey: string = CURRENT_NBA_SEASON_KEY
): ProfileChartsBundle & {
  dailyTrend: ProfileDailyTrendRow[];
  rankTrend: ProfileChartsRankPoint[];
  last20: ProfileChartsLast20Point[];
} {
  return {
    v: PROFILE_CHARTS_BUNDLE_VERSION,
    seasonKey,
    dailyTrend: [],
    rankTrend: [],
    last20: [],
  };
}

/** rankingBySeason.<key> に投稿があるか（ensure / 空ショートカット用） */
export function cumulativeHasNbaSeasonActivity(
  cumulative: Record<string, unknown> | null | undefined,
  seasonKey: string = CURRENT_NBA_SEASON_KEY
): boolean {
  if (!cumulative) return false;
  const bySeason = (cumulative.rankingBySeason ?? {}) as Record<
    string,
    Record<string, unknown>
  >;
  const bucket = bySeason[seasonKey];
  if (!bucket || typeof bucket !== "object") return false;
  const n = Number(bucket.totalPosts ?? bucket.posts ?? 0);
  return Number.isFinite(n) && n > 0;
}

function safeInt(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

function safeNum(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function parseDailyRow(raw: unknown): ProfileDailyTrendRow | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const date = typeof o.date === "string" ? o.date.trim() : "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const posts = safeInt(o.posts);
  const wins = safeInt(o.wins);
  const pointsV3 = safeNum(o.pointsV3);
  const upsetPoints = safeNum(o.upsetPoints);
  return {
    date,
    posts,
    wins,
    pointsV3,
    upsetPoints,
    winRate: posts > 0 ? wins / posts : safeNum(o.winRate),
    exactHitCount: safeInt(o.exactHitCount),
  };
}

function parseRankPoint(raw: unknown): ProfileChartsRankPoint | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const dateKey = typeof o.dateKey === "string" ? o.dateKey.trim() : "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return null;
  const rank = safeInt(o.rank);
  if (rank <= 0) return null;
  return { dateKey, rank };
}

function parseLast20(raw: unknown): ProfileChartsLast20Point | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const postId = typeof o.postId === "string" ? o.postId.trim() : "";
  if (!postId) return null;
  const settledAtMs = safeNum(o.settledAtMs);
  if (!Number.isFinite(settledAtMs) || settledAtMs <= 0) return null;
  if (typeof o.isWin !== "boolean") return null;
  return { postId, settledAtMs, isWin: o.isWin };
}

/**
 * cumulative_stats.profileCharts を読む。
 * seasonKey 不一致・壊れた doc は null（従来フェッチへ）。
 */
export function parseProfileChartsBundle(
  cumulative: Record<string, unknown> | null | undefined,
  seasonKey: string = CURRENT_NBA_SEASON_KEY
): ProfileChartsBundle | null {
  if (!cumulative || typeof cumulative !== "object") return null;
  const raw = cumulative.profileCharts;
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.v !== PROFILE_CHARTS_BUNDLE_VERSION) return null;
  const sk = typeof o.seasonKey === "string" ? o.seasonKey : "";
  if (sk !== seasonKey) return null;

  const dailyTrend = Array.isArray(o.dailyTrend)
    ? o.dailyTrend
        .map(parseDailyRow)
        .filter((r): r is ProfileDailyTrendRow => r != null)
        .filter(dailyTrendRowHasSeasonActivity)
        .sort((a, b) => a.date.localeCompare(b.date))
    : null;

  const rankTrend = Array.isArray(o.rankTrend)
    ? o.rankTrend
        .map(parseRankPoint)
        .filter((r): r is ProfileChartsRankPoint => r != null)
        .sort((a, b) => a.dateKey.localeCompare(b.dateKey))
    : null;

  const last20 = Array.isArray(o.last20)
    ? o.last20
        .map(parseLast20)
        .filter((r): r is ProfileChartsLast20Point => r != null)
        .sort((a, b) => a.settledAtMs - b.settledAtMs)
    : null;

  return {
    v: PROFILE_CHARTS_BUNDLE_VERSION,
    seasonKey: sk,
    dailyTrend,
    rankTrend,
    last20,
  };
}

export function pruneDailyTrendRows(
  rows: ProfileDailyTrendRow[],
  max = PROFILE_CHARTS_DAILY_MAX
): ProfileDailyTrendRow[] {
  const filtered = rows
    .filter(dailyTrendRowHasSeasonActivity)
    .sort((a, b) => a.date.localeCompare(b.date));
  if (filtered.length <= max) return filtered;
  return filtered.slice(filtered.length - max);
}

export function upsertDailyTrendRow(
  rows: ProfileDailyTrendRow[],
  row: ProfileDailyTrendRow
): ProfileDailyTrendRow[] {
  const next = rows.filter((r) => r.date !== row.date);
  if (dailyTrendRowHasSeasonActivity(row)) next.push(row);
  return pruneDailyTrendRows(next);
}

export function appendRankTrendPoint(
  points: ProfileChartsRankPoint[],
  point: ProfileChartsRankPoint,
  max = PROFILE_CHARTS_RANK_MAX
): ProfileChartsRankPoint[] {
  const next = points.filter((p) => p.dateKey !== point.dateKey);
  next.push(point);
  next.sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  if (next.length <= max) return next;
  return next.slice(next.length - max);
}

/** 時系列昇順で最大 lastN 件を保つ（末尾が最新） */
export function appendLast20Point(
  points: ProfileChartsLast20Point[],
  point: ProfileChartsLast20Point,
  max = PROFILE_CHARTS_LAST20_MAX
): ProfileChartsLast20Point[] {
  const next = points.filter((p) => p.postId !== point.postId);
  next.push(point);
  next.sort((a, b) => a.settledAtMs - b.settledAtMs);
  if (next.length <= max) return next;
  return next.slice(next.length - max);
}
