/**
 * Web `.predict-overlay-cyber-card` border + `PredictOverlayCyberDecor` トップビーム。
 * 枠は外枠−内枠の塗りリングで一周つなげ、斜め角を欠かさない。
 */
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import {
  BlurMask,
  Canvas,
  Group,
  LinearGradient as SkiaLinearGradient,
  Path,
  PathOp,
  Rect,
  Skia,
  vec,
  type SkPath,
} from "@shopify/react-native-skia";
import {
  chamferedRectPathD,
  insetChamferedRectPathD,
} from "./matchListCyberClipPath";
import type { ResultCyberFrameClipShape } from "../results/ResultCyberFrameBorderSweepNative";
import {
  insetResultHitCyberClipPathD,
  resultHitCyberClipPathD,
} from "../results/resultHitCyberClipPath";

const TOP_BEAM_INSET_X = 20;
/** 枠ブルームが Canvas 端で切れない余白 */
const BORDER_BLOOM_PAD = 12;

type Props = {
  width: number;
  height: number;
  cut: number;
  /** chamfer=8角 / hit=右上・左下のみ */
  clipShape?: ResultCyberFrameClipShape;
  borderColor?: string;
  borderWidth?: number;
  /** border のみ / トップビームのみ / 両方 */
  mode?: "border" | "beam" | "all";
  layerZIndex?: number;
};

function shellOutlinePathD(
  width: number,
  height: number,
  cut: number,
  clipShape: ResultCyberFrameClipShape,
  inset = 0
): string {
  if (clipShape === "hit") {
    return inset > 0
      ? insetResultHitCyberClipPathD(width, height, inset, cut)
      : resultHitCyberClipPathD(width, height, cut);
  }
  return inset > 0
    ? insetChamferedRectPathD(width, height, cut, inset)
    : chamferedRectPathD(width, height, cut);
}

function makeBorderRingPath(
  width: number,
  height: number,
  cut: number,
  clipShape: ResultCyberFrameClipShape,
  strokeWidth: number
): SkPath | null {
  const outerD = shellOutlinePathD(width, height, cut, clipShape, 0);
  const innerD = shellOutlinePathD(width, height, cut, clipShape, strokeWidth);
  if (!outerD || !innerD) return null;
  const outer = Skia.Path.MakeFromSVGString(outerD);
  const inner = Skia.Path.MakeFromSVGString(innerD);
  if (!outer || !inner) return null;
  return Skia.Path.MakeFromOp(outer, inner, PathOp.Difference);
}

function borderGlowColor(color: string, alpha: number): string {
  const m = color.match(
    /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i
  );
  if (!m) return `rgba(251,191,36,${alpha})`;
  return `rgba(${m[1]},${m[2]},${m[3]},${alpha})`;
}

export default function PredictOverlayCyberShellBorderNative({
  width,
  height,
  cut,
  clipShape = "chamfer",
  borderColor = "rgba(0,245,255,0.2)",
  borderWidth = 1,
  mode = "all",
  layerZIndex = 10,
}: Props) {
  const clipPath = useMemo(() => {
    if (width <= 0 || height <= 0) return null;
    const d = shellOutlinePathD(width, height, cut, clipShape);
    if (!d) return null;
    return Skia.Path.MakeFromSVGString(d);
  }, [width, height, cut, clipShape]);

  const borderRingPath = useMemo(() => {
    if (width <= 0 || height <= 0) return null;
    return makeBorderRingPath(
      width,
      height,
      cut,
      clipShape,
      Math.max(1, borderWidth)
    );
  }, [width, height, cut, clipShape, borderWidth]);

  const bloomRingPath = useMemo(() => {
    if (width <= 0 || height <= 0 || borderWidth <= 1) return null;
    return makeBorderRingPath(width, height, cut, clipShape, borderWidth + 4);
  }, [width, height, cut, clipShape, borderWidth]);

  const showBorder = mode === "border" || mode === "all";
  const showBeam = mode === "beam" || mode === "all";
  /** HIT / 結果枠は発光 */
  const resultGlow = clipShape === "hit" && showBorder && borderRingPath != null;

  if (!clipPath) return null;

  const beamLeft = TOP_BEAM_INSET_X;
  const beamWidth = Math.max(0, width - TOP_BEAM_INSET_X * 2);
  const canvasW = width + BORDER_BLOOM_PAD * 2;
  const canvasH = height + BORDER_BLOOM_PAD * 2;

  return (
    <View
      pointerEvents="none"
      style={[
        styles.layer,
        {
          left: -BORDER_BLOOM_PAD,
          top: -BORDER_BLOOM_PAD,
          width: canvasW,
          height: canvasH,
          zIndex: layerZIndex,
        },
      ]}
    >
      <Canvas style={{ width: canvasW, height: canvasH }} pointerEvents="none">
        <Group
          transform={[
            { translateX: BORDER_BLOOM_PAD },
            { translateY: BORDER_BLOOM_PAD },
          ]}
        >
          {showBorder && resultGlow && bloomRingPath ? (
            <Path
              path={bloomRingPath}
              style="fill"
              color={borderGlowColor(borderColor, 0.4)}
            >
              <BlurMask blur={4.5} style="normal" />
            </Path>
          ) : null}

          {showBorder && borderRingPath ? (
            <Path path={borderRingPath} style="fill" color={borderColor} />
          ) : null}

          {showBeam && beamWidth > 0 ? (
            <Group clip={clipPath}>
              <Rect x={beamLeft} y={0} width={beamWidth} height={1}>
                <SkiaLinearGradient
                  start={vec(beamLeft, 0.5)}
                  end={vec(beamLeft + beamWidth, 0.5)}
                  colors={
                    resultGlow
                      ? [
                          "rgba(253,224,71,0)",
                          "rgba(255,251,235,0.75)",
                          "rgba(253,224,71,0)",
                        ]
                      : [
                          "rgba(34,211,238,0)",
                          "rgba(34,211,238,0.55)",
                          "rgba(34,211,238,0)",
                        ]
                  }
                  positions={[0, 0.5, 1]}
                />
              </Rect>
            </Group>
          ) : null}
        </Group>
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: "absolute",
  },
});
