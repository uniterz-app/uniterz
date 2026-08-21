/**
 * Overview タブ本体。段階マウントはここに閉じ込めて ProfileHome の hooks 順を安定させる。
 *
 * 表示・描画順（同時マウント可）:
 * 1 Result Drop → 2 Ranking Progress → 3 Last20 Tracker → 4 Daily Combo
 * CAREER はヒーローカード裏面（フリップ）で見る。
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
  streakUnavailable?: boolean;
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
  streakUnavailable = false,
}: Props) {
  /** 4ブロック同時マウント。入場アニメの index だけ Result Drop を先頭にする */
  const overviewStage = useProfileOverviewStage(stageReady, {
    mobile: true,
    instant: true,
  });
  const entranceKey = targetUid;
  const ready = overviewStage >= 4;

  if (!ready) {
    return (
      <View style={styles.overviewBlock}>
        <View style={styles.chartSkeleton}>
          <BlocksPulseLoader pixelScale={0.9} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.overviewBlock}>
      <ProfileOverviewEntranceBlock index={0} entranceKey={entranceKey}>
        <ProfileSettledTodayResultsNative
          uid={targetUid}
          language={language}
          profileStatsContext={profileStatsContext}
          showDesignPreviewWhenEmpty={false}
        />
      </ProfileOverviewEntranceBlock>

      <View style={styles.chartGap} />
      <ProfileOverviewEntranceBlock index={1} entranceKey={entranceKey}>
        <ProfileRankTrendChartNative
          data={rankTrend}
          loading={rankTrendLoading && rankTrend.length === 0}
          language={language}
        />
      </ProfileOverviewEntranceBlock>

      <View style={styles.chartGap} />
      <ProfileOverviewEntranceBlock index={2} entranceKey={entranceKey}>
        <ProfileStreakTrackerNative
          points={streakPoints}
          loading={streakLoading}
          unavailable={streakUnavailable}
          language={language}
        />
      </ProfileOverviewEntranceBlock>

      <View style={styles.chartGap} />
      <ProfileOverviewEntranceBlock index={3} entranceKey={entranceKey}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  overviewBlock: {
    alignSelf: "stretch",
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
