import { StyleSheet, Text, View } from "react-native";
import type { DetailTrendDelta } from "../../../../../../lib/nba/detailInsights/detailInsightTypes";
import {
  formatTeamTrendDelta,
  isTrendImproved,
} from "../../../../../../lib/nba/detailInsights/buildTeamDetailInsights";

const OXANIUM = "Oxanium_700Bold";
const POSITIVE = "#5FE1A8";
const NEGATIVE = "#FF6B6B";

export function DetailTrendTableNative({
  trends,
}: {
  trends: DetailTrendDelta[];
}) {
  if (!trends.length) return null;
  return (
    <View style={styles.wrap}>
      {trends.map((row) => {
        const improved = isTrendImproved(row);
        return (
          <View key={row.id} style={styles.row}>
            <Text style={styles.label}>{row.label}</Text>
            <Text style={styles.mid} numberOfLines={1}>
              {row.seasonDisplay} → {row.last10Display}
            </Text>
            <Text
              style={[
                styles.delta,
                { color: improved ? POSITIVE : NEGATIVE },
              ]}
            >
              {formatTeamTrendDelta(row)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.12)",
    gap: 6,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  label: {
    width: 36,
    fontFamily: OXANIUM,
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.45)",
  },
  mid: {
    flex: 1,
    fontFamily: OXANIUM,
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.75)",
    fontVariant: ["tabular-nums"],
  },
  delta: {
    fontFamily: OXANIUM,
    fontSize: 11,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
});
