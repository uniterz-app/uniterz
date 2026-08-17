/**
 * Web `.profile-edit-kinetik-unit-vault__disc` 相当 — U 金貨ディスク。
 */
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { fonts } from "../../theme/tokens";

type Props = {
  /** 外側ディスク径（既定 36） */
  size?: number;
};

export default function UnitCoinDiscNative({ size = 36 }: Props) {
  const inner = Math.round(size * (20 / 28));
  const uSize = Math.max(10, Math.round(size * 0.36));

  return (
    <View
      style={[
        styles.disc,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <LinearGradient
        colors={["#f9d576", "#b8860b", "#f6c344", "#8a6410"]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View
        pointerEvents="none"
        style={[
          styles.sheen,
          { height: size * 1.4, top: -size * 0.2 },
        ]}
      />
      <View
        style={[
          styles.inner,
          {
            width: inner,
            height: inner,
            borderRadius: inner / 2,
          },
        ]}
      >
        <LinearGradient
          colors={["#ffedb0", "#d9a125"]}
          start={{ x: 0.3, y: 0.2 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <Text style={[styles.u, { fontSize: uSize, lineHeight: uSize + 2 }]}>
          U
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  disc: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: "#f6c344",
    shadowOpacity: 0.55,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  sheen: {
    position: "absolute",
    zIndex: 2,
    width: "42%",
    left: 0,
    backgroundColor: "rgba(255,248,220,0.35)",
    transform: [{ translateX: -8 }, { rotate: "18deg" }],
  },
  inner: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    zIndex: 1,
  },
  u: {
    fontFamily: fonts.metricExtra,
    fontWeight: "800",
    color: "#241902",
    zIndex: 1,
  },
});
