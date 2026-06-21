import { useEffect, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import {
  Canvas,
  Group,
  Paint,
  Path,
  PathOp,
  Rect,
  Skia,
  SweepGradient,
  vec,
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
  chamferedRectPathD,
  insetChamferedRectPathD,
} from "../games/matchListCyberClipPath";
import {
  resultFrameBorderSweepTheme,
  type ResultFrameBorderSweepVariant,
} from "../../../../../lib/result/resultFrameBorderSweep";
import {
  RESULT_HIT_CYBER_CLIP_CUT,
  insetResultHitCyberClipPathD,
  resultHitCyberClipPathD,
} from "./resultHitCyberClipPath";

export type ResultCyberFrameClipShape = "hit" | "chamfer";

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

function outlinePathD(
  width: number,
  height: number,
  cut: number,
  clipShape: ResultCyberFrameClipShape,
  inset = 0
): string {
  if (clipShape === "chamfer") {
    return inset > 0
      ? insetChamferedRectPathD(width, height, cut, inset)
      : chamferedRectPathD(width, height, cut);
  }
  return inset > 0
    ? insetResultHitCyberClipPathD(width, height, inset, cut)
    : resultHitCyberClipPathD(width, height, cut);
}

/** Web `.result-card-border-sweep` の ring マスク（外枠 − 内側） */
function makeRingClipPath(
  width: number,
  height: number,
  cut: number,
  clipShape: ResultCyberFrameClipShape,
  ringPadding: number
): SkPath | null {
  const outerD = outlinePathD(width, height, cut, clipShape, 0);
  const innerD = outlinePathD(width, height, cut, clipShape, ringPadding);
  if (!outerD || !innerD) return null;
  const outer = Skia.Path.MakeFromSVGString(outerD);
  const inner = Skia.Path.MakeFromSVGString(innerD);
  if (!outer || !inner) return null;
  return Skia.Path.MakeFromOp(outer, inner, PathOp.Difference);
}

/**
 * Web `.result-card-border-sweep` + `__spin` — conic 回転 + リングマスク + screen。
 */
export default function ResultCyberFrameBorderSweepNative({
  width,
  height,
  cut = RESULT_HIT_CYBER_CLIP_CUT,
  variant = "perfect",
  clipShape = "hit",
  layerZIndex = 11,
  ringWidth: ringWidthProp,
}: Props) {
  const theme = resultFrameBorderSweepTheme(variant);
  const ringPadding = ringWidthProp ?? theme.paddingPx;
  const durationMs = variant === "default" ? 3800 : theme.durationMs;

  const ringPath = useMemo(
    () => makeRingClipPath(width, height, cut, clipShape, ringPadding),
    [width, height, cut, clipShape, ringPadding]
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

  const cx = width / 2;
  const cy = height / 2;
  const spinSpan = Math.max(width, height) * 2.8;

  const spinTransform = useDerivedValue(() => [
    { rotate: progress.value * Math.PI * 2 },
  ]);

  if (!ringPath || width <= 0 || height <= 0) return null;

  return (
    <View pointerEvents="none" style={[styles.wrap, { zIndex: layerZIndex }]}>
      <Canvas style={{ width, height }} pointerEvents="none">
        <Group clip={ringPath} layer={<Paint blendMode="screen" />}>
          <Group origin={vec(cx, cy)} transform={spinTransform}>
            <Rect
              x={cx - spinSpan / 2}
              y={cy - spinSpan / 2}
              width={spinSpan}
              height={spinSpan}
            >
              <SweepGradient
                c={vec(cx, cy)}
                colors={theme.colors}
                positions={theme.positions}
              />
            </Rect>
          </Group>
        </Group>
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
