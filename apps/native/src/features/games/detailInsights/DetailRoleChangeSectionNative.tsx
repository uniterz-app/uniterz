import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type {
  DetailChipExplainPayload,
  PlayerRoleChangeSignal,
} from "../../../../../../lib/nba/detailInsights/detailInsightTypes";
import { DetailChipExplainModalNative } from "./DetailChipExplainModalNative";

const OXANIUM = "Oxanium_700Bold";

export function DetailRoleChangeSectionNative({
  signals,
  detailText,
  accent,
  title = "RECENT ROLE CHANGE",
  isJa = true,
}: {
  signals: PlayerRoleChangeSignal[];
  detailText: string | null;
  accent: string;
  title?: string;
  isJa?: boolean;
}) {
  const [explain, setExplain] = useState<DetailChipExplainPayload | null>(
    null
  );

  if (!signals.length) return null;
  return (
    <>
      <View style={styles.wrap}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.row}>
          {signals.map((s) => (
            <Pressable
              key={s.id}
              onPress={() =>
                setExplain({
                  label: s.label,
                  hintJa: s.hintJa,
                  hintEn: s.hintEn,
                })
              }
              style={[styles.chip, { borderColor: accent }]}
            >
              <Text style={[styles.chipText, { color: accent }]}>
                {s.label}
              </Text>
            </Pressable>
          ))}
        </View>
        {detailText ? <Text style={styles.detail}>{detailText}</Text> : null}
      </View>
      <DetailChipExplainModalNative
        visible={explain != null}
        payload={explain}
        isJa={isJa}
        accent={accent}
        onClose={() => setExplain(null)}
      />
    </>
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
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
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
  detail: {
    fontFamily: OXANIUM,
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.65)",
  },
});
