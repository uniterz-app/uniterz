import { Pressable, StyleSheet, Text, View } from "react-native";
import { useNbaLeagueHubNative } from "../leagueHub/useNbaLeagueHubNative";
import { playerNameStyle } from "../leagueHub/leagueHubUiNative";
import { METRIC_FONT } from "../../rankings/rankingsUiTheme";

const POSITIVE = "#5cf0b5";
const NEGATIVE = "#FF2D78";

function signed(v: number): string {
  return `${v > 0 ? "+" : ""}${v.toFixed(1)}`;
}

function tone(v: number): string {
  if (v > 0) return POSITIVE;
  if (v < 0) return NEGATIVE;
  return "rgba(255,255,255,0.72)";
}

/** 順位ハブにいるロスターの、オンとオフの得失点。差の大きい順。 */
export default function NbaTeamOnOffNative({
  teamId,
  isJa,
  onSelectPlayer,
}: {
  teamId: string;
  isJa: boolean;
  onSelectPlayer?: (playerId: string) => void;
}) {
  const { hub } = useNbaLeagueHubNative();
  const rows = (hub?.players ?? [])
    .filter((player) => player.teamId === teamId && player.onOff)
    .map((player) => ({
      playerId: player.playerId,
      name: player.name,
      onNet: player.onOff!.onNet,
      offNet: player.onOff!.offNet,
      diff: player.onOff!.onNet - player.onOff!.offNet,
    }))
    .sort((a, b) => b.diff - a.diff);
  if (rows.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>ON / OFF</Text>
        <View style={styles.titleLine} />
      </View>
      <Text style={styles.hint}>
        {isJa
          ? "いるときといないときの、100 ポゼッションあたりの得失点です。差の大きい順。"
          : "Net rating per 100 possessions with the player on and off the floor, by the gap."}
      </Text>
      <View style={styles.head}>
        <Text style={styles.headName}> </Text>
        <Text style={styles.headStat}>ON</Text>
        <Text style={styles.headStat}>OFF</Text>
        <Text style={styles.headStat}>DIFF</Text>
      </View>
      {rows.map((row) => (
        <Pressable
          key={row.playerId}
          style={styles.row}
          onPress={onSelectPlayer ? () => onSelectPlayer(row.playerId) : undefined}
        >
          <Text style={[styles.name, playerNameStyle]} numberOfLines={1}>
            {row.name}
          </Text>
          <Text style={[styles.stat, { color: tone(row.onNet) }]}>{signed(row.onNet)}</Text>
          <Text style={[styles.stat, { color: tone(row.offNet) }]}>{signed(row.offNet)}</Text>
          <Text style={[styles.stat, { color: tone(row.diff) }]}>{signed(row.diff)}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
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
  head: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  headName: { flex: 1 },
  headStat: {
    width: 52,
    textAlign: "right",
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.78)",
    fontSize: 10,
    letterSpacing: 0.4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 7,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  name: { flex: 1, color: "#fff", fontSize: 13 },
  stat: {
    width: 52,
    textAlign: "right",
    fontFamily: METRIC_FONT,
    fontSize: 14,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
});
