import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import type { ProfileStatsStreakContext } from "@/lib/profile/profileStreakScope";
import { isWcRankingStage } from "@/lib/rankings/wcRankingStage";

export type ProfileStreakCardLabels = {
  title: string;
  subtitle: string;
  tooltip: string;
};

export function getProfileStatsTitle(
  ctx: ProfileStatsStreakContext,
  language: Language
): string {
  const m = t(language);
  return ctx.rankingLeague === "worldcup"
    ? m.profile.statsTitleWcStage2026
    : m.profile.statsTitlePlayoffs2026;
}

export function getProfileMaxStreakLabels(
  ctx: ProfileStatsStreakContext,
  language: Language
): ProfileStreakCardLabels {
  const m = t(language);
  if (ctx.rankingLeague === "nba") {
    return {
      title: m.profile.maxWinStreakPlayoffs,
      subtitle: m.profile.maxWinStreakPlayoffsSubtitle,
      tooltip: m.profile.maxWinStreakPlayoffsTooltip,
    };
  }
  const stage =
    ctx.wcStage && isWcRankingStage(ctx.wcStage) ? ctx.wcStage : "overall";
  if (stage === "qualifying") {
    return {
      title: m.profile.maxWinStreakWcQualifying,
      subtitle: m.profile.maxWinStreakWcQualifyingSubtitle,
      tooltip: m.profile.maxWinStreakWcQualifyingTooltip,
    };
  }
  if (stage === "main") {
    return {
      title: m.profile.maxWinStreakWcKnockout,
      subtitle: m.profile.maxWinStreakWcKnockoutSubtitle,
      tooltip: m.profile.maxWinStreakWcKnockoutTooltip,
    };
  }
  return {
    title: m.profile.maxWinStreakWcOverall,
    subtitle: m.profile.maxWinStreakWcOverallSubtitle,
    tooltip: m.profile.maxWinStreakWcOverallTooltip,
  };
}

export function getProfileActiveStreakBadgeLabel(
  ctx: ProfileStatsStreakContext,
  language: Language
): string {
  const m = t(language);
  if (ctx.rankingLeague === "nba") return m.profile.activeWinStreakPlayoffs;
  const stage =
    ctx.wcStage && isWcRankingStage(ctx.wcStage) ? ctx.wcStage : "overall";
  if (stage === "qualifying") return m.profile.activeWinStreakWcQualifying;
  if (stage === "main") return m.profile.activeWinStreakWcKnockout;
  return m.profile.activeWinStreakWcOverall;
}
