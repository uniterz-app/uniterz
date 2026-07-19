import type { ReactNode } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View, type ViewStyle } from "react-native";
import {
  myRankCardAccent,
  type MyRankCardAccent,
} from "../../../../../lib/rankings/myRankCardFocus";
import {
  resolveMyRankCardFrameTone,
  type MyRankCardFrameTone,
} from "../../../../../app/component/rankings/MyRankCardFrame";

export function resolveMyRankFrameTone(
  rankDeltaPlaces?: number | null
): MyRankCardFrameTone {
  return resolveMyRankCardFrameTone(rankDeltaPlaces);
}

export function MyRankCardFrameNative({
  children,
  tone = "up",
  proSpec = false,
  style,
}: {
  children: ReactNode;
  tone?: MyRankCardFrameTone;
  /** Web `proSpec` — Pro 枠（ゴールド寄りコーナー） */
  proSpec?: boolean;
  style?: ViewStyle;
}) {
  const accent = myRankCardAccent(tone);
  const corner = proSpec ? "#f5d78e" : accent.primary;

  return (
    <View
      style={[
        styles.frame,
        proSpec ? styles.frameProSpec : null,
        style,
      ]}
    >
      <LinearGradient
        pointerEvents="none"
        colors={
          proSpec
            ? ["rgba(22,18,10,0.98)", "rgba(12,10,8,0.99)", "rgba(8,7,5,1)"]
            : ["rgba(14,16,22,0.98)", "rgba(9,11,16,0.99)", "rgba(6,7,10,1)"]
        }
        locations={[0, 0.52, 1]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      {proSpec ? (
        <View pointerEvents="none" style={styles.proAmbient} />
      ) : null}
      <View
        pointerEvents="none"
        style={[
          styles.edge,
          { borderColor: proSpec ? "rgba(245,215,142,0.35)" : accent.hairline },
        ]}
      />
      <View pointerEvents="none" style={[styles.cornerTl, { borderColor: corner }]}>
        <Text style={[styles.cornerPlus, { color: corner }]}>+</Text>
      </View>
      <View pointerEvents="none" style={[styles.cornerBl, { borderColor: corner }]}>
        <Text style={[styles.cornerPlusBl, { color: corner }]}>+</Text>
      </View>
      <View pointerEvents="none" style={[styles.cornerBr, { borderColor: corner }]} />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    position: "relative",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  frameProSpec: {
    borderColor: "rgba(245,215,142,0.28)",
  },
  proAmbient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(245,215,142,0.04)",
  },
  edge: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 0,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    opacity: 0.9,
  },
  cornerTl: {
    position: "absolute",
    left: 0,
    top: 0,
    width: 14,
    height: 14,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    zIndex: 2,
  },
  cornerPlus: {
    position: "absolute",
    left: 2,
    top: -1,
    fontSize: 8,
    fontWeight: "700",
    fontFamily: "Menlo",
  },
  cornerBl: {
    position: "absolute",
    left: 0,
    bottom: 0,
    width: 14,
    height: 14,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    zIndex: 2,
  },
  cornerPlusBl: {
    position: "absolute",
    left: 2,
    bottom: 0,
    fontSize: 8,
    fontWeight: "700",
    fontFamily: "Menlo",
  },
  cornerBr: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 18,
    height: 18,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    zIndex: 2,
  },
  content: {
    position: "relative",
    zIndex: 3,
  },
});

export type { MyRankCardAccent };
