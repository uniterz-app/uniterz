/**
 * Overview タブ本体。段階マウントはここに閉じ込めて ProfileHome の hooks 順を安定させる。
 *
 * 表示・描画順（同時マウント可）:
 * 1 Result Drop → PICK UP / PRO LEAGUE 切替 → 2 Ranking Progress → 3 Last20 Tracker → 4 Daily Combo
 * CAREER はヒーローカード裏面（フリップ）で見る。
 */
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useProfileOverviewStage } from "../../../../../lib/profile/useProfileOverviewStage";
import {
  profileChartsDivisionCopy,
  type ProfileChartsDivision,
  type ProfileOpenChartsAccess,
} from "../../../../../lib/profile/profileChartsDivision";
import { rankTrendChartPointsFromSeed } from "../../../../../lib/profile/profileChartsBundle";
import type { ProfileOpenChartsState } from "../../../../../lib/profile/useProfileOpenCharts";
import { streakTrackerPointsFromLast20 } from "../../../../../lib/profile/streakTrackerChartLayout";
import {
  PRO_LEAGUE_ATMOSPHERE,
  PRO_LEAGUE_DIVISION_TAB_THEME,
} from "../../../../../lib/rankings/proLeagueAtmosphere";
import {
  CyberSlantedTabBarNative,
  CyberSlantedTabNative,
} from "../rankings/CyberSlantedTabNative";
import { rankingsTexts } from "../rankings/rankingsTexts";
import { openProSubscribeNative } from "../../navigation/navigationRef";
import { normalizeProfileDailyTrendRows } from "./profileApi";
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
import { resolveLocalizedLang } from "../../../../../lib/i18n/localize";

type Props = {
  targetUid: string;
  language: string;
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
  isMe: boolean;
  openChartsAccess: ProfileOpenChartsAccess;
  chartsDivision: ProfileChartsDivision;
  onChartsDivisionChange: (next: ProfileChartsDivision) => void;
  openCharts: ProfileOpenChartsState;
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
  isMe,
  openChartsAccess,
  chartsDivision,
  onChartsDivisionChange,
  openCharts,
}: Props) {
  const showOpen = chartsDivision === "open" && openChartsAccess === "visible";
  const showLock = chartsDivision === "open" && openChartsAccess === "locked";
  const divisionCopy = profileChartsDivisionCopy(
    resolveLocalizedLang(language),
    isMe
  );
  const lockCopy = useMemo(() => rankingsTexts(language), [language]);
  const openRankTrend = useMemo(
    () => rankTrendChartPointsFromSeed(openCharts.rankTrend),
    [openCharts.rankTrend]
  );
  const openStreakPoints = useMemo(
    () => streakTrackerPointsFromLast20(openCharts.last20),
    [openCharts.last20]
  );
  const openDailyRows = useMemo(
    () => normalizeProfileDailyTrendRows(openCharts.dailyTrend),
    [openCharts.dailyTrend]
  );

  /** 4ブロック同時マウント。入場アニメの index だけ Result Drop を先頭にする */
  const overviewStage = useProfileOverviewStage(stageReady, {
    mobile: true,
    instant: true,
  });
  const entranceKey = targetUid;
  const ready = overviewStage >= 4;
  const chartLang = resolveLocalizedLang(language) === "ja" ? "ja" : "en";

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

      {openChartsAccess !== "hidden" ? (
        <>
          <View style={styles.chartGap} />
          <CyberSlantedTabBarNative fill>
            <CyberSlantedTabNative
              label={divisionCopy.pickUp}
              active={chartsDivision === "pickup"}
              onPress={() => onChartsDivisionChange("pickup")}
              compact
            />
            <CyberSlantedTabNative
              label={divisionCopy.proLeague}
              active={chartsDivision === "open"}
              onPress={() => onChartsDivisionChange("open")}
              compact
              theme={PRO_LEAGUE_DIVISION_TAB_THEME}
            />
          </CyberSlantedTabBarNative>
        </>
      ) : null}

      {showLock ? (
        <>
          <View style={styles.chartGap} />
          <View style={styles.lock}>
            <Text style={styles.lockEyebrow}>PRO ONLY</Text>
            <Text style={styles.lockTitle}>
              {lockCopy.divisionOpenTitle ?? "PRO LEAGUE"}
            </Text>
            <Text style={styles.lockBody}>{divisionCopy.lockBody}</Text>
            <Pressable
              onPress={openProSubscribeNative}
              accessibilityRole="button"
              style={({ pressed }) => [styles.lockCta, pressed && styles.lockCtaPressed]}
            >
              <Text style={styles.lockCtaText}>
                {lockCopy.divisionOpenCta ?? "Explore Pro"}
              </Text>
            </Pressable>
          </View>
        </>
      ) : (
        <>
          <View style={styles.chartGap} />
          <ProfileOverviewEntranceBlock index={1} entranceKey={entranceKey}>
            <ProfileRankTrendChartNative
              data={showOpen ? openRankTrend : rankTrend}
              loading={
                showOpen
                  ? openCharts.loading
                  : rankTrendLoading && rankTrend.length === 0
              }
              language={chartLang}
            />
          </ProfileOverviewEntranceBlock>

          <View style={styles.chartGap} />
          <ProfileOverviewEntranceBlock index={2} entranceKey={entranceKey}>
            <ProfileStreakTrackerNative
              points={showOpen ? openStreakPoints : streakPoints}
              loading={showOpen ? openCharts.loading : streakLoading}
              unavailable={showOpen ? false : streakUnavailable}
              language={language}
            />
          </ProfileOverviewEntranceBlock>

          <View style={styles.chartGap} />
          <ProfileOverviewEntranceBlock index={3} entranceKey={entranceKey}>
            {(showOpen ? openCharts.loading : dailyChartLoading) ? (
              <View style={styles.chartSkeleton}>
                <BlocksPulseLoader pixelScale={0.9} />
              </View>
            ) : showOpen ? (
              <ProfileDailyTrendChartNative
                key={`dailyTrend:${targetUid}:${profileOverviewSeasonKey()}:open:${openDailyRows.map((r) => r.date).join(",")}`}
                data={openDailyRows}
                language={chartLang}
                allowAll={currentIsProView}
                rankingLeague={profileStatsContext.rankingLeague}
                range="30d"
              />
            ) : (
              <ProfileDailyTrendChartNative
                key={`dailyTrend:${targetUid}:${profileOverviewSeasonKey()}:season:${dailyChartData.map((r) => r.date).join(",")}`}
                data={dailyChartData}
                language={chartLang}
                allowAll={currentIsProView}
                rankingLeague={profileStatsContext.rankingLeague}
                range="30d"
              />
            )}
          </ProfileOverviewEntranceBlock>
        </>
      )}
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
  lock: {
    paddingHorizontal: 16,
    paddingVertical: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: PRO_LEAGUE_ATMOSPHERE.panelBorder,
    backgroundColor: "rgba(192,132,252,0.10)",
  },
  lockEyebrow: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    color: PRO_LEAGUE_ATMOSPHERE.gold,
  },
  lockTitle: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: "#fff",
  },
  lockBody: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    color: "rgba(255,255,255,0.65)",
  },
  lockCta: {
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 2,
    backgroundColor: PRO_LEAGUE_ATMOSPHERE.gold,
  },
  lockCtaPressed: { opacity: 0.75 },
  lockCtaText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: PRO_LEAGUE_ATMOSPHERE.ink,
  },
});
