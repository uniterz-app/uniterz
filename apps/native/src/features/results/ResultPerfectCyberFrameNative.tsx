import { useState } from "react";
import { type LayoutChangeEvent, StyleSheet, View } from "react-native";
import ResultCyberFrameBorderSweepNative from "./ResultCyberFrameBorderSweepNative";
import ResultCyberFrameDecorNative from "./ResultCyberFrameDecorNative";
import {
  resultCyberFrameShellClipShape,
  resultCyberFrameShellContextCut,
  type ResultCyberFrameShellContext,
} from "./resultCyberFrameNativeClip";

type Props = {
  /** Web `ResultPerfectCyberFrame` の `showSweep`（Predict オーバーレイは true） */
  showSweep?: boolean;
  shellContext?: ResultCyberFrameShellContext;
};

const PERFECT_TOP_LINE = [
  "transparent",
  "rgba(255,255,255,0.95)",
  "rgba(216,180,254,0.88)",
  "transparent",
] as const;

/** Web `ResultPerfectCyberFrame` */
export default function ResultPerfectCyberFrameNative({
  showSweep = true,
  shellContext = "default",
}: Props) {
  const [size, setSize] = useState({ w: 0, h: 0 });

  function onLayout(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout;
    if (Math.abs(width - size.w) < 0.5 && Math.abs(height - size.h) < 0.5) return;
    setSize({ w: width, h: height });
  }

  const frameCut = resultCyberFrameShellContextCut(shellContext);
  const sweepClipShape = resultCyberFrameShellClipShape(shellContext);

  return (
    <View pointerEvents="none" style={styles.overlay} onLayout={onLayout}>
      {shellContext !== "predictOverlay" && size.w > 0 && size.h > 0 ? (
        <ResultCyberFrameDecorNative
          width={size.w}
          height={size.h}
          cornerColor="rgba(196,181,253,0.9)"
          topLineColors={PERFECT_TOP_LINE}
          topGlowColors={[
            "rgba(167,139,250,0.18)",
            "rgba(124,58,237,0.1)",
            "transparent",
          ]}
          shellContext={shellContext}
        />
      ) : null}

      {showSweep && shellContext !== "predictOverlay" && size.w > 0 && size.h > 0 ? (
        <ResultCyberFrameBorderSweepNative
          width={size.w}
          height={size.h}
          cut={frameCut}
          variant="perfect"
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
