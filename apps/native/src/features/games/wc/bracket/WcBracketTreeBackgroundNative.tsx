/** Web `WcBracketTreeBackground` 相当 — `globals.css` の `.wc-bracket-tree-bg*` を再現 */
import { useMemo } from "react";
import { Platform, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import {
  Canvas,
  Circle,
  RadialGradient,
  Rect,
  vec,
} from "@shopify/react-native-skia";
import { fonts } from "../../../../theme/tokens";

const bebas = Platform.select({
  ios: "BebasNeue_400Regular",
  android: "BebasNeue_400Regular",
  default: "BebasNeue_400Regular",
});

const FAR_TILE = [
  [12, 24],
  [64, 88],
  [130, 40],
  [180, 120],
  [30, 160],
  [110, 190],
] as const;
const MID_TILE = [
  [48, 60],
  [150, 30],
  [200, 150],
  [90, 220],
  [260, 100],
] as const;
const NEAR_TILE = [
  [70, 90],
  [320, 60],
  [240, 280],
  [30, 330],
] as const;

function tileStars(
  tile: readonly (readonly [number, number])[],
  tileW: number,
  tileH: number,
  cols: number,
  rows: number,
  radius: number,
  opacity: number
) {
  const out: { cx: number; cy: number; r: number; o: number }[] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      for (const [x, y] of tile) {
        out.push({
          cx: col * tileW + x,
          cy: row * tileH + y,
          r: radius,
          o: opacity,
        });
      }
    }
  }
  return out;
}

export default function WcBracketTreeBackgroundNative() {
  const { width: screenW } = useWindowDimensions();
  const brandSize = Math.min(42, Math.max(30, screenW * 0.085));
  const headingSize = Math.min(11, Math.max(9, screenW * 0.028));
  const brandTracking = brandSize * 0.26;
  const headingTracking = headingSize * 0.3;

  const stars = useMemo(
    () => [
      ...tileStars(FAR_TILE, 220, 220, 4, 5, 1, 0.65),
      ...tileStars(MID_TILE, 320, 300, 3, 4, 1.4, 0.82),
      ...tileStars(NEAR_TILE, 440, 420, 2, 3, 2, 0.95),
    ],
    []
  );

  return (
    <View style={styles.root} pointerEvents="none">
      <Canvas style={StyleSheet.absoluteFill}>
        <Rect x={0} y={0} width={screenW} height={2000}>
          <RadialGradient
            c={vec(screenW * 0.5, 0)}
            r={screenW * 1.2}
            colors={["#0a0a1a", "#04040c", "#010104"]}
            positions={[0, 0.46, 1]}
          />
        </Rect>

        <Circle cx={screenW * 0.38} cy={80} r={screenW * 0.45} opacity={0.22}>
          <RadialGradient
            c={vec(screenW * 0.38, 80)}
            r={screenW * 0.45}
            colors={["rgba(124,58,237,0.22)", "rgba(79,70,229,0.1)", "transparent"]}
            positions={[0, 0.38, 0.7]}
          />
        </Circle>
        <Circle cx={screenW * 0.64} cy={900} r={screenW * 0.48} opacity={0.2}>
          <RadialGradient
            c={vec(screenW * 0.64, 900)}
            r={screenW * 0.48}
            colors={["rgba(13,148,136,0.2)", "rgba(8,145,178,0.1)", "transparent"]}
            positions={[0, 0.4, 0.72]}
          />
        </Circle>
        <Circle cx={screenW * 0.5} cy={500} r={screenW * 0.48} opacity={0.12}>
          <RadialGradient
            c={vec(screenW * 0.5, 500)}
            r={screenW * 0.48}
            colors={["rgba(99,102,241,0.12)", "rgba(56,189,248,0.06)", "transparent"]}
            positions={[0, 0.42, 0.74]}
          />
        </Circle>

        {stars.map((star, i) => (
          <Circle
            key={i}
            cx={star.cx}
            cy={star.cy}
            r={star.r}
            color={`rgba(255,255,255,${star.o})`}
          />
        ))}

        <Rect x={0} y={0} width={screenW} height={2000}>
          <RadialGradient
            c={vec(screenW * 0.5, 500)}
            r={screenW * 0.95}
            colors={["transparent", "rgba(1,1,4,0.92)"]}
            positions={[0.3, 1]}
          />
        </Rect>
      </Canvas>

      <View style={styles.header}>
        <Text
          style={[
            styles.brand,
            {
              fontSize: brandSize,
              lineHeight: brandSize,
              letterSpacing: brandTracking,
              paddingLeft: brandTracking,
            },
          ]}
        >
          UNITERZ
        </Text>
        <Text
          style={[
            styles.heading,
            {
              fontSize: headingSize,
              lineHeight: headingSize,
              letterSpacing: headingTracking,
              paddingLeft: headingTracking,
            },
          ]}
        >
          ROUND OF 32
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    backgroundColor: "#010104",
  },
  header: {
    position: "absolute",
    top: 16,
    left: 0,
    right: 0,
    zIndex: 15,
    alignItems: "center",
    gap: 5,
    pointerEvents: "none",
  },
  brand: {
    fontFamily: bebas,
    color: "rgba(244,244,255,0.96)",
    textShadowColor: "rgba(165,180,252,0.7)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  heading: {
    fontFamily: fonts.metric,
    fontWeight: "600",
    color: "rgba(186,230,253,0.7)",
    textShadowColor: "rgba(56,189,248,0.35)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    textTransform: "uppercase",
  },
});
