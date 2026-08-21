/**
 * cumulative_stats.profileCharts の merge（Functions 側）。
 * クライアントの lib/profile/profileChartsBundle.ts とスキーマ同期。
 */
export const PROFILE_CHARTS_BUNDLE_VERSION = 1 as const;
export const PROFILE_CHARTS_DAILY_MAX = 40;
export const PROFILE_CHARTS_RANK_MAX = 10;
export const PROFILE_CHARTS_LAST20_MAX = 20;

export type ProfileChartsDailyRow = {
  date: string;
  posts: number;
  wins: number;
  pointsV3: number;
  upsetPoints: number;
  winRate: number;
  exactHitCount: number;
};

export type ProfileChartsRankPoint = {
  dateKey: string;
  rank: number;
};

export type ProfileChartsLast20Point = {
  postId: string;
  settledAtMs: number;
  isWin: boolean;
};

export type ProfileChartsStored = {
  v: typeof PROFILE_CHARTS_BUNDLE_VERSION;
  seasonKey: string;
  dailyTrend?: ProfileChartsDailyRow[];
  rankTrend?: ProfileChartsRankPoint[];
  last20?: ProfileChartsLast20Point[];
};

function num(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function hasActivity(row: ProfileChartsDailyRow): boolean {
  return (
    row.posts > 0 ||
    Math.abs(row.pointsV3) > 1e-9 ||
    Math.abs(row.upsetPoints) > 1e-9
  );
}

function readStored(
  cumulative: Record<string, unknown> | null | undefined,
  seasonKey: string,
  chartsDoc?: Record<string, unknown> | null
): ProfileChartsStored {
  const raw = chartsDoc ?? cumulative?.profileCharts;
  if (!raw || typeof raw !== "object") {
    return { v: PROFILE_CHARTS_BUNDLE_VERSION, seasonKey };
  }
  const o = raw as Record<string, unknown>;
  if (o.v !== PROFILE_CHARTS_BUNDLE_VERSION) {
    return { v: PROFILE_CHARTS_BUNDLE_VERSION, seasonKey };
  }
  const sk = typeof o.seasonKey === "string" ? o.seasonKey : "";
  if (sk !== seasonKey) {
    return { v: PROFILE_CHARTS_BUNDLE_VERSION, seasonKey };
  }
  return {
    v: PROFILE_CHARTS_BUNDLE_VERSION,
    seasonKey,
    dailyTrend: Array.isArray(o.dailyTrend)
      ? (o.dailyTrend as ProfileChartsDailyRow[])
      : undefined,
    rankTrend: Array.isArray(o.rankTrend)
      ? (o.rankTrend as ProfileChartsRankPoint[])
      : undefined,
    last20: Array.isArray(o.last20)
      ? (o.last20 as ProfileChartsLast20Point[])
      : undefined,
  };
}

function pruneDaily(rows: ProfileChartsDailyRow[]): ProfileChartsDailyRow[] {
  const filtered = rows.filter(hasActivity).sort((a, b) => a.date.localeCompare(b.date));
  if (filtered.length <= PROFILE_CHARTS_DAILY_MAX) return filtered;
  return filtered.slice(filtered.length - PROFILE_CHARTS_DAILY_MAX);
}

export function dailyRowFromSeasonBucket(
  dateKey: string,
  bucket: Record<string, unknown> | null | undefined
): ProfileChartsDailyRow {
  const posts = Math.max(0, Math.floor(num(bucket?.posts)));
  const wins = Math.max(0, Math.floor(num(bucket?.wins)));
  const pointsV3 = num(bucket?.pointsSumV3);
  const upsetPoints = num(bucket?.upsetPointsSum);
  return {
    date: dateKey,
    posts,
    wins,
    pointsV3,
    upsetPoints,
    winRate: posts > 0 ? wins / posts : 0,
    exactHitCount: 0,
  };
}

/** 既存日次バケット + 今回の increment を合算した行 */
export function projectSeasonBucket(
  existing: Record<string, unknown> | null | undefined,
  inc: {
    posts?: number;
    wins?: number;
    pointsSumV3?: number;
    upsetPointsSum?: number;
  }
): Record<string, unknown> {
  return {
    posts: num(existing?.posts) + num(inc.posts),
    wins: num(existing?.wins) + num(inc.wins),
    pointsSumV3: num(existing?.pointsSumV3) + num(inc.pointsSumV3),
    upsetPointsSum: num(existing?.upsetPointsSum) + num(inc.upsetPointsSum),
  };
}

export function mergeProfileChartsOnSeasonSettle(opts: {
  cumulative: Record<string, unknown> | null | undefined;
  /** profileCharts/{season}。あれば親 nested より優先 */
  chartsDoc?: Record<string, unknown> | null;
  seasonKey: string;
  dateKey: string;
  projectedSeasonBucket: Record<string, unknown>;
  last20Point: ProfileChartsLast20Point;
}): ProfileChartsStored {
  const prev = readStored(opts.cumulative, opts.seasonKey, opts.chartsDoc);
  const dailyPrev = Array.isArray(prev.dailyTrend) ? [...prev.dailyTrend] : [];
  const row = dailyRowFromSeasonBucket(
    opts.dateKey,
    opts.projectedSeasonBucket
  );
  const without = dailyPrev.filter((r) => r.date !== row.date);
  if (hasActivity(row)) without.push(row);

  const lastPrev = Array.isArray(prev.last20) ? [...prev.last20] : [];
  const lastNext = lastPrev.filter((p) => p.postId !== opts.last20Point.postId);
  lastNext.push(opts.last20Point);
  lastNext.sort((a, b) => a.settledAtMs - b.settledAtMs);
  const last20 =
    lastNext.length <= PROFILE_CHARTS_LAST20_MAX
      ? lastNext
      : lastNext.slice(lastNext.length - PROFILE_CHARTS_LAST20_MAX);

  return {
    v: PROFILE_CHARTS_BUNDLE_VERSION,
    seasonKey: opts.seasonKey,
    dailyTrend: pruneDaily(without),
    rankTrend: Array.isArray(prev.rankTrend) ? prev.rankTrend : undefined,
    last20,
  };
}

export function mergeProfileChartsOnRankSnapshot(opts: {
  cumulative: Record<string, unknown> | null | undefined;
  /** profileCharts/{season}。あれば親 nested より優先 */
  chartsDoc?: Record<string, unknown> | null;
  seasonKey: string;
  dateKey: string;
  totalPointsRank: number;
}): ProfileChartsStored {
  const prev = readStored(opts.cumulative, opts.seasonKey, opts.chartsDoc);
  const rankPrev = Array.isArray(prev.rankTrend) ? [...prev.rankTrend] : [];
  const point = { dateKey: opts.dateKey, rank: opts.totalPointsRank };
  const next = rankPrev.filter((p) => p.dateKey !== point.dateKey);
  next.push(point);
  next.sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  const rankTrend =
    next.length <= PROFILE_CHARTS_RANK_MAX
      ? next
      : next.slice(next.length - PROFILE_CHARTS_RANK_MAX);

  return {
    v: PROFILE_CHARTS_BUNDLE_VERSION,
    seasonKey: opts.seasonKey,
    dailyTrend: Array.isArray(prev.dailyTrend) ? prev.dailyTrend : undefined,
    rankTrend,
    last20: Array.isArray(prev.last20) ? prev.last20 : undefined,
  };
}
