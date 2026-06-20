import { useState } from "react";
import { type LayoutChangeEvent, StyleSheet, View } from "react-native";
import ResultCyberFrameDecorNative from "./ResultCyberFrameDecorNative";
import type { ResultCyberFrameShellContext } from "./resultCyberFrameNativeClip";

type Props = {
  shellContext?: ResultCyberFrameShellContext;
};

const HIT_TOP_LINE = [
  "transparent",
  "rgba(253,224,71,0.92)",
  "rgba(253,224,71,0.92)",
  "transparent",
] as const;

const HIT_TOP_LINE_LOCATIONS = [0, 0.42, 0.58, 1] as const;

/** Web `ResultHitCyberFrame`（一覧は showSweep=false） */
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
      {shellContext !== "predictOverlay" && size.w > 0 && size.h > 0 ? (
        <ResultCyberFrameDecorNative
          width={size.w}
          height={size.h}
          cornerColor="rgba(253,224,71,0.88)"
          topLineColors={HIT_TOP_LINE}
          topLineLocations={HIT_TOP_LINE_LOCATIONS}
          topGlowColors={[
            "rgba(252,211,77,0.18)",
            "rgba(251,191,36,0.09)",
            "transparent",
          ]}
          shellContext={shellContext}
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
