import { StyleSheet, Text, View } from "react-native";
import type { PlayerConsistencyInsight } from "../../../../../../lib/nba/detailInsights/detailInsightTypes";
import { volatilityLabel } from "../../../../../../lib/nba/detailInsights/buildPlayerDetailInsights";
import { DETAIL_CONSISTENCY_HINT } from "../../../../../../lib/nba/detailInsights/detailConsistencyCopy";
import { L, resolveLocalizedLang } from "../../../../../../lib/i18n/localize";

const OXANIUM = "Oxanium_700Bold";
const OXANIUM_SEMI = "Oxanium_600SemiBold";
const SKEW = { transform: [{ skewX: "-6deg" as const }] };

export function DetailConsistencySectionNative({
  data,
  accent,
  language,
}: {
  data: PlayerConsistencyInsight;
  accent: string;
  language?: string;
}) {
  const lang = resolveLocalizedLang(language);
  return (
    <View style={styles.wrap}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>CONSISTENCY</Text>
        <Text style={styles.hint}>{L(lang, DETAIL_CONSISTENCY_HINT)}</Text>
      </View>
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
            LOW {data.last10PtsMin} · HIGH {data.last10PtsMax} ·{" "}
            {volatilityLabel(data.volatility)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  titleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "baseline",
    columnGap: 8,
    rowGap: 2,
  },
  title: {
    fontFamily: OXANIUM,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: "rgba(255,255,255,0.7)",
    textTransform: "uppercase",
  },
  hint: {
    flexGrow: 1,
    flexShrink: 1,
    fontFamily: OXANIUM_SEMI,
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 15,
    color: "rgba(255,255,255,0.4)",
  },
  card: {
    borderWidth: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  topBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.1)",
    paddingTop: 8,
    marginTop: 2,
  },
  label: {
    fontFamily: OXANIUM,
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(255,255,255,0.5)",
    ...SKEW,
  },
  val: {
    fontFamily: OXANIUM,
    fontSize: 14,
    fontWeight: "800",
    color: "rgba(255,255,255,0.9)",
    fontVariant: ["tabular-nums"],
    ...SKEW,
  },
});
