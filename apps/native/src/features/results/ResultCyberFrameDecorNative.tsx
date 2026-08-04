/**
 * 結果サイバー枠の上部ライン・ティント（四隅 chamfer でマスク）。
 * 左上・右下の直角角飾りは出さない（シェル枠リングが外形を担う）。
 */
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import {
  Canvas,
  Group,
  LinearGradient as SkiaLinearGradient,
  Rect,
  Skia,
  vec,
} from "@shopify/react-native-skia";
import {
  resultCyberFrameGlowClipPathD,
  resultCyberFrameShellContextCut,
  type ResultCyberFrameShellContext,
} from "./resultCyberFrameNativeClip";
import {
  RESULT_CYBER_FRAME_CORNER_STROKE_WIDTH,
} from "./resultCyberFrameNativeMetrics";

/** 上部グローが Canvas 端で切れない余白 */
const DECOR_BLOOM_PAD = 8;

type Props = {
  width: number;
  height: number;
  /** 互換用（角飾りは描かない） */
  cornerColor: string;
  topLineColors: readonly string[];
  topLineLocations?: readonly number[];
  topGlowColors: readonly string[];
  topGlowLocations?: readonly number[];
  shellContext?: ResultCyberFrameShellContext;
  /** 互換用（角飾りは描かない） */
  glowCorners?: boolean;
};

export default function ResultCyberFrameDecorNative({
  width,
  height,
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

  if (!clipPath || width <= 0 || height <= 0) return null;

  const glowHeight = height * 0.42;
  const cut = resultCyberFrameShellContextCut(shellContext);
  const topLineLeft = cut + 4;
  const topLineWidth = Math.max(0, width - topLineLeft * 2);
  const canvasW = width + DECOR_BLOOM_PAD * 2;
  const canvasH = height + DECOR_BLOOM_PAD * 2;

  return (
    <View
      pointerEvents="none"
      style={[
        styles.layer,
        {
          left: -DECOR_BLOOM_PAD,
          top: -DECOR_BLOOM_PAD,
          width: canvasW,
          height: canvasH,
        },
      ]}
    >
      <Canvas
        opaque={false}
        style={{ width: canvasW, height: canvasH }}
        pointerEvents="none"
      >
        <Group
          transform={[
            { translateX: DECOR_BLOOM_PAD },
            { translateY: DECOR_BLOOM_PAD },
          ]}
        >
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
          </Group>
        </Group>
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: "absolute",
    zIndex: 12,
  },
});
