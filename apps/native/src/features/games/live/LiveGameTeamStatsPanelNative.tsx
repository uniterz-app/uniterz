/** Web `LiveGameTeamStatsPanel` 相当 */
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  formatLiveTeamStatValue,
  type LiveGameStatsReport,
} from "../../../../../../lib/games/liveGameStats";
import { getNbaTeamNicknameById } from "../../../../../../lib/nba-team-names";
import { matchupTeamUiAccent } from "../../../../../../lib/team-colors";
import { METRIC_FONT } from "../../rankings/rankingsUiTheme";

const WIN_GREEN = "#5cf0b5";
const FRAME = "rgba(255,255,255,0.22)";
const ROW_LINE = "rgba(255,255,255,0.1)";

type Props = {
  report: LiveGameStatsReport;
  onOpenTeamDetail?: (teamId: string) => void;
};

export default function LiveGameTeamStatsPanelNative({
  report,
  onOpenTeamDetail,
}: Props) {
  const homeColor = matchupTeamUiAccent(
    "nba",
    report.home.teamId,
    report.home.teamId,
    report.away.teamId
  );
  const awayColor = matchupTeamUiAccent(
    "nba",
    report.away.teamId,
    report.home.teamId,
    report.away.teamId
  );
  const homeNick = getNbaTeamNicknameById(report.home.teamId);
  const awayNick = getNbaTeamNicknameById(report.away.teamId);

  const homeLabel = `${homeNick} →`;
  const awayLabel = `${awayNick} →`;

  return (
    <View style={styles.frame}>
      <View style={[styles.row, styles.rowBorder]}>
        {onOpenTeamDetail ? (
          <Pressable
            onPress={() => onOpenTeamDetail(report.home.teamId)}
            style={({ pressed }) => [
              styles.teamHitLeft,
              pressed ? styles.teamHitPressed : null,
            ]}
            accessibilityRole="button"
            accessibilityLabel={homeNick}
          >
            <Text
              style={[styles.teamName, styles.teamNameLeft, { color: homeColor }]}
              numberOfLines={1}
            >
              {homeLabel}
            </Text>
          </Pressable>
        ) : (
          <Text
            style={[styles.teamName, styles.teamNameLeft, { color: homeColor }]}
            numberOfLines={1}
          >
            {homeLabel}
          </Text>
        )}
        <View style={styles.labelSpacer} />
        {onOpenTeamDetail ? (
          <Pressable
            onPress={() => onOpenTeamDetail(report.away.teamId)}
            style={({ pressed }) => [
              styles.teamHitRight,
              pressed ? styles.teamHitPressed : null,
            ]}
            accessibilityRole="button"
            accessibilityLabel={awayNick}
          >
            <Text
              style={[
                styles.teamName,
                styles.teamNameRight,
                { color: awayColor },
              ]}
              numberOfLines={1}
            >
              {awayLabel}
            </Text>
          </Pressable>
        ) : (
          <Text
            style={[styles.teamName, styles.teamNameRight, { color: awayColor }]}
            numberOfLines={1}
          >
            {awayLabel}
          </Text>
        )}
      </View>

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
    backgroundColor: "#000",
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
  teamName: {
    flex: 1,
    minWidth: 0,
    fontFamily: METRIC_FONT,
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    transform: [{ skewX: "-6deg" }],
  },
  teamNameLeft: { textAlign: "right" },
  teamNameRight: { textAlign: "left" },
  teamHitLeft: {
    flex: 1,
    minWidth: 0,
    alignItems: "flex-end",
    borderRadius: 2,
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  teamHitRight: {
    flex: 1,
    minWidth: 0,
    alignItems: "flex-start",
    borderRadius: 2,
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  teamHitPressed: {
    backgroundColor: "rgba(255,255,255,0.14)",
    opacity: 0.85,
  },
  labelSpacer: {
    width: 80,
  },
  value: {
    flex: 1,
    fontFamily: METRIC_FONT,
    fontSize: 19,
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
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.1,
    textTransform: "uppercase",
    textAlign: "center",
    color: "rgba(255,255,255,0.45)",
  },
});
