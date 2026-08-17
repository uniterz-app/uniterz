/** Web `LiveGameLeadersPanel` 相当 — 縦リスト */
import { StyleSheet, Text, View } from "react-native";
import {
  deriveLiveGameLeaders,
  type LiveGameStatsReport,
} from "../../../../../../lib/games/liveGameStats";
import { playerCardName } from "../../../../../../lib/predict/nbaRoster";
import { getTeamPrimaryColor } from "../../../../../../lib/team-colors";
import { METRIC_FONT } from "../../rankings/rankingsUiTheme";

const FRAME = "rgba(255,255,255,0.22)";
const ROW_LINE = "rgba(255,255,255,0.1)";

type Props = {
  report: LiveGameStatsReport;
};

export default function LiveGameLeadersPanelNative({ report }: Props) {
  const leaders = deriveLiveGameLeaders(report);
  if (leaders.length === 0) return null;

  return (
    <View style={styles.frame}>
      {leaders.map((L, i) => {
        const accent =
          getTeamPrimaryColor("nba", L.teamId) ?? "#e8edf5";
        const last = i === leaders.length - 1;
        return (
          <View
            key={L.key}
            style={[styles.row, last ? null : styles.rowBorder]}
          >
            <Text style={styles.label}>{L.label}</Text>
            <Text style={styles.name} numberOfLines={1}>
              {playerCardName(L)}
            </Text>
            <Text style={[styles.abbr, { color: accent }]}>{L.teamAbbr}</Text>
            <Text style={styles.value}>{L.value}</Text>
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
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ROW_LINE,
  },
  label: {
    width: 36,
    fontFamily: METRIC_FONT,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.4)",
  },
  name: {
    flex: 1,
    minWidth: 0,
    fontFamily: METRIC_FONT,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: "#fff",
    transform: [{ skewX: "-6deg" }],
  },
  abbr: {
    fontFamily: METRIC_FONT,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  value: {
    minWidth: 36,
    textAlign: "right",
    fontFamily: METRIC_FONT,
    fontSize: 16,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    color: "#fff",
    transform: [{ skewX: "-6deg" }],
  },
});
