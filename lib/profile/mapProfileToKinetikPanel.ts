import type { Profile } from "@/app/component/profile/useProfile";
import type {
  SummaryForCardsV2,
  SummaryRanksV2,
} from "@/app/component/profile/useUserStatsV2";
import type { ProfileEditKinetikStats } from "@/app/component/profile/edit/profileEditKinetikTypes";
import type { ProfileEditTronIdentity } from "@/app/component/profile/edit/profileEditTronTypes";
import { getProfileKinetikMetricsTitle } from "@/lib/profile/profileStatsDisplay";
import type { ProfileStatsStreakContext } from "@/lib/profile/profileStreakScope";
import type { Language } from "@/lib/i18n/language";

export type ProfileKinetikPanelMapped = {
  identity: ProfileEditTronIdentity;
  stats: ProfileEditKinetikStats;
  metricsTitle: string;
  winStreak: number;
  totalPointsRank: number | null;
  totalPointsRankDenominator: number | null;
  rankDeltaPlaces: number | null;
};

export function mapProfileToKinetikPanel(input: {
  profile: Profile;
  summary?: SummaryForCardsV2;
  summaryRanks?: SummaryRanksV2;
  profileStatsContext: ProfileStatsStreakContext;
  winStreak: number;
}): ProfileKinetikPanelMapped {
  const handle = input.profile.handle?.trim() ?? "";
  const winRatePct = (input.summary?.winRate ?? 0) * 100;

  const totalPointsRank = input.summaryRanks?.totalPoints ?? null;
  const totalPointsRankDenominator =
    input.summaryRanks?.totalPointsDenominator ?? null;
  const rankDeltaPlaces = input.summaryRanks?.rankDeltaPlaces ?? null;
  const winStreak = Math.max(0, Math.floor(input.winStreak));

  return {
    identity: {
      displayName: input.profile.displayName,
      handle,
      photoURL: input.profile.avatarUrl ?? null,
      systemId: handle ? `@${handle}` : input.profile.displayName,
    },
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
    metricsTitle: getProfileKinetikMetricsTitle(input.profileStatsContext),
    winStreak,
    totalPointsRank,
    totalPointsRankDenominator,
    rankDeltaPlaces,
  };
}

export function toKinetikPanelLanguage(language: Language): "ja" | "en" {
  return language === "ja" ? "ja" : "en";
}
