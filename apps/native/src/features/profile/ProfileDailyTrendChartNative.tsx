/**
 * Web `ProfileDailyTrendChart` シェル + `ProfileDailyComboChartNeural` 本体。
 */
import { useId, useMemo } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import Svg, { Defs, Pattern, Rect, Path as SvgPath } from "react-native-svg";
import type { ProfileDailyTrendRow } from "../../../../../lib/profile/profileDailyTrendRow";
import type { RankingLeagueSource } from "../../../../../lib/rankings/rankingLeagueSource";
import { RANK_DISPLAY_FONT } from "../rankings/rankingsUiTheme";
import ProfileDailyComboChartNeuralNative from "./ProfileDailyComboChartNeuralNative";
import {
  PROFILE_OVERVIEW_CHART_GRID_OPACITY,
  profileOverviewChartNoDataStyle,
  profileOverviewChartShellStyle,
} from "./profileOverviewChartShell";
import {
  PROFILE_SHELL_GRID_NATIVE,
  profileShellGridPathD,
} from "./profileShellGridNative";

const CYBER_NO_DATA_COLOR = "#38bdf8";

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
  rankingLeague = "worldcup",
  range = "30d",
}: Props) {
  const sid = useId().replace(/[^a-zA-Z0-9_]/g, "_");
  const gridPatternId = `daily_combo_grid_${sid}`;

  const limitedData = useMemo(() => {
    const rows = Array.isArray(data) ? data : [];
    if (range === "7d") return rows.slice(-7);
    return rows.slice(-10);
  }, [data, range]);

  const isEmpty = limitedData.length === 0;

  return (
    <View style={styles.card}>
      <Svg
        width="100%"
        height="100%"
        style={[
          StyleSheet.absoluteFillObject,
          { opacity: PROFILE_OVERVIEW_CHART_GRID_OPACITY },
        ]}
        pointerEvents="none"
      >
        <Defs>
          <Pattern
            id={gridPatternId}
            width={PROFILE_SHELL_GRID_NATIVE.cellPx}
            height={PROFILE_SHELL_GRID_NATIVE.cellPx}
            patternUnits="userSpaceOnUse"
          >
            <SvgPath
              d={profileShellGridPathD(PROFILE_SHELL_GRID_NATIVE.cellPx)}
              fill="none"
              stroke={PROFILE_SHELL_GRID_NATIVE.stroke}
              strokeWidth={PROFILE_SHELL_GRID_NATIVE.strokeWidth}
            />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${gridPatternId})`} />
      </Svg>

      <View style={styles.foreground}>
        {isEmpty ? (
          <View style={styles.emptyWrap} accessibilityRole="text">
            <Text style={styles.emptyLabel}>NO DATA</Text>
          </View>
        ) : (
          <ProfileDailyComboChartNeuralNative
            data={limitedData}
            language={language}
            rankingLeague={rankingLeague}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...profileOverviewChartShellStyle,
    position: "relative",
    minHeight: 176,
  },
  foreground: {
    position: "relative",
    zIndex: 1,
    minWidth: 0,
  },
  emptyWrap: {
    minHeight: 176,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  emptyLabel: {
    ...profileOverviewChartNoDataStyle,
    color: CYBER_NO_DATA_COLOR,
    letterSpacing: 6,
    textAlign: "center",
    fontFamily: RANK_DISPLAY_FONT,
    ...Platform.select({
      ios: {
        textShadowColor: "rgba(56,189,248,0.45)",
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
      },
      android: {},
      default: {},
    }),
  },
});
