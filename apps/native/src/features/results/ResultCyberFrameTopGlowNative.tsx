import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
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
  type ResultCyberFrameShellContext,
} from "./resultCyberFrameNativeClip";

type Props = {
  width: number;
  height: number;
  colors: readonly string[];
  locations?: readonly number[];
  shellContext?: ResultCyberFrameShellContext;
};

/** Web 結果枠上部グロー — predictOverlay では chamfer clip */
export default function ResultCyberFrameTopGlowNative({
  width,
  height,
  colors,
  locations = [0, 0.42, 0.7],
  shellContext = "default",
}: Props) {
  const glowHeight = height * 0.42;

  const clipPath = useMemo(() => {
    if (width <= 0 || height <= 0) return null;
    const d = resultCyberFrameGlowClipPathD(width, height, shellContext);
    if (!d) return null;
    return Skia.Path.MakeFromSVGString(d);
  }, [width, height, shellContext]);

  if (shellContext === "predictOverlay" && clipPath) {
    return (
      <View pointerEvents="none" style={[styles.layer, { width, height }]}>
        <Canvas style={{ width, height }} pointerEvents="none">
          <Group clip={clipPath}>
            <Rect x={0} y={0} width={width} height={glowHeight}>
              <SkiaLinearGradient
                start={vec(width * 0.5, 0)}
                end={vec(width * 0.5, glowHeight)}
                colors={[...colors]}
                positions={[...locations]}
              />
            </Rect>
          </Group>
        </Canvas>
      </View>
    );
  }

  return (
    <LinearGradient
      pointerEvents="none"
      colors={colors as [string, string, ...string[]]}
      locations={locations as [number, number, ...number[]]}
      style={styles.rectGlow}
    />
  );
}

const styles = StyleSheet.create({
  layer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    zIndex: 1,
  },
  rectGlow: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: "42%",
    zIndex: 1,
  },
});
