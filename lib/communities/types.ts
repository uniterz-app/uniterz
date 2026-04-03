export const COMMUNITY_METRICS = [
  "totalPoints",
  "totalPrecision",
  "totalUpset",
  "winRate",
  "activeWinStreak",
] as const;

export type CommunityMetric = (typeof COMMUNITY_METRICS)[number];

export const COMMUNITY_PERIODS = [
  "all_time",
  "calendar_month",
  "rolling_30d",
] as const;

export type CommunityPeriodType = (typeof COMMUNITY_PERIODS)[number];

export function parseCommunityMetric(raw: unknown): CommunityMetric {
  const s = String(raw ?? "");
  return COMMUNITY_METRICS.includes(s as CommunityMetric)
    ? (s as CommunityMetric)
    : "totalPoints";
}

export function parseCommunityPeriod(raw: unknown): CommunityPeriodType {
  const s = String(raw ?? "");
  return COMMUNITY_PERIODS.includes(s as CommunityPeriodType)
    ? (s as CommunityPeriodType)
    : "all_time";
}

export function normalizeRankingForPeriod(
  metric: CommunityMetric,
  period: CommunityPeriodType
): { metric: CommunityMetric; period: CommunityPeriodType } {
  if (metric === "activeWinStreak" && period !== "all_time") {
    return { metric, period: "all_time" };
  }
  return { metric, period };
}
