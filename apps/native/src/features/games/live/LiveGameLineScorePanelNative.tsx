/** Web `LiveGameLineScorePanel` 相当 */
import { StyleSheet, Text, View } from "react-native";
import type { LiveGameStatsReport } from "../../../../../../lib/games/liveGameStats";
import { getTeamPrimaryColor } from "../../../../../../lib/team-colors";
import { METRIC_FONT } from "../../rankings/rankingsUiTheme";

type Props = {
  report: LiveGameStatsReport;
  /** true なら外枠カードなし（親カードに埋め込み） */
  embedded?: boolean;
};

function cell(v: number | null): string {
  return v == null ? "—" : String(v);
}

export default function LiveGameLineScorePanelNative({
  report,
  embedded = false,
}: Props) {
  const ls = report.lineScore;
  if (!ls || ls.periods.length === 0) return null;

  const homeColor =
    getTeamPrimaryColor("nba", report.home.teamId) ?? "#e8edf5";
  const awayColor =
    getTeamPrimaryColor("nba", report.away.teamId) ?? "#e8edf5";

  const body = (
    <>
      <View style={styles.row}>
        <View style={styles.abbrCol} />
        {ls.periods.map((p) => (
          <Text key={p} style={styles.headCell}>
            {p}
          </Text>
        ))}
        <Text style={[styles.headCell, styles.headTotal]}>T</Text>
      </View>

      <View style={[styles.row, styles.homeRow]}>
        <Text style={[styles.abbr, { color: homeColor }]} numberOfLines={1}>
          {report.home.abbr}
        </Text>
        {ls.home.map((v, i) => (
          <Text key={`h-${ls.periods[i]}`} style={styles.periodCell}>
            {cell(v)}
          </Text>
        ))}
        <Text style={styles.totalCell}>{report.home.score}</Text>
      </View>

      <View style={styles.row}>
        <Text style={[styles.abbr, { color: awayColor }]} numberOfLines={1}>
          {report.away.abbr}
        </Text>
        {ls.away.map((v, i) => (
          <Text key={`a-${ls.periods[i]}`} style={styles.periodCell}>
            {cell(v)}
          </Text>
        ))}
        <Text style={styles.totalCell}>{report.away.score}</Text>
      </View>
    </>
  );

  if (embedded) return <View>{body}</View>;

  return <View style={styles.card}>{body}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    backgroundColor: "transparent",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  homeRow: {
    marginTop: 6,
    marginBottom: 6,
    paddingBottom: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  abbrCol: { width: 44 },
  abbr: {
    width: 44,
    fontFamily: METRIC_FONT,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  headCell: {
    flex: 1,
    textAlign: "center",
    fontFamily: METRIC_FONT,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.42)",
  },
  headTotal: {
    flex: 0,
    width: 40,
    color: "rgba(255,255,255,0.55)",
  },
  periodCell: {
    flex: 1,
    textAlign: "center",
    fontFamily: METRIC_FONT,
    fontSize: 15,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    color: "rgba(255,255,255,0.88)",
    transform: [{ skewX: "-6deg" }],
  },
  totalCell: {
    width: 40,
    textAlign: "center",
    fontFamily: METRIC_FONT,
    fontSize: 16,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    color: "#fff",
    transform: [{ skewX: "-6deg" }],
  },
});
