import type { CommunityMetric } from "@/lib/communities/types";
import type { CommunityGroupLeaderboardRow } from "@/app/component/communities/communityGroupDetailCache";
import type {
  MobileMetric,
  RankingRowWithCountry,
} from "@/app/component/rankings/_data/mockRows";

export function communityMetricToMobile(
  metric: CommunityMetric
): MobileMetric {
  switch (metric) {
    case "totalPrecision":
      return "marginPrecision";
    case "totalUpset":
      return "upsetScore";
    case "winRate":
      return "winRate";
    case "activeWinStreak":
      return "streak";
    default:
      return "totalScore";
  }
}

/** グループランキング行 → ランキングページの RankingCard 用 */
export function communityRowToRankingCardRow(
  row: CommunityGroupLeaderboardRow,
  metric: CommunityMetric
): RankingRowWithCountry {
  const winRate =
    row.winRate <= 1 ? row.winRate : (row.winRate ?? 0) / 100;
  const mobileMetric = communityMetricToMobile(metric);

  const value =
    mobileMetric === "totalScore"
      ? row.totalPoints ?? row.sortValue
      : mobileMetric === "marginPrecision"
        ? row.totalPrecision ?? row.sortValue
        : mobileMetric === "upsetScore"
          ? row.totalUpset ?? row.sortValue
          : mobileMetric === "winRate"
            ? winRate
            : row.activeWinStreak ?? row.sortValue;

  const posts = row.totalPosts ?? 0;
  const totalPoints = row.totalPoints ?? 0;
  const totalPrecision = row.totalPrecision ?? 0;
  const totalUpset = row.totalUpset ?? 0;

  return {
    uid: row.uid,
    displayName: row.displayName,
    handle: row.handle ?? "",
    photoURL: row.photoURL ?? undefined,
    plan: row.plan === "pro" ? "pro" : "free",
    countryCode: row.countryCode,
    posts,
    winRate,
    totalPoints,
    totalScore: totalPoints,
    totalPrecision,
    marginPrecisionScore: totalPrecision,
    totalUpset,
    upsetScore: totalUpset,
    streak: row.activeWinStreak ?? 0,
    activeWinStreak: row.activeWinStreak ?? 0,
    totalPosts: posts,
    avgTotalScore: posts > 0 ? totalPoints / posts : 0,
    avgMarginPrecision: posts > 0 ? totalPrecision / posts : 0,
    avgUpsetScore: posts > 0 ? totalUpset / posts : 0,
    value,
  } as RankingRowWithCountry;
}
