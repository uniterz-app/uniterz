import { useState } from "react";
import { type LayoutChangeEvent, StyleSheet, View } from "react-native";
import { resultStreakTier } from "../../../../../lib/result/resultGlass";
import { resultStreakBorderSweepVariant } from "../../../../../lib/result/resultFrameBorderSweep";
import ResultCyberFrameBorderSweepNative from "./ResultCyberFrameBorderSweepNative";
import ResultCyberFrameDecorNative from "./ResultCyberFrameDecorNative";
import { nativeStreakFrameColors } from "./resultCyberFrameNativeTokens";
import {
  resultCyberFrameShellClipShape,
  resultCyberFrameShellContextCut,
  type ResultCyberFrameShellContext,
} from "./resultCyberFrameNativeClip";

type Props = {
  activeWinStreak: unknown;
  showSweep?: boolean;
  shellContext?: ResultCyberFrameShellContext;
};

/** Web `ResultStreakCyberFrame` */
export default function ResultStreakCyberFrameNative({
  activeWinStreak,
  showSweep = true,
  shellContext = "default",
}: Props) {
  const tier = resultStreakTier(activeWinStreak);
  const [size, setSize] = useState({ w: 0, h: 0 });

  function onLayout(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout;
    if (Math.abs(width - size.w) < 0.5 && Math.abs(height - size.h) < 0.5) return;
    setSize({ w: width, h: height });
  }

  if (!tier) return null;

  const colors = nativeStreakFrameColors(tier);
  const frameCut = resultCyberFrameShellContextCut(shellContext);
  const sweepClipShape = resultCyberFrameShellClipShape(shellContext);

  return (
    <View pointerEvents="none" style={styles.overlay} onLayout={onLayout}>
      {shellContext !== "predictOverlay" && size.w > 0 && size.h > 0 ? (
        <ResultCyberFrameDecorNative
          width={size.w}
          height={size.h}
          cornerColor={colors.corner}
          topLineColors={colors.topLine}
          topGlowColors={colors.topGlow}
          shellContext={shellContext}
        />
      ) : null}

      {showSweep && shellContext !== "predictOverlay" && size.w > 0 && size.h > 0 ? (
        <ResultCyberFrameBorderSweepNative
          width={size.w}
          height={size.h}
          cut={frameCut}
          variant={resultStreakBorderSweepVariant(tier)}
          clipShape={sweepClipShape}
          layerZIndex={18}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
  },
});
