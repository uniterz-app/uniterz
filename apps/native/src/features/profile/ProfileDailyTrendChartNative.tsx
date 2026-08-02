/**
 * Web `ProfileDailyTrendChart` シェル + `ProfileDailyComboChartNeural` 本体。
 * 空状態は Ranking Progress / Last20 と同じ NO DATA デザイン。
 */
import { useMemo } from "react";
import { cyberAlert } from "../../components/cyberAlert";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ProfileDailyTrendRow } from "../../../../../lib/profile/profileDailyTrendRow";
import type { RankingLeagueSource } from "../../../../../lib/rankings/rankingLeagueSource";
import ProfileDailyComboChartNeuralNative from "./ProfileDailyComboChartNeuralNative";
import ProfileOverviewChartCardNative from "./ProfileOverviewChartCardNative";
import {
  profileOverviewChartEmptyHintStyle,
  profileOverviewChartNoDataStyle,
  profileOverviewChartSubtitleStyle,
  profileOverviewChartTitleStyle,
} from "./profileOverviewChartShell";

/** Ranking Progress 空チャート領域に近い高さ */
const EMPTY_CHART_H = 168;

type Props = {
  data: ProfileDailyTrendRow[];
  language: "ja" | "en";
  allowAll?: boolean;
  rankingLeague?: RankingLeagueSource;
  range?: "7d" | "30d";
};

export default function ProfileDailyTrendChartNative({
  data,
  language,
  rankingLeague = "nba",
  range = "30d",
}: Props) {
  const isJa = language === "ja";
  const title = "Daily Combo Chart";
  const subtitle = isJa
    ? "過去10日のスタッツの推移"
    : "Trend of stats over the last 10 days";
  const chartInfo = isJa
    ? "カラーバー＝日ごとの投稿数・的中数。黄緑の線＝累積の総合得点。棒をタップすると下に内訳を表示します。"
    : "Color bars: daily posts and correct picks. Lime line: cumulative total points. Tap a bar for that day's breakdown.";
  const emptyHint = isJa
    ? "シーズンの日次スタッツが溜まると表示されます"
    : "Daily season stats appear after you settle picks.";

  const limitedData = useMemo(() => {
    const rows = Array.isArray(data) ? data : [];
    const active = rows.filter(
      (r) =>
        r.posts > 0 ||
        Math.abs(r.pointsV3) > 1e-9 ||
        Math.abs(r.upsetPoints) > 1e-9
    );
    if (range === "7d") return active.slice(-7);
    return active.slice(-10);
  }, [data, range]);

  const isEmpty = limitedData.length === 0;
  const openInfo = () => cyberAlert(title, chartInfo);

  if (isEmpty) {
    return (
      <ProfileOverviewChartCardNative>
        <View style={styles.foreground}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>{title}</Text>
              <Pressable
                onPress={openInfo}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={chartInfo}
              >
                <MaterialCommunityIcons
                  name="information-outline"
                  size={18}
                  color="rgba(0,245,255,0.55)"
                />
              </Pressable>
            </View>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
          <View style={[styles.chartArea, { height: EMPTY_CHART_H }]}>
            <Text style={styles.noData}>NO DATA</Text>
            <Text style={styles.emptyHint}>{emptyHint}</Text>
          </View>
        </View>
      </ProfileOverviewChartCardNative>
    );
  }

  return (
    <ProfileOverviewChartCardNative>
      <View style={styles.foreground}>
        <ProfileDailyComboChartNeuralNative
          data={limitedData}
          language={language}
          rankingLeague={rankingLeague}
        />
      </View>
    </ProfileOverviewChartCardNative>
  );
}

const styles = StyleSheet.create({
  foreground: {
    position: "relative",
    zIndex: 1,
    minWidth: 0,
  },
  header: {
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  title: profileOverviewChartTitleStyle,
  subtitle: {
    ...profileOverviewChartSubtitleStyle,
    marginTop: 2,
  },
  chartArea: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  noData: profileOverviewChartNoDataStyle,
  emptyHint: {
    ...profileOverviewChartEmptyHintStyle,
    maxWidth: 260,
  },
});
