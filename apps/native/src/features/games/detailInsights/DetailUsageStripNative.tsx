import { StyleSheet, Text, View } from "react-native";
import type { PlayerUsageStripCell } from "../../../../../../lib/nba/detailInsights/detailInsightTypes";
import { isPlayerDetailRankShown } from "../../../../../../lib/predict/nbaPlayerDetailHowTheyPlay";

const OXANIUM = "Oxanium_700Bold";

export function DetailUsageStripNative({
  cells,
  accent,
}: {
  cells: PlayerUsageStripCell[];
  accent: string;
}) {
  const hasData = cells.some((c) => c.display !== "—");
  if (!hasData) return null;
  return (
    <View style={[styles.grid, { borderColor: `${accent}66` }]}>
      {cells.map((cell) => (
        <View
          key={cell.key}
          style={[styles.cell, { borderColor: `${accent}26` }]}
        >
          <View style={styles.head}>
            <Text style={styles.label}>{cell.label}</Text>
            {cell.rank != null && isPlayerDetailRankShown(cell.rank) ? (
              <Text style={[styles.rank, { color: accent }]}>
                #{cell.rank}
              </Text>
            ) : null}
          </View>
          <Text style={styles.val}>{cell.display}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderWidth: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    overflow: "hidden",
  },
  cell: {
    width: "33.333%",
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  head: { flexDirection: "row", justifyContent: "space-between", gap: 4 },
  label: {
    fontFamily: OXANIUM,
    fontSize: 9,
    fontWeight: "700",
    color: "rgba(255,255,255,0.4)",
    letterSpacing: 0.5,
  },
  rank: {
    fontFamily: OXANIUM,
    fontSize: 10,
    fontWeight: "800",
  },
  val: {
    marginTop: 4,
    fontFamily: OXANIUM,
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
    fontVariant: ["tabular-nums"],
  },
});
