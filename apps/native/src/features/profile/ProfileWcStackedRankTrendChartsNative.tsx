/**
 * Web `ProfileWcStackedRankTrendCharts` 相当 — WC 時はノックアウト／グループをタブ切替。
 */
import { useEffect, useMemo, useState } from "react";
import { View, StyleSheet } from "react-native";
import type { WcKinetikStackedStage } from "../../../../../lib/profile/profileKinetikMetricsSection";
import { PROFILE_WC_STACKED_STAGE_TAB_ORDER } from "../../../../../lib/profile/profileWcStackedStageTabs";
import type { ProfileRankTrendSection } from "../../../../../lib/profile/useProfileWcStackedRankTrend";
import {
  CyberSlantedTabBarNative,
  CyberSlantedTabNative,
} from "../rankings/CyberSlantedTabNative";
import { rankingsTexts } from "../rankings/rankingsTexts";
import ProfileRankTrendChartNative from "./ProfileRankTrendChartNative";
import { spacing } from "../../theme/tokens";

type Props = {
  sections: ProfileRankTrendSection[];
  loading: boolean;
  language: "ja" | "en";
};

export default function ProfileWcStackedRankTrendChartsNative({
  sections,
  loading,
  language,
}: Props) {
  const [activeStage, setActiveStage] = useState<WcKinetikStackedStage>("main");
  const t = rankingsTexts(language);

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
      <ProfileRankTrendChartNative data={[]} loading language={language} />
    );
  }

  if (sections.length === 0) {
    return (
      <ProfileRankTrendChartNative
        data={[]}
        loading={false}
        language={language}
      />
    );
  }

  const showStageTabs = availableStages.length > 1;
  const activeSection =
    sections.find((s) => s.wcStage === activeStage) ?? sections[0]!;

  return (
    <View style={styles.root}>
      {showStageTabs ? (
        <View style={styles.tabBarWrap}>
          <CyberSlantedTabBarNative fill>
            {availableStages.map((stage) => (
              <CyberSlantedTabNative
                key={stage}
                label={stage === "main" ? t.stageKnockout : t.stageGroup}
                active={activeStage === stage}
                fill
                compact
                onPress={() => setActiveStage(stage)}
              />
            ))}
          </CyberSlantedTabBarNative>
        </View>
      ) : null}
      <ProfileRankTrendChartNative
        key={activeSection.wcStage}
        data={activeSection.chartRows}
        loading={false}
        language={language}
        sectionTitle={showStageTabs ? undefined : activeSection.title}
        frozen={activeSection.frozen}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.sm,
    overflow: "visible",
  },
  /** skew タブの右端はみ出し用 */
  tabBarWrap: {
    overflow: "visible",
    paddingHorizontal: 10,
    marginBottom: spacing.xs,
  },
});
