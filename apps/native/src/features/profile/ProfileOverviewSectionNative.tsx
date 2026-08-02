/**
 * Overview タブ本体。段階マウントはここに閉じ込めて ProfileHome の hooks 順を安定させる。
 */
import { StyleSheet, View } from "react-native";
import { useProfileOverviewStage } from "../../../../../lib/profile/useProfileOverviewStage";
import { profileOverviewSeasonKey } from "../../../../../lib/profile/profileOverviewSeason";
import type { ProfileStatsStreakContext } from "../../../../../lib/profile/profileStreakScope";
import { BlocksPulseLoader } from "../../components/BlocksPulseLoader";
import type { ProfileDailyTrendRow } from "../../../../../lib/profile/profileDailyTrendRow";
import type { RankPlayoffTrendPointNative } from "./profileApi";
import type { StreakTrackerPointNative } from "./useNativeStreakTracker";
import ProfileOverviewEntranceBlock from "./ProfileOverviewEntranceBlock";
import ProfileDailyTrendChartNative from "./ProfileDailyTrendChartNative";
import ProfileRankTrendChartNative from "./ProfileRankTrendChartNative";
import ProfileStreakTrackerNative from "./ProfileStreakTrackerNative";
import ProfileSettledTodayResultsNative from "./ProfileSettledTodayResultsNative";
import { profileOverviewChartShellStyle } from "./profileOverviewChartShell";

type Props = {
  targetUid: string;
  language: "ja" | "en";
  profileStatsContext: ProfileStatsStreakContext;
  currentIsProView: boolean;
  /** カード取得済みなどで段階開始してよい */
  stageReady: boolean;
  dailyChartLoading: boolean;
  dailyChartData: ProfileDailyTrendRow[];
  rankTrend: RankPlayoffTrendPointNative[];
  rankTrendLoading: boolean;
  streakPoints: StreakTrackerPointNative[];
  streakLoading: boolean;
};

export default function ProfileOverviewSectionNative({
  targetUid,
  language,
  profileStatsContext,
  currentIsProView,
  stageReady,
  dailyChartLoading,
  dailyChartData,
  rankTrend,
  rankTrendLoading,
  streakPoints,
  streakLoading,
}: Props) {
  const overviewStage = useProfileOverviewStage(stageReady, { mobile: true });
  const entranceKey = targetUid;

  return (
    <View style={styles.overviewBlock}>
      {overviewStage >= 4 ? (
        <>
          <ProfileOverviewEntranceBlock index={0} entranceKey={entranceKey}>
            <ProfileSettledTodayResultsNative
              uid={targetUid}
              language={language}
              profileStatsContext={profileStatsContext}
              showDesignPreviewWhenEmpty={false}
            />
          </ProfileOverviewEntranceBlock>
          <View style={styles.chartGap} />
        </>
      ) : null}
      {overviewStage >= 1 ? (
        <ProfileOverviewEntranceBlock index={1} entranceKey={entranceKey}>
          {dailyChartLoading ? (
            <View style={styles.chartSkeleton}>
              <BlocksPulseLoader pixelScale={0.9} />
            </View>
          ) : (
            <ProfileDailyTrendChartNative
              key={`dailyTrend:${targetUid}:${profileOverviewSeasonKey()}:season:${dailyChartData.map((r) => r.date).join(",")}`}
              data={dailyChartData}
              language={language}
              allowAll={currentIsProView}
              rankingLeague={profileStatsContext.rankingLeague}
              range="30d"
            />
          )}
        </ProfileOverviewEntranceBlock>
      ) : (
        <View style={styles.chartSkeleton}>
          <BlocksPulseLoader pixelScale={0.9} />
        </View>
      )}
      {overviewStage >= 2 ? (
        <>
          <View style={styles.chartGap} />
          <ProfileOverviewEntranceBlock index={2} entranceKey={entranceKey}>
            <ProfileRankTrendChartNative
              data={rankTrend}
              loading={rankTrendLoading && rankTrend.length === 0}
              language={language}
            />
          </ProfileOverviewEntranceBlock>
        </>
      ) : null}
      {overviewStage >= 3 ? (
        <>
          <View style={styles.chartGap} />
          <ProfileOverviewEntranceBlock index={3} entranceKey={entranceKey}>
            <ProfileStreakTrackerNative
              points={streakPoints}
              loading={streakLoading}
              language={language}
            />
          </ProfileOverviewEntranceBlock>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  overviewBlock: {
    width: "100%",
  },
  chartGap: {
    height: 16,
  },
  chartSkeleton: {
    ...profileOverviewChartShellStyle,
    minHeight: 176,
    alignItems: "center",
    justifyContent: "center",
  },
});
