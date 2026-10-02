import { useRef, useState } from "react";
import { type LayoutChangeEvent, StyleSheet, View } from "react-native";
import { useScreenActiveNative } from "../../hooks/useScreenActiveNative";
import { useNearViewportNative } from "../games/ScrollVisibilityNative";
import ResultCyberFrameBorderSweepNative from "./ResultCyberFrameBorderSweepNative";
import ResultCyberFrameDecorNative from "./ResultCyberFrameDecorNative";
import {
  resultCyberFrameShellClipShape,
  resultCyberFrameShellContextCut,
  type ResultCyberFrameShellContext,
} from "./resultCyberFrameNativeClip";

type Props = {
  /** Web `ResultPerfectCyberFrame` の `showSweep`（Predict オーバーレイ等のみ true） */
  showSweep?: boolean;
  shellContext?: ResultCyberFrameShellContext;
  /** false で Skia デコール／スイープを外す */
  effectsActive?: boolean;
};

const PERFECT_TOP_LINE = [
  "transparent",
  "rgba(255,255,255,0.95)",
  "rgba(216,180,254,0.88)",
  "transparent",
] as const;

/** Web `ResultPerfectCyberFrame` */
export default function ResultPerfectCyberFrameNative({
  /** 一覧は GPU 負荷のため false（Predict オーバーレイ等のみ true） */
  showSweep = false,
  shellContext = "default",
  effectsActive = true,
}: Props) {
  const hostRef = useRef<View>(null);
  const screenActive = useScreenActiveNative();
  const { near, onLayout: onNearLayout } = useNearViewportNative(hostRef, true);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const showFx = effectsActive && screenActive && near;

  function onLayout(e: LayoutChangeEvent) {
    onNearLayout();
    const { width, height } = e.nativeEvent.layout;
    if (Math.abs(width - size.w) < 0.5 && Math.abs(height - size.h) < 0.5) return;
    setSize({ w: width, h: height });
  }

  const frameCut = resultCyberFrameShellContextCut(shellContext);
  const sweepClipShape = resultCyberFrameShellClipShape(shellContext);

  return (
    <View
      ref={hostRef}
      collapsable={false}
      pointerEvents="none"
      style={styles.overlay}
      onLayout={onLayout}
    >
      {showFx && size.w > 0 && size.h > 0 ? (
        <ResultCyberFrameDecorNative
          width={size.w}
          height={size.h}
          cornerColor="rgba(237,233,254,0.96)"
          topLineColors={PERFECT_TOP_LINE}
          topGlowColors={[
            "rgba(167,139,250,0.26)",
            "rgba(124,58,237,0.14)",
            "transparent",
          ]}
          shellContext={shellContext}
        />
      ) : null}

      {showFx &&
      showSweep &&
      shellContext !== "predictOverlay" &&
      size.w > 0 &&
      size.h > 0 ? (
        <ResultCyberFrameBorderSweepNative
          width={size.w}
          height={size.h}
          cut={frameCut}
          variant="perfect"
          clipShape={sweepClipShape}
          layerZIndex={18}
          active={showFx}
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
