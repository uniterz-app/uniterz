/**
 * Web `MatchCard` + `inPredictOverlay` の `.predict-overlay-cyber-card` / grid 相当。
 */
import { type ReactNode, useMemo, useState } from "react";
import {
  type LayoutChangeEvent,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";
import {
  Canvas,
  Group,
  LinearGradient as SkiaLinearGradient,
  Rect,
  Skia,
  vec,
} from "@shopify/react-native-skia";
import {
  chamferedRectPathD,
  PREDICT_OVERLAY_CYBER_CUT,
} from "./matchListCyberClipPath";
import PredictOverlayChamferCornerFillNative from "./PredictOverlayChamferCornerFillNative";
import PredictOverlayCyberShellBorderNative from "./PredictOverlayCyberShellBorderNative";
import {
  hasPredictOverlayResultCyberFrame,
  predictOverlayShellBorderColor,
  predictOverlayShellBorderWidth,
  predictOverlayShellSweepVariant,
} from "./predictOverlayShellBorderStyle";
import { PredictOverlayCyberGridSkia } from "./PredictOverlayCyberGridSkia";
import type { ResultCardBadge } from "../../../../../lib/result/resultGlass";
import {
  isResultHitFrameBadge,
  isResultPerfectFrameBadge,
  isResultStreakFrameBadge,
} from "../../../../../lib/result/resultGlass";
import ResultHitCyberFrameNative from "../results/ResultHitCyberFrameNative";
import ResultPerfectCyberFrameNative from "../results/ResultPerfectCyberFrameNative";
import ResultStreakCyberFrameNative from "../results/ResultStreakCyberFrameNative";
import ResultCyberFrameBorderSweepNative, {
  type ResultCyberFrameClipShape,
} from "../results/ResultCyberFrameBorderSweepNative";
import { PREDICT_OVERLAY_SWEEP_RING_WIDTH } from "../results/resultCyberFrameNativeMetrics";
import {
  RESULT_HIT_CYBER_CLIP_CUT,
  resultHitCyberClipPathD,
} from "../results/resultHitCyberClipPath";

/** globals.css `.predict-overlay-cyber-card` background（168deg 近似） */
const SHELL_GRADIENT = {
  colors: ["rgba(10,14,22,0.94)", "rgba(6,9,15,0.9)", "rgba(4,6,11,0.88)"],
  locations: [0, 0.48, 1],
} as const;

const OVERLAY_SHELL = "predictOverlay" as const;

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  resultBadge?: ResultCardBadge | null;
  activeWinStreak?: number;
  /** 親の predict-overlay-cyber-form 内包時は独自シェルを出さない */
  overlayUnifiedForm?: boolean;
};

function makeSkiaPath(
  width: number,
  height: number,
  cut: number,
  clipShape: ResultCyberFrameClipShape
) {
  const d =
    clipShape === "hit"
      ? resultHitCyberClipPathD(width, height, cut)
      : chamferedRectPathD(width, height, cut);
  if (!d) return null;
  return Skia.Path.MakeFromSVGString(d);
}

export default function PredictOverlayMatchCardShellNative({
  children,
  style,
  resultBadge = null,
  activeWinStreak = 0,
  overlayUnifiedForm = false,
}: Props) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const hasResultFrame = hasPredictOverlayResultCyberFrame(resultBadge);
  /** Web: 結果バッジ時は `.result-hit-cyber-clip`、通常は `.predict-overlay-cyber-card` */
  const shellClipShape: ResultCyberFrameClipShape = hasResultFrame ? "hit" : "chamfer";
  const cut =
    shellClipShape === "hit" ? RESULT_HIT_CYBER_CLIP_CUT : PREDICT_OVERLAY_CYBER_CUT;

  const skiaPath = useMemo(
    () =>
      size.w > 0 && size.h > 0
        ? makeSkiaPath(size.w, size.h, cut, shellClipShape)
        : null,
    [size.w, size.h, cut, shellClipShape]
  );

  function onLayout(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout;
    if (Math.abs(width - size.w) < 0.5 && Math.abs(height - size.h) < 0.5) return;
    setSize({ w: width, h: height });
  }

  const hasSize = size.w > 0 && size.h > 0;
  const shellBorderColor = predictOverlayShellBorderColor(resultBadge, activeWinStreak);
  const shellBorderWidth = predictOverlayShellBorderWidth(resultBadge);
  const sweepVariant = predictOverlayShellSweepVariant(resultBadge, activeWinStreak);

  if (overlayUnifiedForm) {
    return (
      <View style={[styles.root, style]}>
        {resultBadge && isResultHitFrameBadge(resultBadge) ? (
          <ResultHitCyberFrameNative shellContext={OVERLAY_SHELL} />
        ) : null}
        {resultBadge && isResultPerfectFrameBadge(resultBadge) ? (
          <ResultPerfectCyberFrameNative shellContext={OVERLAY_SHELL} />
        ) : null}
        {resultBadge && isResultStreakFrameBadge(resultBadge) ? (
          <ResultStreakCyberFrameNative
            activeWinStreak={activeWinStreak}
            shellContext={OVERLAY_SHELL}
          />
        ) : null}
        <View style={styles.content}>{children}</View>
      </View>
    );
  }

  return (
    <View style={[styles.root, style]} onLayout={onLayout}>
      <View
        style={[
          styles.frame,
          hasSize ? { width: size.w } : styles.frameMeasuring,
        ]}
      >
        {hasSize && skiaPath ? (
          <>
            <Canvas
              style={{ position: "absolute", left: 0, top: 0, width: size.w, height: size.h }}
              pointerEvents="none"
            >
              <Group clip={skiaPath}>
                <Rect x={0} y={0} width={size.w} height={size.h}>
                  <SkiaLinearGradient
                    start={vec(size.w * 0.2, 0)}
                    end={vec(size.w * 0.75, size.h)}
                    colors={[...SHELL_GRADIENT.colors]}
                    positions={[...SHELL_GRADIENT.locations]}
                  />
                </Rect>
              </Group>
            </Canvas>
            <View
              pointerEvents="none"
              style={{ position: "absolute", left: 0, top: 0, width: size.w, height: size.h }}
            >
              <Canvas style={{ width: size.w, height: size.h }} pointerEvents="none">
                <Group clip={skiaPath}>
                  <PredictOverlayCyberGridSkia width={size.w} height={size.h} />
                </Group>
              </Canvas>
            </View>
          </>
        ) : null}

        {resultBadge && isResultHitFrameBadge(resultBadge) ? (
          <ResultHitCyberFrameNative shellContext={OVERLAY_SHELL} />
        ) : null}
        {resultBadge && isResultPerfectFrameBadge(resultBadge) ? (
          <ResultPerfectCyberFrameNative shellContext={OVERLAY_SHELL} />
        ) : null}
        {resultBadge && isResultStreakFrameBadge(resultBadge) ? (
          <ResultStreakCyberFrameNative
            activeWinStreak={activeWinStreak}
            shellContext={OVERLAY_SHELL}
          />
        ) : null}

        <View style={styles.content}>{children}</View>

        {hasSize ? (
          <PredictOverlayChamferCornerFillNative
            width={size.w}
            height={size.h}
            cut={cut}
            clipShape={shellClipShape}
          />
        ) : null}

        {hasSize && skiaPath ? (
          <PredictOverlayCyberShellBorderNative
            width={size.w}
            height={size.h}
            cut={cut}
            clipShape={shellClipShape}
            borderColor={shellBorderColor}
            borderWidth={shellBorderWidth}
            mode="border"
            layerZIndex={20}
          />
        ) : null}

        {hasSize && sweepVariant ? (
          <ResultCyberFrameBorderSweepNative
            width={size.w}
            height={size.h}
            cut={cut}
            clipShape={shellClipShape}
            variant={sweepVariant}
            layerZIndex={27}
            ringWidth={PREDICT_OVERLAY_SWEEP_RING_WIDTH}
            borderStrokeWidth={shellBorderWidth}
          />
        ) : null}

        {hasSize && skiaPath ? (
          <PredictOverlayCyberShellBorderNative
            width={size.w}
            height={size.h}
            cut={cut}
            clipShape={shellClipShape}
            mode="beam"
            layerZIndex={28}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: "relative",
    width: "100%",
    overflow: "visible",
  },
  frame: {
    position: "relative",
    minHeight: 120,
  },
  frameMeasuring: {
    minHeight: 120,
    width: "100%",
  },
  content: {
    position: "relative",
    zIndex: 2,
    flex: 1,
    minHeight: 0,
  },
});
