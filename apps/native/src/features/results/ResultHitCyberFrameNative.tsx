import { useState } from "react";
import { type LayoutChangeEvent, StyleSheet, View } from "react-native";
import ResultCyberFrameDecorNative from "./ResultCyberFrameDecorNative";
import type { ResultCyberFrameShellContext } from "./resultCyberFrameNativeClip";

type Props = {
  shellContext?: ResultCyberFrameShellContext;
};

const HIT_TOP_LINE = [
  "transparent",
  "rgba(255,251,235,0.95)",
  "rgba(253,224,71,0.98)",
  "transparent",
] as const;

const HIT_TOP_LINE_LOCATIONS = [0, 0.42, 0.58, 1] as const;

/** Web `ResultHitCyberFrame` 相当 — コア線はシェル側、ここは角・上部ハイライト */
export default function ResultHitCyberFrameNative({
  shellContext = "default",
}: Props) {
  const [size, setSize] = useState({ w: 0, h: 0 });

  function onLayout(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout;
    if (Math.abs(width - size.w) < 0.5 && Math.abs(height - size.h) < 0.5) return;
    setSize({ w: width, h: height });
  }

  return (
    <View pointerEvents="none" style={styles.overlay} onLayout={onLayout}>
      {size.w > 0 && size.h > 0 ? (
        <ResultCyberFrameDecorNative
          width={size.w}
          height={size.h}
          cornerColor="rgba(254,243,199,0.96)"
          topLineColors={HIT_TOP_LINE}
          topLineLocations={HIT_TOP_LINE_LOCATIONS}
          topGlowColors={[
            "rgba(253,224,71,0.26)",
            "rgba(251,191,36,0.14)",
            "transparent",
          ]}
          shellContext={shellContext}
          glowCorners
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 4,
  },
});
