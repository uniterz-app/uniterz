/**
 * MARK LIST 背景 — 短い縦ダッシュの斜めテクスチャ。
 * 画像は使わず Skia で描画。ダッシュ列を 60° 傾け、角は黒へ溶ける。
 */
import { memo, useCallback, useMemo, useState } from "react";
import {
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from "react-native";
import {
  BlurMask,
  Canvas,
  Fill,
  Group,
  LinearGradient,
  Path,
  Rect,
  Skia,
  vec,
  type SkPath,
} from "@shopify/react-native-skia";

const COL_GAP = 5.6;
const PERIOD = 7.1;
const DASH_H = 3.9;
/** 参考画像: 右上→左下へ約 60° */
const TILT = (-60 * Math.PI) / 180;
const TEAL = "rgb(70, 158, 156)";
const TEAL_GLOW = "rgb(48, 140, 138)";

function buildDashPath(w: number, h: number): SkPath {
  const path = Skia.Path.Make();
  const span = Math.hypot(w, h);
  const cols = Math.ceil(span / COL_GAP) + 10;
  const rows = Math.ceil(span / PERIOD) + 10;
  const originX = w / 2 - (cols * COL_GAP) / 2;
  const originY = h / 2 - (rows * PERIOD) / 2;
  for (let i = 0; i < cols; i++) {
    const x = originX + i * COL_GAP;
    const yOff = (i % 2) * (PERIOD * 0.5);
    for (let j = 0; j < rows; j++) {
      const y0 = originY + j * PERIOD + yOff;
      path.moveTo(x, y0);
      path.lineTo(x, y0 + DASH_H);
    }
  }
  return path;
}

function MarkListFloorGridNative() {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize((prev) =>
      prev.width === width && prev.height === height ? prev : { width, height }
    );
  }, []);

  const path = useMemo(() => {
    if (size.width < 8 || size.height < 8) return null;
    return buildDashPath(size.width, size.height);
  }, [size.height, size.width]);

  const w = size.width;
  const h = size.height;

  return (
    <View
      pointerEvents="none"
      style={styles.root}
      onLayout={onLayout}
      collapsable={false}
    >
      {path && w > 0 ? (
        <Canvas style={{ width: w, height: h }}>
          <Fill color="#000000" />
          <Group origin={vec(w / 2, h / 2)} transform={[{ rotate: TILT }]}>
            <Group>
              <BlurMask blur={1.4} style="solid" />
              <Path
                path={path}
                color={TEAL_GLOW}
                style="stroke"
                strokeWidth={1.05}
                strokeCap="butt"
                opacity={0.16}
              />
            </Group>
            <Path
              path={path}
              color={TEAL}
              style="stroke"
              strokeWidth={0.55}
              strokeCap="butt"
              opacity={0.34}
            />
          </Group>
          <Rect x={0} y={0} width={w} height={h}>
            <LinearGradient
              start={vec(w, 0)}
              end={vec(0, h)}
              colors={[
                "#000000",
                "rgba(0,0,0,0.82)",
                "rgba(0,0,0,0.08)",
                "rgba(0,0,0,0)",
                "rgba(0,0,0,0)",
                "rgba(0,0,0,0.08)",
                "rgba(0,0,0,0.82)",
                "#000000",
              ]}
              positions={[0, 0.14, 0.28, 0.38, 0.62, 0.72, 0.86, 1]}
            />
          </Rect>
        </Canvas>
      ) : (
        <View style={styles.fallback} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000000",
    overflow: "hidden",
  },
  fallback: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000000",
  },
});

export default memo(MarkListFloorGridNative);
