/**
 * 矩形はみ出し部分をシェル色で塗る（zIndex 高 — コンテンツ・グロー抑止）。
 */
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { Canvas, Path, Skia } from "@shopify/react-native-skia";
import { chamferedCornerRevealPathsD } from "./matchListCyberClipPath";
import { resultHitCyberCornerRevealPathsD } from "../results/resultHitCyberClipPath";
import type { ResultCyberFrameClipShape } from "../results/ResultCyberFrameBorderSweepNative";

/** `.predict-overlay-cyber-card` グラデーション上端 — 角三角マスク用 */
const CORNER_FILL_COLOR = "rgba(10,14,22,1)";

type Props = {
  width: number;
  height: number;
  cut: number;
  /** chamfer=4隅 / hit=右上・左下のみ（Web `.result-hit-cyber-clip`） */
  clipShape?: ResultCyberFrameClipShape;
  /** 角三角の塗り色（親シェル背景に合わせる） */
  fillColor?: string;
};

export default function PredictOverlayChamferCornerFillNative({
  width,
  height,
  cut,
  clipShape = "chamfer",
  fillColor = CORNER_FILL_COLOR,
}: Props) {
  const cornerPaths = useMemo(() => {
    if (width <= 0 || height <= 0) return [];
    const pathsD =
      clipShape === "hit"
        ? resultHitCyberCornerRevealPathsD(width, height, cut)
        : chamferedCornerRevealPathsD(width, height, cut);
    return pathsD
      .map((d) => (d ? Skia.Path.MakeFromSVGString(d) : null))
      .filter((p): p is NonNullable<typeof p> => p != null);
  }, [width, height, cut, clipShape]);

  if (cornerPaths.length === 0) return null;

  return (
    <View pointerEvents="none" style={[styles.layer, { width, height }]}>
      <Canvas style={{ width, height }} pointerEvents="none">
        {cornerPaths.map((path, index) => (
          <Path key={`corner-${index}`} path={path} style="fill" color={fillColor} />
        ))}
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: "absolute",
    left: 0,
    top: 0,
    zIndex: 18,
  },
});
