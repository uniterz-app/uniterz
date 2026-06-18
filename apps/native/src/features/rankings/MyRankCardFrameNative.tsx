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
  style,
}: {
  children: ReactNode;
  tone?: MyRankCardFrameTone;
  style?: ViewStyle;
}) {
  const accent = myRankCardAccent(tone);
  const corner = accent.primary;

  return (
    <View style={[styles.frame, style]}>
      <LinearGradient
        pointerEvents="none"
        colors={["rgba(14,16,22,0.98)", "rgba(9,11,16,0.99)", "rgba(6,7,10,1)"]}
        locations={[0, 0.52, 1]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View pointerEvents="none" style={[styles.edge, { borderColor: accent.hairline }]} />
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
