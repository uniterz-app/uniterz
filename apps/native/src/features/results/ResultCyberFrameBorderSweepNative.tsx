import { useEffect, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import {
  Canvas,
  Group,
  Paint,
  Path,
  Skia,
  type SkPath,
} from "@shopify/react-native-skia";
import {
  cancelAnimation,
  Easing,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import {
  resultFrameBorderSweepTheme,
  type ResultFrameBorderSweepVariant,
} from "../../../../../lib/result/resultFrameBorderSweep";
import {
  insetChamferedRectPathD,
} from "../games/matchListCyberClipPath";
import {
  RESULT_HIT_CYBER_CLIP_CUT,
  insetResultHitCyberClipPathD,
} from "./resultHitCyberClipPath";
import {
  RESULT_CYBER_FRAME_SWEEP_PADDING,
  RESULT_CYBER_FRAME_STROKE_WIDTH,
} from "./resultCyberFrameNativeMetrics";

export type ResultCyberFrameClipShape = "hit" | "chamfer";

/** 枠周長に対する走査光の弧長（0–1）— Web conic の狭いピーク相当 */
const SWEEP_ARC = 0.085;

type Props = {
  width: number;
  height: number;
  cut?: number;
  variant?: ResultFrameBorderSweepVariant;
  clipShape?: ResultCyberFrameClipShape;
  layerZIndex?: number;
  ringWidth?: number;
  borderStrokeWidth?: number;
};

type SweepArcProps = {
  borderPath: SkPath;
  ringWidth: number;
  progress: ReturnType<typeof useSharedValue<number>>;
  glowColor: string;
  coreColor: string;
  haloColor: string;
};

/** 静的枠 stroke の中心線 */
function makeBorderCenterlinePath(
  width: number,
  height: number,
  cut: number,
  clipShape: ResultCyberFrameClipShape,
  borderStrokeWidth: number
): SkPath | null {
  const inset = Math.max(borderStrokeWidth / 2, 0.5);
  const d =
    clipShape === "chamfer"
      ? insetChamferedRectPathD(width, height, cut, inset)
      : insetResultHitCyberClipPathD(width, height, inset, cut);
  if (!d) return null;
  return Skia.Path.MakeFromSVGString(d);
}

function glowTintForVariant(variant: ResultFrameBorderSweepVariant): string {
  if (variant === "streakGold") return "rgba(251,191,36,0.55)";
  if (variant === "streakPlatinum") return "rgba(34,211,238,0.48)";
  if (variant === "streakSilver") return "rgba(226,232,240,0.42)";
  if (variant === "upset") return "rgba(248,113,113,0.4)";
  return "rgba(216,180,254,0.38)";
}

/** 閉路パス上を走るハイライト（Path trim — Skia × Reanimated で確実に動く） */
function SweepArcAlongBorder({
  borderPath,
  ringWidth,
  progress,
  glowColor,
  coreColor,
  haloColor,
}: SweepArcProps) {
  const sweepStart = useDerivedValue(() => progress.value);
  const sweepEnd = useDerivedValue(() => {
    const end = progress.value + SWEEP_ARC;
    return end > 1 ? 1 : end;
  });
  const wrapEnd = useDerivedValue(() => {
    const end = progress.value + SWEEP_ARC;
    return end > 1 ? end - 1 : 0;
  });

  const strokeBase = {
    style: "stroke" as const,
    strokeCap: "butt" as const,
    strokeJoin: "miter" as const,
  };

  return (
    <Group layer={<Paint blendMode="screen" />}>
      {/* 外側 halo */}
      <Path
        path={borderPath}
        {...strokeBase}
        strokeWidth={ringWidth + 8}
        start={sweepStart}
        end={sweepEnd}
        color={haloColor}
        opacity={0.35}
      />
      <Path
        path={borderPath}
        {...strokeBase}
        strokeWidth={ringWidth + 8}
        start={0}
        end={wrapEnd}
        color={haloColor}
        opacity={0.35}
      />
      {/* ティア色グロー */}
      <Path
        path={borderPath}
        {...strokeBase}
        strokeWidth={ringWidth + 3}
        start={sweepStart}
        end={sweepEnd}
        color={glowColor}
        opacity={0.55}
      />
      <Path
        path={borderPath}
        {...strokeBase}
        strokeWidth={ringWidth + 3}
        start={0}
        end={wrapEnd}
        color={glowColor}
        opacity={0.55}
      />
      {/* コア白 */}
      <Path
        path={borderPath}
        {...strokeBase}
        strokeWidth={ringWidth}
        start={sweepStart}
        end={sweepEnd}
        color={coreColor}
      />
      <Path
        path={borderPath}
        {...strokeBase}
        strokeWidth={ringWidth}
        start={0}
        end={wrapEnd}
        color={coreColor}
      />
    </Group>
  );
}

/**
 * Web `.result-card-border-sweep` — 枠中心線に沿った走査光。
 */
export default function ResultCyberFrameBorderSweepNative({
  width,
  height,
  cut = RESULT_HIT_CYBER_CLIP_CUT,
  variant = "perfect",
  clipShape = "hit",
  layerZIndex = 11,
  ringWidth: ringWidthProp,
  borderStrokeWidth = RESULT_CYBER_FRAME_STROKE_WIDTH,
}: Props) {
  const theme = resultFrameBorderSweepTheme(variant);
  const ringWidth = ringWidthProp ?? RESULT_CYBER_FRAME_SWEEP_PADDING;
  const durationMs = variant === "default" ? 3800 : theme.durationMs;

  const borderPath = useMemo(
    () =>
      makeBorderCenterlinePath(
        width,
        height,
        cut,
        clipShape,
        borderStrokeWidth
      ),
    [width, height, cut, clipShape, borderStrokeWidth]
  );

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withRepeat(
      withTiming(1, { duration: durationMs, easing: Easing.linear }),
      -1,
      false
    );
    return () => {
      cancelAnimation(progress);
    };
  }, [durationMs, progress]);

  const coreColor = "#ffffff";
  const glowColor = glowTintForVariant(variant);
  const haloColor = "rgba(255,255,255,0.45)";

  if (!borderPath || width <= 0 || height <= 0) return null;

  return (
    <View pointerEvents="none" style={[styles.wrap, { zIndex: layerZIndex }]}>
      <Canvas style={{ width, height }} pointerEvents="none">
        <SweepArcAlongBorder
          borderPath={borderPath}
          ringWidth={ringWidth}
          progress={progress}
          glowColor={glowColor}
          coreColor={coreColor}
          haloColor={haloColor}
        />
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    overflow: "visible",
  },
});
