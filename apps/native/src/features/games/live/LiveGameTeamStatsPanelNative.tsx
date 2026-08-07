/** Web `LiveGameTeamStatsPanel` 相当 */
import { StyleSheet, Text, View } from "react-native";
import {
  formatLiveTeamStatValue,
  type LiveGameStatsReport,
} from "../../../../../../lib/games/liveGameStats";
import { METRIC_FONT } from "../../rankings/rankingsUiTheme";

const WIN_GREEN = "#5cf0b5";
const FRAME = "rgba(255,255,255,0.22)";
const ROW_LINE = "rgba(255,255,255,0.1)";

type Props = {
  report: LiveGameStatsReport;
};

export default function LiveGameTeamStatsPanelNative({ report }: Props) {
  return (
    <View style={styles.frame}>
      {report.teamStats.map((row, i) => {
        const leftWin = row.lowerIsBetter
          ? row.home < row.away
          : row.home > row.away;
        const rightWin = row.lowerIsBetter
          ? row.away < row.home
          : row.away > row.home;
        const last = i === report.teamStats.length - 1;

        return (
          <View
            key={row.key}
            style={[styles.row, last ? null : styles.rowBorder]}
          >
            <Text
              style={[
                styles.value,
                styles.valueLeft,
                leftWin ? styles.valueWin : styles.valuePlain,
              ]}
            >
              {formatLiveTeamStatValue(row.home, row.format)}
            </Text>
            <Text style={styles.label}>{row.label}</Text>
            <Text
              style={[
                styles.value,
                styles.valueRight,
                rightWin ? styles.valueWin : styles.valuePlain,
              ]}
            >
              {formatLiveTeamStatValue(row.away, row.format)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderWidth: 1,
    borderColor: FRAME,
    backgroundColor: "transparent",
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ROW_LINE,
  },
  value: {
    flex: 1,
    fontFamily: METRIC_FONT,
    fontSize: 15,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    transform: [{ skewX: "-6deg" }],
  },
  valueLeft: { textAlign: "right" },
  valueRight: { textAlign: "left" },
  valuePlain: { color: "#fff" },
  valueWin: {
    color: WIN_GREEN,
    textShadowColor: "rgba(92,240,181,0.55)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  label: {
    width: 80,
    fontFamily: METRIC_FONT,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.1,
    textTransform: "uppercase",
    textAlign: "center",
    color: "rgba(255,255,255,0.45)",
  },
});
