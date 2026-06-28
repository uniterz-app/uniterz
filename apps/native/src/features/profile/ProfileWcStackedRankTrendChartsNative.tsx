/**
 * Web `ProfileWcStackedRankTrendCharts` 相当 — WC 時はノックアウト上・グループ下。
 */
import { View, StyleSheet } from "react-native";
import type { ProfileRankTrendSection } from "../../../../../lib/profile/useProfileWcStackedRankTrend";
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

  const showSectionTitles = sections.length > 1;

  return (
    <View style={styles.stack}>
      {sections.map((section, index) => (
        <View key={section.wcStage} style={index > 0 ? styles.gap : undefined}>
          <ProfileRankTrendChartNative
            data={section.chartRows}
            loading={false}
            language={language}
            sectionTitle={showSectionTitles ? section.title : undefined}
            stackedSecondary={index > 0}
            frozen={section.frozen}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing.sm,
  },
  gap: {
    marginTop: spacing.sm,
  },
});
