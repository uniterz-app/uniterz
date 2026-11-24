import type { CommunityMetric } from "@/lib/communities/types";

/** 行に載っている指標値で並べ替え（再集計なし） */
export function sortValueForCommunityMetric(
  row: {
    totalPoints?: number;
    totalUpset?: number;
    winRate?: number;
    activeWinStreak?: number;
    sortValue?: number;
  },
  metric: CommunityMetric
): number {
  if (metric === "totalUpset") return Number(row.totalUpset ?? 0);
  if (metric === "winRate") {
    const wr = Number(row.winRate ?? 0);
    return wr <= 1 ? wr : wr / 100;
  }
  if (metric === "activeWinStreak") return Number(row.activeWinStreak ?? 0);
  if (metric === "totalPoints") return Number(row.totalPoints ?? 0);
  return Number(row.sortValue ?? 0);
}

export function resortCommunityLeaderboardRows<
  T extends {
    uid: string;
    totalPoints?: number;
    totalUpset?: number;
    winRate?: number;
    activeWinStreak?: number;
    sortValue?: number;
    rank?: number;
  },
>(rows: T[], metric: CommunityMetric): T[] {
  const sorted = [...rows].sort((a, b) => {
    const sv = sortValueForCommunityMetric(b, metric) - sortValueForCommunityMetric(a, metric);
    if (sv !== 0) return sv;
    return a.uid.localeCompare(b.uid);
  });
  return sorted.map((row, i) => ({
    ...row,
    sortValue: sortValueForCommunityMetric(row, metric),
    rank: i + 1,
  }));
}
