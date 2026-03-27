import type {
  MobileMetric,
  RankingRowWithCountry,
}from "@/app/component/rankings/_data/mockRows";

export type RankingApiRow = {
  uid: string;
  handle?: string | null;
  displayName?: string;
  photoURL?: string | null;
  totalPosts?: number;
  totalWins?: number;
  totalPoints?: number;
  totalPrecision?: number;
  totalUpset?: number;
  currentStreak?: number;
  activeWinStreak?: number;
  countryCode?: string | null;
};

export function toApiMetric(metric: MobileMetric) {
  if (metric === "winRate") return "winRate";
  if (metric === "totalScore") return "totalPoints";
  if (metric === "marginPrecision") return "totalPrecision";
  if (metric === "upsetScore") return "totalUpset";
  return "activeWinStreak";
}

export function toMobileRows(
  metric: MobileMetric,
  rows: RankingApiRow[]
): RankingRowWithCountry[] {
  return rows.map((row) => {
    const totalPosts = row.totalPosts ?? 0;
    const totalWins = row.totalWins ?? 0;
    const totalPoints = row.totalPoints ?? 0;
    const totalPrecision = row.totalPrecision ?? 0;
    const totalUpset = row.totalUpset ?? 0;

    return {
      uid: row.uid,
      handle: row.handle ?? "",
      displayName: row.displayName ?? "user",
      photoURL: row.photoURL ?? undefined,

      totalScore: totalPoints,
      avgTotalScore: totalPosts > 0 ? totalPoints / totalPosts : 0,

      marginPrecisionScore: totalPrecision,
      avgMarginPrecision: totalPosts > 0 ? totalPrecision / totalPosts : 0,

      upsetScore: totalUpset,
      avgUpsetScore: totalPosts > 0 ? totalUpset / totalPosts : 0,

      streak: row.activeWinStreak ?? 0,
      posts: totalPosts,
      winRate: totalPosts > 0 ? totalWins / totalPosts : 0,

      countryCode: row.countryCode ?? undefined,
    };
  });
}