import { useEffect, useMemo } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import {
  Canvas,
  Circle,
  Group,
  LinearGradient as SkiaLinearGradient,
  RadialGradient as SkiaRadialGradient,
  Rect,
  vec,
} from "@shopify/react-native-skia";
import {
  GAMES_AURORA_BLOB_LAYOUT,
  GAMES_AURORA_CYCLE_LITE_MS,
  GAMES_AURORA_CYCLE_MS,
  GAMES_AURORA_OPACITY_KEYFRAMES,
  GAMES_BASE_TINT_OPACITY_KEYFRAMES,
  GAMES_PAGE_FIELD,
  type AuroraRgbStops,
} from "../../../../../lib/games/gamesPageBackgroundSpec";
import { backgroundCycleInitialValue } from "./backgroundClock";
import {
  gamesPageFieldOpacities,
  useBackgroundDotField,
  useBackgroundGridField,
} from "./gamesPageBackgroundSkia";
import {
  NATIVE_BG_GRADIENT,
  NATIVE_BG_TINTS,
  NATIVE_PAGE_SURFACE_COLOR,
  NATIVE_TOP_HIGHLIGHT,
  NATIVE_VIGNETTE_STOPS,
  nativeAuroraPhaseStops,
} from "./nativeBackgroundPalette";
import RisingMotesLayerNative from "./RisingMotesLayerNative";

const AnimatedView = Animated.createAnimatedComponent(View);

type Props = {
  lite?: boolean;
};

function auroraFadeColor(center: string): string {
  const m = center.match(/^(rgba?\([^)]+),\s*[\d.]+\)$/);
  if (m) return `${m[1]}, 0)`;
  return "transparent";
}

function AuroraSkiaLayer({
  width,
  height,
  stops,
}: {
  width: number;
  height: number;
  stops: AuroraRgbStops;
}) {
  return (
    <Canvas style={{ width, height }} pointerEvents="none">
      {GAMES_AURORA_BLOB_LAYOUT.map((layout, index) => {
        const cx = layout.cx * width;
        const cy = layout.cy * height;
        const r = Math.max(width * layout.w * 0.5, height * layout.h * 0.5);
        const center = stops[index];
        return (
          <Rect key={index} x={0} y={0} width={width} height={height}>
            <SkiaRadialGradient
              c={vec(cx, cy)}
              r={r}
              colors={[center, auroraFadeColor(center)]}
              positions={[0, 0.72]}
            />
          </Rect>
        );
      })}
    </Canvas>
  );
}

function TintSkiaLayer({
  width,
  height,
  colors,
  locations,
}: {
  width: number;
  height: number;
  colors: readonly [string, string, string];
  locations: readonly [number, number, number];
}) {
  return (
    <Canvas style={{ width, height }} pointerEvents="none">
      <Rect x={0} y={0} width={width} height={height}>
        <SkiaLinearGradient
          start={vec(0, 0)}
          end={vec(0, height)}
          colors={[...colors]}
          positions={[...locations]}
        />
      </Rect>
    </Canvas>
  );
}

/**
 * Web `GamesPageBackground` のネイティブ版（Skia）。
 * expo-linear-gradient / SVG は新アーキテクチャで背景レイヤーが描画されないことがあるため。
 */
export default function GamesPageBackgroundNative({ lite = false }: Props) {
  const { width, height } = useWindowDimensions();
  const reduceMotion = useReducedMotion() ?? false;
  const fieldOpacities = gamesPageFieldOpacities(lite);
  const fieldDriftMs = lite ? GAMES_PAGE_FIELD.driftMsLite : GAMES_PAGE_FIELD.driftMs;
  const auroraMs = lite ? GAMES_AURORA_CYCLE_LITE_MS : GAMES_AURORA_CYCLE_MS;
  const auroraStops = nativeAuroraPhaseStops(lite);

  const gridW = width * 1.24;
  const gridH = height * 1.24;

  const dots = useBackgroundDotField(width, height, fieldOpacities.dot);
  const grid = useBackgroundGridField(gridW, gridH, fieldOpacities.grid);

  const fieldDrift = useSharedValue(0);
  const auroraCycle = useSharedValue(backgroundCycleInitialValue(auroraMs));
  const baseTintCycle = useSharedValue(backgroundCycleInitialValue(auroraMs));

  useEffect(() => {
    if (reduceMotion) return;
    fieldDrift.value = withRepeat(
      withTiming(GAMES_PAGE_FIELD.driftPx, { duration: fieldDriftMs, easing: Easing.linear }),
      -1,
      false
    );
    auroraCycle.value = backgroundCycleInitialValue(auroraMs);
    auroraCycle.value = withRepeat(
      withTiming(1, { duration: auroraMs, easing: Easing.inOut(Easing.ease) }),
      -1,
      false
    );
    baseTintCycle.value = backgroundCycleInitialValue(auroraMs);
    baseTintCycle.value = withRepeat(
      withTiming(1, { duration: auroraMs, easing: Easing.inOut(Easing.ease) }),
      -1,
      false
    );
  }, [auroraCycle, auroraMs, baseTintCycle, fieldDrift, fieldDriftMs, reduceMotion]);

  const fieldStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: fieldDrift.value }],
  }));

  const auroraGreenStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      auroraCycle.value,
      GAMES_AURORA_OPACITY_KEYFRAMES.green.input,
      GAMES_AURORA_OPACITY_KEYFRAMES.green.output
    ),
  }));
  const auroraBlueStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      auroraCycle.value,
      GAMES_AURORA_OPACITY_KEYFRAMES.blue.input,
      GAMES_AURORA_OPACITY_KEYFRAMES.blue.output
    ),
  }));
  const auroraVioletStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      auroraCycle.value,
      GAMES_AURORA_OPACITY_KEYFRAMES.violet.input,
      GAMES_AURORA_OPACITY_KEYFRAMES.violet.output
    ),
  }));
  const auroraAmberStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      auroraCycle.value,
      GAMES_AURORA_OPACITY_KEYFRAMES.amber.input,
      GAMES_AURORA_OPACITY_KEYFRAMES.amber.output
    ),
  }));

  const baseTintGreenStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      baseTintCycle.value,
      GAMES_BASE_TINT_OPACITY_KEYFRAMES.green.input,
      GAMES_BASE_TINT_OPACITY_KEYFRAMES.green.output
    ),
  }));
  const baseTintBlueStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      baseTintCycle.value,
      GAMES_BASE_TINT_OPACITY_KEYFRAMES.blue.input,
      GAMES_BASE_TINT_OPACITY_KEYFRAMES.blue.output
    ),
  }));
  const baseTintVioletStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      baseTintCycle.value,
      GAMES_BASE_TINT_OPACITY_KEYFRAMES.violet.input,
      GAMES_BASE_TINT_OPACITY_KEYFRAMES.violet.output
    ),
  }));

  const vignetteColors = useMemo(
    () => NATIVE_VIGNETTE_STOPS.map((s) => s.color),
    []
  );
  const vignettePositions = useMemo(
    () => NATIVE_VIGNETTE_STOPS.map((s) => parseFloat(s.offset) / 100),
    []
  );

  if (width <= 0 || height <= 0) {
    return (
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFillObject, { backgroundColor: NATIVE_PAGE_SURFACE_COLOR }]}
      />
    );
  }

  return (
    <View pointerEvents="none" style={styles.root} collapsable={false}>
      <Canvas style={{ position: "absolute", left: 0, top: 0, width, height }}>
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
        {dots ? <Group>{dots}</Group> : null}
      </Canvas>

      {reduceMotion ? (
        <>
          <View style={[StyleSheet.absoluteFillObject, { opacity: 0.65 }]}>
            <TintSkiaLayer
              width={width}
              height={height}
              colors={NATIVE_BG_TINTS.green.colors}
              locations={NATIVE_BG_TINTS.green.locations}
            />
          </View>
          <View style={[StyleSheet.absoluteFillObject, { opacity: 0.35 }]}>
            <TintSkiaLayer
              width={width}
              height={height}
              colors={NATIVE_BG_TINTS.blue.colors}
              locations={NATIVE_BG_TINTS.blue.locations}
            />
          </View>
        </>
      ) : (
        <>
          <AnimatedView style={[StyleSheet.absoluteFillObject, baseTintGreenStyle]}>
            <TintSkiaLayer
              width={width}
              height={height}
              colors={NATIVE_BG_TINTS.green.colors}
              locations={NATIVE_BG_TINTS.green.locations}
            />
          </AnimatedView>
          <AnimatedView style={[StyleSheet.absoluteFillObject, baseTintBlueStyle]}>
            <TintSkiaLayer
              width={width}
              height={height}
              colors={NATIVE_BG_TINTS.blue.colors}
              locations={NATIVE_BG_TINTS.blue.locations}
            />
          </AnimatedView>
          <AnimatedView style={[StyleSheet.absoluteFillObject, baseTintVioletStyle]}>
            <TintSkiaLayer
              width={width}
              height={height}
              colors={NATIVE_BG_TINTS.violet.colors}
              locations={NATIVE_BG_TINTS.violet.locations}
            />
          </AnimatedView>
        </>
      )}

      <AnimatedView
        pointerEvents="none"
        style={[
          styles.fieldGridWrap,
          {
            width: gridW,
            height: gridH,
            left: -width * 0.12,
            top: -height * 0.12,
          },
          reduceMotion ? null : fieldStyle,
        ]}
      >
        <Canvas style={{ width: gridW, height: gridH }}>{grid}</Canvas>
      </AnimatedView>

      <AnimatedView style={[StyleSheet.absoluteFillObject, auroraGreenStyle]}>
        <AuroraSkiaLayer width={width} height={height} stops={auroraStops.green} />
      </AnimatedView>
      {!reduceMotion ? (
        <>
          <AnimatedView style={[StyleSheet.absoluteFillObject, auroraBlueStyle]}>
            <AuroraSkiaLayer width={width} height={height} stops={auroraStops.blue} />
          </AnimatedView>
          <AnimatedView style={[StyleSheet.absoluteFillObject, auroraVioletStyle]}>
            <AuroraSkiaLayer width={width} height={height} stops={auroraStops.violet} />
          </AnimatedView>
          <AnimatedView style={[StyleSheet.absoluteFillObject, auroraAmberStyle]}>
            <AuroraSkiaLayer width={width} height={height} stops={auroraStops.amber} />
          </AnimatedView>
        </>
      ) : null}

      <Canvas style={{ position: "absolute", left: 0, top: 0, width, height }} pointerEvents="none">
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

      <RisingMotesLayerNative lite={lite} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: NATIVE_PAGE_SURFACE_COLOR,
    overflow: "visible",
  },
  fieldGridWrap: {
    position: "absolute",
  },
});
