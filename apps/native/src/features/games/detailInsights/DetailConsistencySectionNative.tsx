import { StyleSheet, Text, View } from "react-native";
import type { PlayerConsistencyInsight } from "../../../../../../lib/nba/detailInsights/detailInsightTypes";
import { volatilityLabel } from "../../../../../../lib/nba/detailInsights/buildPlayerDetailInsights";

const OXANIUM = "Oxanium_700Bold";

export function DetailConsistencySectionNative({
  data,
  accent,
}: {
  data: PlayerConsistencyInsight;
  accent: string;
}) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>CONSISTENCY</Text>
      <View style={[styles.card, { borderColor: `${accent}66` }]}>
        {data.milestones.map((m) => (
          <View key={m.label} style={styles.row}>
            <Text style={styles.label}>{m.label}</Text>
            <Text style={styles.val}>
              {m.count}/{m.games} ({m.pct}%)
            </Text>
          </View>
        ))}
        <View style={[styles.row, styles.topBorder]}>
          <Text style={styles.label}>L10 PTS</Text>
          <Text style={styles.val}>
            {data.last10PtsMin}–{data.last10PtsMax} ·{" "}
            {volatilityLabel(data.volatility)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  title: {
    fontFamily: OXANIUM,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.4,
    color: "rgba(255,255,255,0.45)",
    textTransform: "uppercase",
  },
  card: {
    borderWidth: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  topBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.1)",
    paddingTop: 6,
    marginTop: 2,
  },
  label: {
    fontFamily: OXANIUM,
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.45)",
  },
  val: {
    fontFamily: OXANIUM,
    fontSize: 11,
    fontWeight: "800",
    color: "rgba(255,255,255,0.85)",
    fontVariant: ["tabular-nums"],
  },
});
