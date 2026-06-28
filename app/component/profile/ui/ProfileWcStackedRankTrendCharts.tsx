"use client";

import type { Language } from "@/lib/i18n/language";
import type { ProfileRankTrendSection } from "@/lib/profile/useProfileWcStackedRankTrend";
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

  const showSectionTitles = sections.length > 1;

  return (
    <div className="space-y-3">
      {sections.map((section, index) => (
        <ProfilePlayoffRankTrendChart
          key={section.wcStage}
          data={section.chartRows}
          loading={false}
          language={language}
          visualEffectsLite={visualEffectsLite}
          sectionTitle={showSectionTitles ? section.title : undefined}
          stackedSecondary={index > 0}
          frozen={section.frozen}
        />
      ))}
    </div>
  );
}
