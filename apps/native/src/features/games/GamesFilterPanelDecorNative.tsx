import { useState } from "react";
import { type LayoutChangeEvent, StyleSheet, View } from "react-native";
import { Canvas, Circle, Group, Line, vec } from "@shopify/react-native-skia";
import { LinearGradient } from "expo-linear-gradient";
import { GamesFilterPanelGridSkia } from "./gamesFilterPanelGridSkia";

const DOT_STEP = 18;
const SCAN_STEP = 4;

/** Web `.games-filter-panel-*` 背景装飾レイヤー */
export default function GamesFilterPanelDecorNative() {
  const [size, setSize] = useState({ w: 0, h: 0 });

  function onLayout(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout;
    if (Math.abs(width - size.w) < 0.5 && Math.abs(height - size.h) < 0.5) return;
    setSize({ w: width, h: height });
  }

  const dots: { x: number; y: number }[] = [];
  if (size.h > 0) {
    const startY = size.h * 0.52;
    for (let y = startY; y < size.h; y += DOT_STEP) {
      for (let x = DOT_STEP; x < size.w; x += DOT_STEP) {
        dots.push({ x, y });
      }
    }
  }

  const scanlines: number[] = [];
  for (let y = SCAN_STEP; y < size.h; y += SCAN_STEP) {
    scanlines.push(y);
  }

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} onLayout={onLayout}>
      <LinearGradient
        colors={["rgba(0,245,255,0.16)", "rgba(0,245,255,0)", "transparent"]}
        locations={[0, 0.45, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.6, y: 0.55 }}
        style={styles.ambientTop}
      />
      <LinearGradient
        colors={["transparent", "rgba(56,189,248,0.09)", "transparent"]}
        locations={[0, 0.55, 1]}
        start={{ x: 1, y: 1 }}
        end={{ x: 0.35, y: 0.45 }}
        style={styles.ambientBottom}
      />
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.38)"]}
        start={{ x: 0.5, y: 0.35 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={["transparent", "rgba(0,245,255,0.07)", "rgba(0,245,255,0.025)", "transparent"]}
        locations={[0.46, 0.49, 0.52, 0.55]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.diagonalAccent}
      />

      {size.w > 0 && size.h > 0 ? (
        <Canvas style={{ position: "absolute", left: 0, top: 0, width: size.w, height: size.h }}>
          <GamesFilterPanelGridSkia width={size.w} height={size.h} />
          <Group opacity={0.75}>
            {scanlines.map((y) => (
              <Line
                key={`scan-${y}`}
                p1={vec(0, y)}
                p2={vec(size.w, y)}
                color="rgba(0,245,255,0.014)"
                strokeWidth={1}
              />
            ))}
          </Group>
          <Group opacity={0.85}>
            {dots.map((dot, i) => (
              <Circle
                key={`dot-${i}`}
                cx={dot.x}
                cy={dot.y}
                r={0.55}
                color="rgba(0,245,255,0.11)"
              />
            ))}
          </Group>
        </Canvas>
      ) : null}

      <LinearGradient
        colors={["transparent", "rgba(0,245,255,0.22)", "rgba(255,255,255,0.42)", "rgba(0,245,255,0.22)", "transparent"]}
        locations={[0, 0.22, 0.5, 0.78, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.headerBeam}
      />
      <LinearGradient
        colors={["transparent", "rgba(0,245,255,0.18)", "rgba(255,255,255,0.3)", "rgba(0,245,255,0.18)", "transparent"]}
        locations={[0, 0.22, 0.5, 0.78, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.footerBeam}
      />

      <View style={[styles.corner, styles.cornerTl]} />
      <View style={[styles.corner, styles.cornerTr]} />
      <View style={[styles.corner, styles.cornerBl]} />
      <View style={[styles.corner, styles.cornerBr]} />

      <LinearGradient
        colors={["transparent", "rgba(0,245,255,0.42)", "transparent"]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.topBeam}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  ambientTop: {
    position: "absolute",
    left: 0,
    top: 0,
    width: "88%",
    height: "52%",
  },
  ambientBottom: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: "64%",
    height: "42%",
  },
  diagonalAccent: {
    position: "absolute",
    top: 0,
    right: 0,
    width: "52%",
    height: 132,
  },
  headerBeam: {
    position: "absolute",
    left: "10%",
    right: "10%",
    top: 68,
    height: 1,
    opacity: 0.42,
  },
  footerBeam: {
    position: "absolute",
    left: "12%",
    right: "12%",
    bottom: 12,
    height: 1,
    opacity: 0.28,
  },
  topBeam: {
    position: "absolute",
    left: 14,
    right: 14,
    top: 0,
    height: 1,
  },
  corner: {
    position: "absolute",
    width: 16,
    height: 16,
    borderColor: "rgba(0,245,255,0.34)",
  },
  cornerTl: {
    top: 11,
    left: 11,
    borderTopWidth: 1,
    borderLeftWidth: 1,
  },
  cornerTr: {
    top: 11,
    right: 11,
    borderTopWidth: 1,
    borderRightWidth: 1,
  },
  cornerBl: {
    bottom: 11,
    left: 11,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
  },
  cornerBr: {
    bottom: 11,
    right: 11,
    borderBottomWidth: 1,
    borderRightWidth: 1,
  },
});
