/**
 * Web `.predict-overlay-cyber-card` border + `PredictOverlayCyberDecor` トップビーム。
 * 走査光（z11）の下に置き、枠線だけ先に描く。
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
  chamferedRectPathD,
  insetChamferedRectPathD,
} from "./matchListCyberClipPath";
import type { ResultCyberFrameClipShape } from "../results/ResultCyberFrameBorderSweepNative";
import {
  insetResultHitCyberClipPathD,
  resultHitCyberClipPathD,
} from "../results/resultHitCyberClipPath";

const TOP_BEAM_INSET_X = 20;

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

  const borderPath = useMemo(() => {
    if (width <= 0 || height <= 0) return null;
    const inset = borderWidth / 2;
    const d = shellOutlinePathD(width, height, cut, clipShape, inset);
    if (!d) return null;
    return Skia.Path.MakeFromSVGString(d);
  }, [width, height, cut, clipShape, borderWidth]);

  const showBorder = mode === "border" || mode === "all";
  const showBeam = mode === "beam" || mode === "all";

  if (!clipPath) return null;

  const beamLeft = TOP_BEAM_INSET_X;
  const beamWidth = Math.max(0, width - TOP_BEAM_INSET_X * 2);

  return (
    <View pointerEvents="none" style={[styles.layer, { width, height, zIndex: layerZIndex }]}>
      <Canvas style={{ width, height }} pointerEvents="none">
        {showBorder && borderPath ? (
          <Path
            path={borderPath}
            style="stroke"
            strokeWidth={borderWidth}
            strokeJoin="miter"
            strokeCap="butt"
            color={borderColor}
          />
        ) : null}

        {showBeam && beamWidth > 0 ? (
          <Group clip={clipPath}>
            <Rect x={beamLeft} y={0} width={beamWidth} height={1}>
              <SkiaLinearGradient
                start={vec(beamLeft, 0.5)}
                end={vec(beamLeft + beamWidth, 0.5)}
                colors={["rgba(34,211,238,0)", "rgba(34,211,238,0.55)", "rgba(34,211,238,0)"]}
                positions={[0, 0.5, 1]}
              />
            </Rect>
          </Group>
        ) : null}
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: "absolute",
    left: 0,
    top: 0,
  },
});
