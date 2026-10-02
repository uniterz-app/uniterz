/** Web DetailInsightBlocks 相当 */
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type {
  DetailChipExplainPayload,
  DetailInsightChip,
} from "../../../../../../lib/nba/detailInsights/detailInsightTypes";
import { DetailChipExplainModalNative } from "./DetailChipExplainModalNative";

const OXANIUM = "Oxanium_700Bold";

export function DetailInsightSummaryNative({
  text,
}: {
  text: string;
}) {
  if (!text.trim()) return null;
  return <Text style={styles.summary}>{text}</Text>;
}

export function DetailIdentityChipRowNative({
  chips,
  accent,
  title,
  language = "en",
  layout = "scroll",
}: {
  chips: DetailInsightChip[];
  accent: string;
  title?: string;
  language?: string;
  /** wrap = 横並びで折り返し（ROLE用・2段想定）。既定は横スクロール1行 */
  layout?: "scroll" | "wrap";
}) {
  const [explain, setExplain] = useState<DetailChipExplainPayload | null>(
    null
  );

  if (!chips.length) return null;

  const chipEl = (chip: DetailInsightChip) => (
    <Pressable
      key={chip.id}
      onPress={() => setExplain({ label: chip.label, hint: chip.hint })}
      style={[styles.chip, { borderColor: accent }]}
    >
      <Text style={[styles.chipText, { color: accent }]}>{chip.label}</Text>
    </Pressable>
  );

  return (
    <>
      <View style={styles.wrap}>
        {title ? <Text style={styles.title}>{title}</Text> : null}
        {layout === "wrap" ? (
          <View style={styles.wrapRow}>{chips.map(chipEl)}</View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.row}
          >
            {chips.map(chipEl)}
          </ScrollView>
        )}
      </View>
      <DetailChipExplainModalNative
        visible={explain != null}
        payload={explain}
        language={language}
        accent={accent}
        onClose={() => setExplain(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  summary: {
    fontFamily: OXANIUM,
    fontSize: 13,
    lineHeight: 19,
    color: "rgba(255,255,255,0.82)",
    fontWeight: "600",
  },
  wrap: { gap: 8 },
  title: {
    fontFamily: OXANIUM,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.4,
    color: "rgba(255,255,255,0.45)",
    textTransform: "uppercase",
  },
  row: { gap: 8, paddingRight: 4, flexDirection: "row", alignItems: "center" },
  wrapRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipText: {
    fontFamily: OXANIUM,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
});
