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

  return {
    uid: row.uid,
    displayName: row.displayName,
    handle: row.handle ?? "",
    photoURL: row.photoURL ?? undefined,
    plan: row.plan === "pro" ? "pro" : "free",
    countryCode: row.countryCode,
    posts: row.totalPosts ?? 0,
    winRate,
    totalPoints: row.totalPoints ?? 0,
    totalScore: row.totalPoints ?? 0,
    totalPrecision: row.totalPrecision ?? 0,
    marginPrecisionScore: row.totalPrecision ?? 0,
    totalUpset: row.totalUpset ?? 0,
    upsetScore: row.totalUpset ?? 0,
    streak: row.activeWinStreak ?? 0,
    activeWinStreak: row.activeWinStreak ?? 0,
    totalPosts: row.totalPosts ?? 0,
    avgTotalScore: 0,
    avgMarginPrecision: 0,
    avgUpsetScore: 0,
    value,
  } as RankingRowWithCountry;
}
