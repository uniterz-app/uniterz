/** Web `RankFirstBorderEdgeScan` — 旧エッジ光線が枠を一周する */
import { useEffect, useState } from "react";
import {
  AccessibilityInfo,
  LayoutChangeEvent,
  StyleSheet,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import {
  RANK_FIRST_EDGE_DIM_BORDER,
  RANK_FIRST_EDGE_H_BEAM_RATIO,
  RANK_FIRST_EDGE_H_GRADIENT,
  RANK_FIRST_EDGE_V_BEAM_RATIO,
  RANK_FIRST_EDGE_V_GRADIENT,
  RANK_FIRST_LOOP_CORNER_BLEND,
  RANK_FIRST_LOOP_DURATION_MS,
} from "../../../../../lib/rankings/rankFirstBorderEdgeScan";

const BEAM_THICKNESS = 2;

function edgeBeam(
  d: number,
  peri: number,
  start: number,
  len: number,
  blend: number,
  reverse: boolean
): { pos: number; opacity: number } {
  "worklet";
  let bestPos = 0;
  let bestOpacity = 0;
  for (const shift of [-peri, 0, peri]) {
    const local = d + shift - start;
    if (local < -blend || local > len + blend) continue;
    const clamped = Math.max(0, Math.min(len, local));
    const pos = reverse ? len - clamped : clamped;
    let opacity = 1;
    if (local < 0) opacity = 1 + local / blend;
    else if (local > len) opacity = 1 - (local - len) / blend;
    opacity = Math.max(0, Math.min(1, opacity));
    if (opacity > bestOpacity) {
      bestPos = pos;
      bestOpacity = opacity;
    }
  }
  return { pos: bestPos, opacity: bestOpacity };
}

function HBeam({
  progress,
  boxW,
  boxH,
  beamW,
  bottom,
}: {
  progress: SharedValue<number>;
  boxW: SharedValue<number>;
  boxH: SharedValue<number>;
  beamW: number;
  bottom?: boolean;
}) {
  const style = useAnimatedStyle(() => {
    const w = boxW.value;
    const h = boxH.value;
    if (w <= 0 || h <= 0) return { opacity: 0 };
    const peri = 2 * (w + h);
    const d = progress.value * peri;
    const blend = Math.min(RANK_FIRST_LOOP_CORNER_BLEND, h * 0.55, w * 0.14);
    const beam = bottom
      ? edgeBeam(d, peri, w + h, w, blend, true)
      : edgeBeam(d, peri, 0, w, blend, false);
    return {
      opacity: beam.opacity,
      transform: [{ translateX: beam.pos - beamW / 2 }],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.hBeam,
        bottom ? styles.hBeamBottom : styles.hBeamTop,
        { width: beamW, height: BEAM_THICKNESS },
        style,
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

function VBeam({
  progress,
  boxW,
  boxH,
  beamH,
  left,
}: {
  progress: SharedValue<number>;
  boxW: SharedValue<number>;
  boxH: SharedValue<number>;
  beamH: number;
  left?: boolean;
}) {
  const style = useAnimatedStyle(() => {
    const w = boxW.value;
    const h = boxH.value;
    if (w <= 0 || h <= 0) return { opacity: 0 };
    const peri = 2 * (w + h);
    const d = progress.value * peri;
    const blend = Math.min(RANK_FIRST_LOOP_CORNER_BLEND, h * 0.55, w * 0.14);
    const beam = left
      ? edgeBeam(d, peri, 2 * w + h, h, blend, true)
      : edgeBeam(d, peri, w, h, blend, false);
    return {
      opacity: beam.opacity,
      transform: [{ translateY: beam.pos - beamH / 2 }],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.vBeam,
        left ? styles.vBeamLeft : styles.vBeamRight,
        { width: BEAM_THICKNESS, height: beamH },
        style,
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
  const progress = useSharedValue(0);
  const boxW = useSharedValue(0);
  const boxH = useSharedValue(0);

  useEffect(() => {
    let alive = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (alive) setReduceMotion(enabled);
    });
    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion
    );
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);

  useEffect(() => {
    if (reduceMotion || size.w <= 0 || size.h <= 0) {
      cancelAnimation(progress);
      progress.value = 0;
      return;
    }
    progress.value = 0;
    progress.value = withRepeat(
      withTiming(1, {
        duration: RANK_FIRST_LOOP_DURATION_MS,
        easing: Easing.linear,
      }),
      -1,
      false
    );
    return () => cancelAnimation(progress);
  }, [progress, reduceMotion, size.h, size.w]);

  function onLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    if (Math.abs(width - size.w) < 0.5 && Math.abs(height - size.h) < 0.5) {
      return;
    }
    boxW.value = width;
    boxH.value = height;
    setSize({ w: width, h: height });
  }

  const paused = reduceMotion || size.w <= 0 || size.h <= 0;
  const hW = size.w * RANK_FIRST_EDGE_H_BEAM_RATIO;
  const vH = size.h * RANK_FIRST_EDGE_V_BEAM_RATIO;

  return (
    <View pointerEvents="none" style={styles.root} onLayout={onLayout}>
      <View style={styles.dim} />
      {!paused ? (
        <>
          <HBeam progress={progress} boxW={boxW} boxH={boxH} beamW={hW} />
          <HBeam progress={progress} boxW={boxW} boxH={boxH} beamW={hW} bottom />
          <VBeam progress={progress} boxW={boxW} boxH={boxH} beamH={vH} />
          <VBeam progress={progress} boxW={boxW} boxH={boxH} beamH={vH} left />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 6,
    overflow: "hidden",
  },
  dim: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: RANK_FIRST_EDGE_DIM_BORDER,
    opacity: 0.85,
  },
  hBeam: {
    position: "absolute",
    left: 0,
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
    top: 0,
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
