import type {
  MobileMetric,
  RankingRowWithCountry,
} from "@/app/component/rankings/_data/mockRows";

/** モバイル指標キー → cumulative API の metric クエリ値 */
export const API_METRIC_BY_MOBILE: Record<MobileMetric, string> = {
  totalScore: "totalPoints",
  winRate: "winRate",
  marginPrecision: "totalPrecision",
  upsetScore: "totalUpset",
  streak: "activeWinStreak",
};

export type RankingApiRow = {
  uid: string;
  handle?: string | null;
  displayName?: string;
  photoURL?: string | null;
  plan?: string | null;
  totalPosts?: number;
  totalWins?: number;
  totalPoints?: number;
  totalPrecision?: number;
  totalUpset?: number;
  currentStreak?: number;
  activeWinStreak?: number;
  countryCode?: string | null;
  /** Day-over-day rank change (positive = improved). From snapshot job. */
  rankDeltaPlaces?: number | null;
};

export function toApiMetric(metric: MobileMetric) {
  return API_METRIC_BY_MOBILE[metric];
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
      displayName:
        (typeof row.displayName === "string" && row.displayName.trim()) ||
        (typeof row.handle === "string" && row.handle.trim()) ||
        "User",
      photoURL: row.photoURL ?? undefined,
      plan: row.plan === "pro" ? "pro" : "free",

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

      rankDeltaPlaces:
        typeof row.rankDeltaPlaces === "number" &&
        Number.isFinite(row.rankDeltaPlaces) &&
        row.rankDeltaPlaces !== 0
          ? row.rankDeltaPlaces
          : undefined,
    };
  });
}