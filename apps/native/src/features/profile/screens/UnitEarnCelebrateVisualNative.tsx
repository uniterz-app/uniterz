/**
 * Web `UnitEarnCelebrateVisual` 相当
 */
import { StyleSheet, Text, View } from "react-native";

const GOLD = "#f6c344";

export function UnitEarnVaultCoinNative({
  size = 56,
}: {
  size?: number;
}) {
  const inner = Math.round(size * 0.72);
  return (
    <View style={[styles.coinOuter, { width: size, height: size, borderRadius: size / 2 }]}>
      <View
        style={[
          styles.coinInner,
          {
            width: inner,
            height: inner,
            borderRadius: inner / 2,
          },
        ]}
      >
        <Text style={[styles.coinU, { fontSize: Math.max(11, size * 0.28) }]}>U</Text>
      </View>
    </View>
  );
}

export function UnitEarnFlyChipNative({ label }: { label: string }) {
  return (
    <View style={styles.chip}>
      <UnitEarnVaultCoinNative size={26} />
      <Text style={styles.chipLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  coinOuter: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: GOLD,
    shadowColor: GOLD,
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  coinInner: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e8ad2a",
  },
  coinU: {
    fontWeight: "800",
    color: "#241902",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.25)",
    backgroundColor: "rgba(8,12,18,0.92)",
    paddingHorizontal: 8,
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
  },
  chipLabel: {
    fontSize: 17,
    fontWeight: "800",
    color: "#ffe9a8",
    fontVariant: ["tabular-nums"],
  },
});
