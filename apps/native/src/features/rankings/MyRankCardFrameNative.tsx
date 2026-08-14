/**
 * Web `MyRankCardFrame` 相当 — Free（シンプル枠）/ Pro（金の連続枠・中黒）。
 */
import type { ReactNode } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { myRankCardAccent } from "../../../../../lib/rankings/myRankCardFocus";
import {
  resolveMyRankCardFrameTone,
  type MyRankCardFrameTone,
} from "../../../../../app/component/rankings/MyRankCardFrame";

export function resolveMyRankFrameTone(
  rankDeltaPlaces?: number | null
): MyRankCardFrameTone {
  return resolveMyRankCardFrameTone(rankDeltaPlaces);
}

const PRO_GOLD = "#E8C66A";

export function MyRankCardFrameNative({
  children,
  tone = "up",
  proSpec = false,
  hideLeftEdge = false,
  style,
}: {
  children: ReactNode;
  tone?: MyRankCardFrameTone;
  /** Web `proSpec` — 金の連続枠 + 黒塗り */
  proSpec?: boolean;
  /** Free — 左端アクセント色を出さない */
  hideLeftEdge?: boolean;
  style?: ViewStyle;
}) {
  const accent = myRankCardAccent(tone);
  const edgeColor = accent.hairline;

  return (
    <View
      style={[
        styles.frame,
        proSpec ? styles.frameProSpec : styles.frameFree,
        style,
      ]}
    >
      {proSpec ? null : <View pointerEvents="none" style={styles.freeGrid} />}
      {proSpec ? null : (
        <View
          pointerEvents="none"
          style={[
            hideLeftEdge ? styles.edgeNoLeft : styles.edge,
            {
              borderTopColor: edgeColor,
              borderRightColor: edgeColor,
              borderBottomColor: edgeColor,
              ...(hideLeftEdge
                ? { borderLeftColor: "transparent" }
                : { borderLeftColor: edgeColor }),
            },
          ]}
        />
      )}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 0,
    borderWidth: 1,
  },
  frameFree: {
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#090b10",
  },
  frameProSpec: {
    borderColor: PRO_GOLD,
    backgroundColor: "#000",
  },
  freeGrid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.2,
    backgroundColor: "transparent",
  },
  edge: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
  },
  edgeNoLeft: {
    ...StyleSheet.absoluteFillObject,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderLeftWidth: 0,
  },
  content: {
    position: "relative",
    zIndex: 4,
  },
});
