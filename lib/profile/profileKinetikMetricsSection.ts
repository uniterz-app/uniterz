import type { ProfileEditKinetikStats } from "@/app/component/profile/edit/profileEditKinetikTypes";
import type { KinetikRankBadgeResult } from "@/app/component/profile/edit/kinetikRankBadge";
import { resolveKinetikRankBadge } from "@/app/component/profile/edit/kinetikRankBadge";
import type {
  SummaryForCardsV2,
  SummaryRanksV2,
} from "@/app/component/profile/useUserStatsV2";
import type { MyRankMetricValueDeltas } from "@/lib/rankings/myRankMetricValueDeltas";
import type { WcRankingStage } from "@/lib/rankings/wcRankingStage";

export type ProfileKinetikMetricsSection = {
  wcStage: WcKinetikStackedStage;
  title: string;
  stats: ProfileEditKinetikStats;
  metricValueDeltas: MyRankMetricValueDeltas | null;
  totalPointsRank: number | null;
  totalPointsRankDenominator: number | null;
  rankDeltaPlaces: number | null;
  winStreak: number;
  rankBadge: KinetikRankBadgeResult | null;
};

export const WC_KINETIK_STACKED_STAGES = ["main", "qualifying"] as const;
export type WcKinetikStackedStage = (typeof WC_KINETIK_STACKED_STAGES)[number];

export function getProfileKinetikMetricsTitleForWcStage(
  stage: WcKinetikStackedStage
): string {
  if (stage === "main") return "WORLD CUP // KNOCKOUT STAGE STATS";
  return "WORLD CUP // GROUP STAGE STATS";
}

export function getProfileRankTrendSectionTitle(
  stage: WcKinetikStackedStage
): string {
  if (stage === "main") return "WORLD CUP // KNOCKOUT STAGE";
  return "WORLD CUP // GROUP STAGE";
}

export function buildProfileKinetikMetricsSection(
  wcStage: WcKinetikStackedStage,
  input: {
    summary?: SummaryForCardsV2 | null;
    summaryRanks?: SummaryRanksV2 | null;
    metricValueDeltas?: MyRankMetricValueDeltas | null;
    winStreak?: number;
  }
): ProfileKinetikMetricsSection {
  const winRatePct = (input.summary?.winRate ?? 0) * 100;
  const totalPointsRank = input.summaryRanks?.totalPoints ?? null;
  const totalPointsRankDenominator =
    input.summaryRanks?.totalPointsDenominator ?? null;
  const rankDeltaPlaces = input.summaryRanks?.rankDeltaPlaces ?? null;
  const winStreak = Math.max(
    0,
    Math.floor(input.summary?.activeWinStreak ?? input.winStreak ?? 0)
  );

  return {
    wcStage,
    title: getProfileKinetikMetricsTitleForWcStage(wcStage),
    stats: {
      winRate: winRatePct,
      posts: input.summary?.posts ?? 0,
      hits: input.summary?.wins ?? 0,
      scorePrecision: input.summary?.scorePrecisionSum ?? 0,
      totalPoints: input.summary?.pointsSumV3 ?? 0,
      upset: input.summary?.upsetPointsSum ?? 0,
      winStreak,
      totalPointsRank,
      totalPointsRankDenominator,
      rankDeltaPlaces,
    },
    metricValueDeltas: input.metricValueDeltas ?? null,
    totalPointsRank,
    totalPointsRankDenominator,
    rankDeltaPlaces,
    winStreak,
    rankBadge: resolveKinetikRankBadge({
      totalPointsRank,
      totalPointsRankDenominator,
      rankDeltaPlaces,
    }),
  };
}

export function isWcKinetikStackedStage(
  stage: WcRankingStage
): stage is WcKinetikStackedStage {
  return stage === "main" || stage === "qualifying";
}
