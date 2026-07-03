import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import type { WcKinetikStackedStage } from "@/lib/profile/profileKinetikMetricsSection";

export const PROFILE_WC_STACKED_STAGE_TAB_ORDER: WcKinetikStackedStage[] = [
  "main",
  "qualifying",
];

export function profileWcStackedStageTabLabel(
  stage: WcKinetikStackedStage,
  language: Language
): string {
  const m = t(language).rankings;
  return stage === "main" ? m.stageKnockout : m.stageGroup;
}

export function profileWcStackedStageTabsLabel(language: Language): string {
  return t(language).rankings.stageTabsLabel;
}
