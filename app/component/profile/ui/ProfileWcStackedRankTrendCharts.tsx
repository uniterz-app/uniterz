"use client";

import { useEffect, useMemo, useState } from "react";
import type { Language } from "@/lib/i18n/language";
import type { WcKinetikStackedStage } from "@/lib/profile/profileKinetikMetricsSection";
import {
  PROFILE_WC_STACKED_STAGE_TAB_ORDER,
  profileWcStackedStageTabLabel,
  profileWcStackedStageTabsLabel,
} from "@/lib/profile/profileWcStackedStageTabs";
import type { ProfileRankTrendSection } from "@/lib/profile/useProfileWcStackedRankTrend";
import {
  CyberSlantedTab,
  CyberSlantedTabBar,
} from "@/app/component/rankings/CyberSlantedTab";
import ProfilePlayoffRankTrendChart from "./ProfilePlayoffRankTrendChart";

type Props = {
  sections: ProfileRankTrendSection[];
  loading: boolean;
  language?: Language;
  visualEffectsLite?: boolean;
};

export default function ProfileWcStackedRankTrendCharts({
  sections,
  loading,
  language = "ja",
  visualEffectsLite = false,
}: Props) {
  const [activeStage, setActiveStage] = useState<WcKinetikStackedStage>("main");

  const availableStages = useMemo(
    () =>
      PROFILE_WC_STACKED_STAGE_TAB_ORDER.filter((stage) =>
        sections.some((s) => s.wcStage === stage)
      ),
    [sections]
  );

  useEffect(() => {
    if (availableStages.length === 0) return;
    setActiveStage((prev) =>
      availableStages.includes(prev) ? prev : availableStages[0]!
    );
  }, [availableStages]);

  if (loading && sections.length === 0) {
    return (
      <ProfilePlayoffRankTrendChart
        data={[]}
        loading
        language={language}
        visualEffectsLite={visualEffectsLite}
      />
    );
  }

  if (sections.length === 0) {
    return (
      <ProfilePlayoffRankTrendChart
        data={[]}
        loading={false}
        language={language}
        visualEffectsLite={visualEffectsLite}
      />
    );
  }

  const showStageTabs = availableStages.length > 1;
  const activeSection =
    sections.find((s) => s.wcStage === activeStage) ?? sections[0]!;

  return (
    <div className="space-y-2">
      {showStageTabs ? (
        <div className="overflow-visible px-2.5">
          <CyberSlantedTabBar
            fill
            aria-label={profileWcStackedStageTabsLabel(language)}
          >
            {availableStages.map((stage) => (
              <CyberSlantedTab
                key={stage}
                role="tab"
                label={profileWcStackedStageTabLabel(stage, language)}
                active={activeStage === stage}
                onClick={() => setActiveStage(stage)}
                compact
              />
            ))}
          </CyberSlantedTabBar>
        </div>
      ) : null}
      <div className="min-w-0 overflow-hidden">
        <ProfilePlayoffRankTrendChart
          key={activeSection.wcStage}
          data={activeSection.chartRows}
          loading={false}
          language={language}
          visualEffectsLite={visualEffectsLite}
          sectionTitle={showStageTabs ? undefined : activeSection.title}
          frozen={activeSection.frozen}
        />
      </div>
    </div>
  );
}
