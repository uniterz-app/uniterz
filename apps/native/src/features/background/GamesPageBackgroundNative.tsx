import { useMemo } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import {
  Canvas,
  Group,
  Line,
  LinearGradient as SkiaLinearGradient,
  RadialGradient as SkiaRadialGradient,
  Rect,
  vec,
} from "@shopify/react-native-skia";
import { GAMES_AURORA_BLOB_LAYOUT } from "../../../../../lib/games/gamesPageBackgroundSpec";
import {
  NATIVE_BG_GRADIENT,
  NATIVE_FIELD_GRID_H,
  NATIVE_FIELD_GRID_V,
  NATIVE_PAGE_SURFACE_COLOR,
  NATIVE_TOP_HIGHLIGHT,
  NATIVE_VIGNETTE_STOPS,
  nativeAuroraPhaseStops,
} from "./nativeBackgroundPalette";

type Props = {
  /** 互換のため残す。常に軽量パスを使う */
  lite?: boolean;
};

const GRID_STEP = 96;

/**
 * Web `GamesPageBackground` の軽量 Native 版。
 * 複数 Canvas＋ドット群＋常時アニメは捨て、1 Canvas の静的レイヤーに寄せる。
 */
export default function GamesPageBackgroundNative(_props: Props) {
  const { width, height } = useWindowDimensions();
  const auroraStops = nativeAuroraPhaseStops(true);

  const vignetteColors = useMemo(
    () => NATIVE_VIGNETTE_STOPS.map((s) => s.color),
    []
  );
  const vignettePositions = useMemo(
    () => NATIVE_VIGNETTE_STOPS.map((s) => parseFloat(s.offset) / 100),
    []
  );

  const gridLines = useMemo(() => {
    if (width <= 0 || height <= 0) return null;
    const nodes = [];
    let i = 0;
    for (let x = 0; x <= width; x += GRID_STEP) {
      nodes.push(
        <Line
          key={`v${i}`}
          p1={{ x, y: 0 }}
          p2={{ x, y: height }}
          color={NATIVE_FIELD_GRID_H}
          strokeWidth={1}
          opacity={0.14}
        />
      );
      i += 1;
    }
    for (let y = 0; y <= height; y += GRID_STEP) {
      nodes.push(
        <Line
          key={`h${i}`}
          p1={{ x: 0, y }}
          p2={{ x: width, y }}
          color={NATIVE_FIELD_GRID_V}
          strokeWidth={1}
          opacity={0.12}
        />
      );
      i += 1;
    }
    return nodes;
  }, [width, height]);

  if (width <= 0 || height <= 0) {
    return (
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFillObject, { backgroundColor: NATIVE_PAGE_SURFACE_COLOR }]}
      />
    );
  }

  /** 緑＋青の2ブロブだけ（フル版の4色×複数 Canvas は使わない） */
  const auroraLayouts = GAMES_AURORA_BLOB_LAYOUT.slice(0, 2);
  const auroraColors = [auroraStops.green[0], auroraStops.blue[0]];

  return (
    <View pointerEvents="none" style={styles.root} collapsable={false}>
      <Canvas style={{ width, height }} pointerEvents="none">
        <Rect x={0} y={0} width={width} height={height}>
          <SkiaLinearGradient
            start={vec(0, 0)}
            end={vec(0, height)}
            colors={[
              NATIVE_BG_GRADIENT.top,
              NATIVE_BG_GRADIENT.mid,
              NATIVE_BG_GRADIENT.bottom,
            ]}
            positions={[...NATIVE_BG_GRADIENT.locations]}
          />
        </Rect>

        {gridLines ? <Group>{gridLines}</Group> : null}

        {auroraLayouts.map((layout, index) => {
          const cx = layout.cx * width;
          const cy = layout.cy * height;
          const r = Math.max(width * layout.w * 0.5, height * layout.h * 0.5);
          const center = auroraColors[index] ?? auroraColors[0]!;
          return (
            <Rect key={index} x={0} y={0} width={width} height={height} opacity={0.55}>
              <SkiaRadialGradient
                c={vec(cx, cy)}
                r={r}
                colors={[center, "transparent"]}
                positions={[0, 0.78]}
              />
            </Rect>
          );
        })}

        <Rect x={0} y={0} width={width} height={height}>
          <SkiaRadialGradient
            c={vec(width * NATIVE_TOP_HIGHLIGHT.cx, height * NATIVE_TOP_HIGHLIGHT.cy)}
            r={Math.max(width * NATIVE_TOP_HIGHLIGHT.w * 0.5, height * NATIVE_TOP_HIGHLIGHT.h * 0.5)}
            colors={[NATIVE_TOP_HIGHLIGHT.color, "transparent"]}
            positions={[0, 0.7]}
          />
        </Rect>
        <Rect x={0} y={0} width={width} height={height}>
          <SkiaRadialGradient
            c={vec(width * 0.5, height * 0.44)}
            r={Math.max(width * 0.95, height * 0.88) * 0.5}
            colors={vignetteColors}
            positions={vignettePositions}
          />
        </Rect>
        <Rect x={0} y={0} width={width} height={height}>
          <SkiaLinearGradient
            start={vec(width * 0.5, 0)}
            end={vec(width * 0.5, height)}
            colors={[
              "rgba(0,0,0,0.28)",
              "rgba(0,0,0,0)",
              "rgba(0,0,0,0)",
              "rgba(0,0,0,0.38)",
            ]}
            positions={[0, 0.24, 0.72, 1]}
          />
        </Rect>
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: NATIVE_PAGE_SURFACE_COLOR,
    overflow: "hidden",
  },
});
