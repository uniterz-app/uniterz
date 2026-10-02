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
  "totalUpset",
  "winRate",
  "activeWinStreak",
] as const;

export type CommunityMetric = (typeof COMMUNITY_METRICS)[number];

/** 新規作成で選べるリーグ（既存グループの他リーグは表示のみ） */
export const COMMUNITY_CREATE_LEAGUES = ["nba"] as const satisfies readonly CommunityLeague[];

/** 新規作成で選べる指標 */
export const COMMUNITY_CREATE_METRICS = ["totalPoints"] as const satisfies readonly CommunityMetric[];

export function parseCommunityMetric(raw: unknown): CommunityMetric {
  const s = String(raw ?? "");
  if (s === "totalPrecision") return "totalPoints";
  return COMMUNITY_METRICS.includes(s as CommunityMetric)
    ? (s as CommunityMetric)
    : "totalPoints";
}

/**
 * グループ集計期間（作成時に確定）
 * - from_now: 開始日〜（任意で終了日）今日まで
 * - calendar_month: 指定 YYYY-MM のその月
 * - nba_season / nba_playoffs: 現行シーズン窓（日付近似 + 日次バケット）
 */
export const COMMUNITY_PERIODS = [
  "from_now",
  "calendar_month",
  "nba_season",
  "nba_playoffs",
] as const;

export type CommunityPeriodType = (typeof COMMUNITY_PERIODS)[number];

/** 新規作成で選べる期間 */
export const COMMUNITY_CREATE_PERIODS = [
  "from_now",
  "calendar_month",
  "nba_season",
  "nba_playoffs",
] as const satisfies readonly CommunityPeriodType[];

const LEGACY_PERIODS = new Set(["all_time", "rolling_30d"]);

export function parseCommunityPeriod(raw: unknown): CommunityPeriodType {
  const s = String(raw ?? "").trim();
  if ((COMMUNITY_PERIODS as readonly string[]).includes(s)) {
    return s as CommunityPeriodType;
  }
  if (LEGACY_PERIODS.has(s)) return "from_now";
  return "from_now";
}

export function normalizeRankingForPeriod(
  metric: CommunityMetric,
  period: CommunityPeriodType
): { metric: CommunityMetric; period: CommunityPeriodType } {
  return { metric, period };
}
