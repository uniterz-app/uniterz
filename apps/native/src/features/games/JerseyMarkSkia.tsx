import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { Canvas, Circle, Group, Path, Skia } from "@shopify/react-native-skia";
import {
  JERSEY_PATH_D,
  VIEWBOX_H,
  VIEWBOX_W,
  accentRgbForJerseyGlow,
  buildJerseyHalftoneDotList,
  jerseyStrokeWidthForSize,
} from "./jerseyHalftoneModel";

const JERSEY_STROKE = "rgba(200,248,255,0.58)";

type JerseyMarkSkiaProps = {
  accent: string;
  accentEnd?: string;
  size?: number;
};

export default function JerseyMarkSkia({
  accent,
  accentEnd,
  size = 56,
}: JerseyMarkSkiaProps) {
  const dots = useMemo(
    () => buildJerseyHalftoneDotList(size, accent, accentEnd),
    [size, accent, accentEnd]
  );
  const strokeW = useMemo(() => jerseyStrokeWidthForSize(size), [size]);
  const glow = useMemo(
    () => accentRgbForJerseyGlow(accent, accentEnd),
    [accent, accentEnd]
  );
  const glowColor = `rgb(${glow.r},${glow.g},${glow.b})`;

  const jerseyPath = useMemo(() => Skia.Path.MakeFromSVGString(JERSEY_PATH_D), []);

  const scale = Math.min(size / VIEWBOX_W, size / VIEWBOX_H);
  const tx = (size - VIEWBOX_W * scale) / 2;
  const ty = (size - VIEWBOX_H * scale) / 2;

  if (!jerseyPath) return null;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          shadowColor: glowColor,
        },
      ]}
    >
      <Canvas style={{ width: size, height: size }}>
        <Group transform={[{ translateX: tx }, { translateY: ty }, { scale }]}>
          <Group clip={jerseyPath}>
            {dots.map((dot, index) => (
              <Circle
                key={`d-${index}`}
                cx={dot.cx}
                cy={dot.cy}
                r={dot.r}
                color={dot.fill}
              />
            ))}
          </Group>
          <Path
            path={jerseyPath}
            style="stroke"
            color={JERSEY_STROKE}
            strokeWidth={strokeW}
            strokeCap="round"
            strokeJoin="round"
          />
        </Group>
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4,
  },
});
