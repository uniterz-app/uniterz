import type {
  MonthlyLeaderboardMetric,
  MonthlyLeaderboardRow,
} from "./useMonthlyLeaderboard";

export type MonthlyLeaderboardUIRow = {
  uid: string;
  rank: number;
  displayName: string;
  handle: string | null;
  photoURL: string | null;

  posts: number;
  wins: number;

  value: number;
  metric: MonthlyLeaderboardMetric;

  winRate: number;
  totalPoints: number;
  totalPrecision: number;
  totalUpset: number;

  countryCode?: string;
};

function getMetricValue(
  row: MonthlyLeaderboardRow,
  metric: MonthlyLeaderboardMetric
) {
  if (metric === "winRate") return row.winRate ?? 0;
  if (metric === "totalPoints") return row.totalPoints ?? 0;
  if (metric === "totalPrecision") return row.totalPrecision ?? 0;
  return row.totalUpset ?? 0;
}

export function transformMonthlyLeaderboardRow(
  row: MonthlyLeaderboardRow,
  metric: MonthlyLeaderboardMetric
): MonthlyLeaderboardUIRow {
  return {
    uid: row.uid,
    rank: row.rank,
    displayName: row.displayName,
    handle: row.handle ?? null,
    photoURL: row.photoURL ?? null,

    posts: row.posts ?? 0,
    wins: row.wins ?? 0,

    value: getMetricValue(row, metric),
    metric,

    winRate: row.winRate ?? 0,
    totalPoints: row.totalPoints ?? 0,
    totalPrecision: row.totalPrecision ?? 0,
    totalUpset: row.totalUpset ?? 0,

    countryCode: row.countryCode ?? undefined,
  };
}

export function transformMonthlyLeaderboardRows(
  rows: MonthlyLeaderboardRow[],
  metric: MonthlyLeaderboardMetric
): MonthlyLeaderboardUIRow[] {
  return rows.map((row) => transformMonthlyLeaderboardRow(row, metric));
}

export function splitMonthlyLeaderboardRows(
  rows: MonthlyLeaderboardUIRow[]
): {
  top3: MonthlyLeaderboardUIRow[];
  restRows: MonthlyLeaderboardUIRow[];
} {
  return {
    top3: rows.slice(0, 3),
    restRows: rows.slice(3),
  };
}