/** Web `RankFirstBorderEdgeScan` — 1位行 EDGE SCAN（案D） */
import { useEffect, useState } from "react";
import {
  AccessibilityInfo,
  LayoutChangeEvent,
  StyleSheet,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import {
  RANK_FIRST_EDGE_DIM_BORDER,
  RANK_FIRST_EDGE_H_BEAM_RATIO,
  RANK_FIRST_EDGE_H_DURATION_MS,
  RANK_FIRST_EDGE_H_END_RATIO,
  RANK_FIRST_EDGE_H_GRADIENT,
  RANK_FIRST_EDGE_H_START_RATIO,
  RANK_FIRST_EDGE_V_BEAM_RATIO,
  RANK_FIRST_EDGE_V_DURATION_MS,
  RANK_FIRST_EDGE_V_END_RATIO,
  RANK_FIRST_EDGE_V_GRADIENT,
  RANK_FIRST_EDGE_V_START_RATIO,
} from "../../../../../lib/rankings/rankFirstBorderEdgeScan";

const BEAM_THICKNESS = 2;

function HorizontalEdgeBeam({
  width,
  reverse,
  bottom,
  opacity = 1,
  paused,
}: {
  width: number;
  reverse: boolean;
  bottom?: boolean;
  opacity?: number;
  paused: boolean;
}) {
  const progress = useSharedValue(reverse ? 1 : 0);
  const beamWidth = width * RANK_FIRST_EDGE_H_BEAM_RATIO;
  const travel =
    (RANK_FIRST_EDGE_H_END_RATIO - RANK_FIRST_EDGE_H_START_RATIO) * width;

  useEffect(() => {
    if (paused) {
      progress.value = reverse ? 1 : 0;
      return;
    }
    progress.value = reverse ? 1 : 0;
    progress.value = withRepeat(
      withTiming(reverse ? 0 : 1, {
        duration: RANK_FIRST_EDGE_H_DURATION_MS,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, [paused, progress, reverse]);

  const animatedStyle = useAnimatedStyle(() => ({
    left: RANK_FIRST_EDGE_H_START_RATIO * width + progress.value * travel,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.hBeam,
        bottom ? styles.hBeamBottom : styles.hBeamTop,
        { width: beamWidth, opacity },
        animatedStyle,
      ]}
    >
      <LinearGradient
        colors={[...RANK_FIRST_EDGE_H_GRADIENT]}
        locations={[0, 0.25, 0.5, 0.75, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFillObject}
      />
    </Animated.View>
  );
}

function VerticalEdgeBeam({
  height,
  reverse,
  opacity = 1,
  paused,
}: {
  height: number;
  reverse?: boolean;
  opacity?: number;
  paused: boolean;
}) {
  const progress = useSharedValue(reverse ? 1 : 0);
  const beamHeight = height * RANK_FIRST_EDGE_V_BEAM_RATIO;
  const travel =
    (RANK_FIRST_EDGE_V_END_RATIO - RANK_FIRST_EDGE_V_START_RATIO) * height;

  useEffect(() => {
    if (paused) {
      progress.value = reverse ? 1 : 0;
      return;
    }
    progress.value = reverse ? 1 : 0;
    progress.value = withRepeat(
      withTiming(reverse ? 0 : 1, {
        duration: RANK_FIRST_EDGE_V_DURATION_MS,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, [paused, progress, reverse]);

  const animatedStyle = useAnimatedStyle(() => {
    const offset = RANK_FIRST_EDGE_V_START_RATIO * height + progress.value * travel;
    return reverse
      ? { bottom: offset }
      : { top: offset };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.vBeam,
        reverse ? styles.vBeamLeft : styles.vBeamRight,
        { height: beamHeight, opacity },
        animatedStyle,
      ]}
    >
      <LinearGradient
        colors={[...RANK_FIRST_EDGE_V_GRADIENT]}
        locations={[0, 0.35, 0.65, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
    </Animated.View>
  );
}

export function RankFirstBorderEdgeScanNative() {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let alive = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (alive) setReduceMotion(enabled);
    });
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (Math.abs(width - size.w) < 0.5 && Math.abs(height - size.h) < 0.5) return;
    setSize({ w: width, h: height });
  };

  const paused = reduceMotion || size.w <= 0 || size.h <= 0;

  return (
    <View pointerEvents="none" style={styles.root} onLayout={onLayout}>
      <View style={styles.dim} />
      {!paused ? (
        <View style={styles.scanLayer}>
          <HorizontalEdgeBeam width={size.w} reverse={false} paused={paused} />
          <HorizontalEdgeBeam width={size.w} reverse bottom opacity={0.75} paused={paused} />
          <VerticalEdgeBeam height={size.h} paused={paused} />
          <VerticalEdgeBeam height={size.h} reverse opacity={0.65} paused={paused} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 6,
  },
  dim: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: RANK_FIRST_EDGE_DIM_BORDER,
    opacity: 0.85,
  },
  scanLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
    overflow: "hidden",
  },
  hBeam: {
    position: "absolute",
    height: BEAM_THICKNESS,
    shadowColor: "rgba(184,255,60,0.55)",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 4,
  },
  hBeamTop: {
    top: 0,
  },
  hBeamBottom: {
    bottom: 0,
  },
  vBeam: {
    position: "absolute",
    width: BEAM_THICKNESS,
    shadowColor: "rgba(255,214,90,0.45)",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  vBeamRight: {
    right: 0,
  },
  vBeamLeft: {
    left: 0,
  },
});
