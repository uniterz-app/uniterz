/** Web `LiveGameLineScorePanel` 相当 */
import { StyleSheet, Text, View } from "react-native";
import type { LiveGameStatsReport } from "../../../../../../lib/games/liveGameStats";
import { matchupTeamUiAccent } from "../../../../../../lib/team-colors";
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

  const homeWins = report.home.score > report.away.score;
  const awayWins = report.away.score > report.home.score;

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
        {ls.home.map((v, i) => {
          const opp = ls.away[i];
          const wins =
            v != null && opp != null && Number.isFinite(v) && Number.isFinite(opp)
              ? v > opp
              : false;
          return (
            <Text
              key={`h-${ls.periods[i]}`}
              style={[
                styles.periodCell,
                { color: wins ? homeColor : "rgba(255,255,255,0.88)" },
              ]}
            >
              {cell(v)}
            </Text>
          );
        })}
        <Text
          style={[
            styles.totalCell,
            { color: homeWins ? homeColor : "#fff" },
          ]}
        >
          {report.home.score}
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={[styles.abbr, { color: awayColor }]} numberOfLines={1}>
          {report.away.abbr}
        </Text>
        {ls.away.map((v, i) => {
          const opp = ls.home[i];
          const wins =
            v != null && opp != null && Number.isFinite(v) && Number.isFinite(opp)
              ? v > opp
              : false;
          return (
            <Text
              key={`a-${ls.periods[i]}`}
              style={[
                styles.periodCell,
                { color: wins ? awayColor : "rgba(255,255,255,0.88)" },
              ]}
            >
              {cell(v)}
            </Text>
          );
        })}
        <Text
          style={[
            styles.totalCell,
            { color: awayWins ? awayColor : "#fff" },
          ]}
        >
          {report.away.score}
        </Text>
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
    backgroundColor: "#000",
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
    width: 44,
    color: "rgba(255,255,255,0.55)",
  },
  periodCell: {
    flex: 1,
    textAlign: "center",
    fontFamily: METRIC_FONT,
    fontSize: 18,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    transform: [{ skewX: "-6deg" }],
  },
  totalCell: {
    width: 44,
    textAlign: "center",
    fontFamily: METRIC_FONT,
    fontSize: 19,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    transform: [{ skewX: "-6deg" }],
  },
});
