/**
 * 結果サイバー枠の角飾り・上部ライン・ティント（hit-clip でマスク）
 */
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import {
  Canvas,
  Group,
  LinearGradient as SkiaLinearGradient,
  Path,
  Rect,
  Skia,
  vec,
} from "@shopify/react-native-skia";
import {
  resultCyberFrameGlowClipPathD,
  type ResultCyberFrameShellContext,
} from "./resultCyberFrameNativeClip";
import { resultHitCyberCornerAccentPathsD } from "./resultHitCyberClipPath";
import {
  RESULT_CYBER_FRAME_CORNER_STROKE_WIDTH,
} from "./resultCyberFrameNativeMetrics";

type Props = {
  width: number;
  height: number;
  cornerColor: string;
  topLineColors: readonly string[];
  topLineLocations?: readonly number[];
  topGlowColors: readonly string[];
  topGlowLocations?: readonly number[];
  shellContext?: ResultCyberFrameShellContext;
};

export default function ResultCyberFrameDecorNative({
  width,
  height,
  cornerColor,
  topLineColors,
  topLineLocations = [0, 0.38, 0.58, 1],
  topGlowColors,
  topGlowLocations = [0, 0.42, 0.7],
  shellContext = "default",
}: Props) {
  const clipPath = useMemo(() => {
    if (width <= 0 || height <= 0) return null;
    const d = resultCyberFrameGlowClipPathD(width, height, shellContext);
    if (!d) return null;
    return Skia.Path.MakeFromSVGString(d);
  }, [width, height, shellContext]);

  const cornerPaths = useMemo(() => {
    if (width <= 0 || height <= 0) return [];
    return resultHitCyberCornerAccentPathsD(width, height)
      .map((d) => Skia.Path.MakeFromSVGString(d))
      .filter((p): p is NonNullable<typeof p> => p != null);
  }, [width, height]);

  if (!clipPath || width <= 0 || height <= 0) return null;

  const glowHeight = height * 0.42;
  const topLineLeft = 16;
  const topLineWidth = Math.max(0, width - 32);

  return (
    <View pointerEvents="none" style={[styles.layer, { width, height }]}>
      <Canvas style={{ width, height }} pointerEvents="none">
        <Group clip={clipPath}>
          <Rect x={0} y={0} width={width} height={glowHeight}>
            <SkiaLinearGradient
              start={vec(width * 0.5, 0)}
              end={vec(width * 0.5, glowHeight)}
              colors={[...topGlowColors]}
              positions={[...topGlowLocations]}
            />
          </Rect>

          {topLineWidth > 0 ? (
            <Rect
              x={topLineLeft}
              y={0}
              width={topLineWidth}
              height={RESULT_CYBER_FRAME_CORNER_STROKE_WIDTH}
            >
              <SkiaLinearGradient
                start={vec(topLineLeft, 1)}
                end={vec(topLineLeft + topLineWidth, 1)}
                colors={[...topLineColors]}
                positions={[...topLineLocations]}
              />
            </Rect>
          ) : null}

          {cornerPaths.map((path, index) => (
            <Path
              key={`corner-${index}`}
              path={path}
              style="stroke"
              strokeWidth={RESULT_CYBER_FRAME_CORNER_STROKE_WIDTH}
              strokeJoin="miter"
              strokeCap="square"
              color={cornerColor}
            />
          ))}
        </Group>
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: "absolute",
    left: 0,
    top: 0,
    zIndex: 12,
  },
});
