import { LEAGUES, type League } from "@/lib/leagues";

/** グループ内ランキングの対象リーグ（all = 全リーグ合算） */
export const COMMUNITY_LEAGUES = ["all", ...Object.values(LEAGUES)] as const;

export type CommunityLeague = (typeof COMMUNITY_LEAGUES)[number];

export function parseCommunityLeague(raw: unknown): CommunityLeague {
  const s = String(raw ?? "all")
    .trim()
    .toLowerCase();
  if (s === "all") return "all";
  const values = Object.values(LEAGUES) as League[];
  if (values.includes(s as League)) return s as CommunityLeague;
  return "all";
}

export const COMMUNITY_METRICS = [
  "totalPoints",
  "totalPrecision",
  "totalUpset",
  "winRate",
  "activeWinStreak",
] as const;

export type CommunityMetric = (typeof COMMUNITY_METRICS)[number];

export function parseCommunityMetric(raw: unknown): CommunityMetric {
  const s = String(raw ?? "");
  return COMMUNITY_METRICS.includes(s as CommunityMetric)
    ? (s as CommunityMetric)
    : "totalPoints";
}

/** グループは作成日以降の成績のみ（累計・直近ウィンドウは使わない） */
export const COMMUNITY_PERIODS = ["from_now"] as const;

export type CommunityPeriodType = (typeof COMMUNITY_PERIODS)[number];

const LEGACY_PERIODS = new Set([
  "all_time",
  "calendar_month",
  "rolling_30d",
]);

export function parseCommunityPeriod(raw: unknown): CommunityPeriodType {
  const s = String(raw ?? "").trim();
  if (s === "from_now") return "from_now";
  if (LEGACY_PERIODS.has(s)) return "from_now";
  return "from_now";
}

export function normalizeRankingForPeriod(
  metric: CommunityMetric,
  period: CommunityPeriodType
): { metric: CommunityMetric; period: CommunityPeriodType } {
  return { metric, period };
}
