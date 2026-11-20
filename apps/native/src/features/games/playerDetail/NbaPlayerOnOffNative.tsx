import { StyleSheet, Text, View } from "react-native";
import { useNbaLeagueHubNative } from "../leagueHub/useNbaLeagueHubNative";
import { CYBER_TAB_CYAN } from "../../../ui/cyberSideMenuNative";
import { METRIC_FONT } from "../../rankings/rankingsUiTheme";

const POSITIVE = "#5cf0b5";
const NEGATIVE = "#FF2D78";

function netText(v: number): string {
  return `${v > 0 ? "+" : ""}${v.toFixed(1)}`;
}

function tone(v: number): string {
  if (v > 0) return POSITIVE;
  if (v < 0) return NEGATIVE;
  return "rgba(255,255,255,0.72)";
}

/** 順位ハブの選手だけ。コートにいるときといないときの得失点。 */
export default function NbaPlayerOnOffNative({
  playerId,
  isJa,
}: {
  playerId: string;
  isJa: boolean;
}) {
  const { hub } = useNbaLeagueHubNative();
  const row = hub?.players.find((p) => p.playerId === playerId)?.onOff;
  if (!row) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>ON / OFF</Text>
        <View style={styles.titleLine} />
      </View>
      <Text style={styles.hint}>
        {isJa
          ? "100 ポゼッションあたりの得失点。オンはこの選手がいる 5 人、オフは同じチームのそれ以外です。"
          : "Net rating per 100 possessions. On is lineups with this player, off is the rest of the team."}
      </Text>
      <View style={styles.cols}>
        <Cell label="ON" value={netText(row.onNet)} color={tone(row.onNet)} sub={`${row.onMin.toFixed(0)} MIN`} />
        <Cell label="OFF" value={netText(row.offNet)} color={tone(row.offNet)} sub={`${row.offMin.toFixed(0)} MIN`} />
        <Cell label="DIFF" value={netText(row.onNet - row.offNet)} color={tone(row.onNet - row.offNet)} sub="ON − OFF" />
      </View>
    </View>
  );
}

function Cell({ label, value, color, sub }: { label: string; value: string; color: string; sub: string }) {
  return (
    <View style={styles.cell}>
      <Text style={styles.cellLabel}>{label}</Text>
      <Text style={[styles.cellValue, { color }]}>{value}</Text>
      <Text style={styles.cellSub}>{sub}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 16, gap: 8 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: {
    fontFamily: METRIC_FONT,
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.6,
  },
  titleLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: "rgba(0,245,255,0.35)" },
  hint: {
    fontFamily: METRIC_FONT,
    color: "rgba(0,245,255,0.68)",
    fontSize: 11,
    lineHeight: 16,
  },
  cols: { flexDirection: "row", gap: 8 },
  cell: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.26)",
    paddingVertical: 10,
    alignItems: "center",
    gap: 2,
  },
  cellLabel: {
    fontFamily: METRIC_FONT,
    color: CYBER_TAB_CYAN,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  cellValue: {
    fontFamily: METRIC_FONT,
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    transform: [{ skewX: "-8deg" }],
  },
  cellSub: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.78)",
    fontSize: 9,
  },
});
