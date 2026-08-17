/**
 * Web `MyRankCardFrame` 相当 — Free / Pro 線枠。マッチカードと同じパス描画。塗りは透明。
 */
import type { ReactNode } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import {
  myRankCardAccent,
  resolveMyRankCardFrameTone,
  type MyRankCardFrameTone,
} from "../../../../../lib/rankings/myRankCardFocus";
import MatchListLineFrameNative from "../games/MatchListLineFrameNative";

export function resolveMyRankFrameTone(
  rankDeltaPlaces?: number | null
): MyRankCardFrameTone {
  return resolveMyRankCardFrameTone(rankDeltaPlaces);
}

const PRO_GOLD = "#E8C66A";

function linePaint(proSpec: boolean, tone: MyRankCardFrameTone) {
  if (proSpec) {
    return { color: PRO_GOLD, glow: "rgba(232,198,106,0.32)" };
  }
  const accent = myRankCardAccent(tone);
  return { color: accent.primary, glow: accent.dim };
}

export function MyRankCardFrameNative({
  children,
  tone = "up",
  proSpec = false,
  hideLeftEdge = false,
  animateDraw = true,
  drawKey,
  style,
}: {
  children: ReactNode;
  tone?: MyRankCardFrameTone;
  /** Web `proSpec` — 金の連続枠（塗りは透明） */
  proSpec?: boolean;
  /** Free — 左端アクセント色を出さない（線枠では未使用） */
  hideLeftEdge?: boolean;
  /** マッチカードと同じパス描画 */
  animateDraw?: boolean;
  /** 指標切替などで描画をやり直すキー */
  drawKey?: string;
  style?: ViewStyle;
}) {
  void hideLeftEdge;
  const reduced = useReducedMotion() ?? false;
  const paint = linePaint(proSpec, tone);

  return (
    <View style={[styles.frame, style]}>
      <MatchListLineFrameNative
        key={drawKey ?? "my-rank-frame"}
        flush
        closedTop
        fadeContent
        animateDraw={animateDraw && !reduced}
        paint={paint}
      >
        {proSpec ? null : (
          <View pointerEvents="none" style={styles.freeGrid} />
        )}
        <View style={styles.content}>{children}</View>
      </MatchListLineFrameNative>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    position: "relative",
    overflow: "visible",
    borderRadius: 0,
    backgroundColor: "transparent",
  },
  freeGrid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.2,
    backgroundColor: "transparent",
    zIndex: 0,
  },
  content: {
    position: "relative",
    zIndex: 4,
  },
});
