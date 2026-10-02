/**
 * 案 K — Digital Scan
 * 数字・座標 → ノイズ → スキャンで U ロゴ復元。
 */
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { getVoidCoronaConcept } from "../../../../../../lib/splash/voidCoronaConcepts";
import {
  VoidCoronaUMarkNative,
  voidCoronaUMarkSize,
} from "./VoidCoronaMarkNative";

const CONCEPT = getVoidCoronaConcept("K");

const TONE = {
  bg: "#000000",
  mute: "rgba(170, 175, 185, 0.55)",
  dim: "rgba(120, 128, 140, 0.45)",
  accent: "#8EE8E4",
  accentSoft: "rgba(142, 232, 228, 0.28)",
  noise: "rgba(200, 210, 220, 0.14)",
  white: "#F2F2F5",
} as const;

const DATA_ROWS = [
  { id: "a", text: "x:0.214  y:0.781  w:0.42", x: 0.08, y: 0.14 },
  { id: "b", text: "σ=0.031  id=7A2F", x: 0.62, y: 0.18 },
  { id: "c", text: "frame 128 · conf 0.86", x: 0.12, y: 0.28 },
  { id: "d", text: "vec[−0.41, 0.92, 0.07]", x: 0.55, y: 0.32 },
  { id: "e", text: "sample n=4096", x: 0.18, y: 0.42 },
  { id: "f", text: "Δt=16.7ms  fft=ok", x: 0.58, y: 0.46 },
  { id: "g", text: "bbox 306,138 → 814,901", x: 0.1, y: 0.58 },
  { id: "h", text: "hash · c0ffee91", x: 0.64, y: 0.62 },
  { id: "i", text: "recon 12% → 47%", x: 0.16, y: 0.72 },
  { id: "j", text: "residual 2.1e−3", x: 0.6, y: 0.76 },
  { id: "k", text: "U_MARK · LOCK", x: 0.28, y: 0.86 },
] as const;

type Props = {
  playKey?: number;
  forceStatic?: boolean;
  onComplete?: () => void;
};

export default function VoidCoronaSplashKNative({
  playKey = 0,
  forceStatic = false,
  onComplete,
}: Props) {
  const reduceMotion = useReducedMotion();
  const staticPose = forceStatic || reduceMotion === true;
  const { width, height } = useWindowDimensions();
  const voidD = Math.min(width, height) * 0.336;
  const { markSize } = voidCoronaUMarkSize(width, voidD * 1.2);
  const progress = useSharedValue(staticPose ? 1 : 0);
  const [status, setStatus] = useState(
    staticPose ? "RECON · OK" : "INGEST · COORDS"
  );

  const noiseCells = useMemo(
    () =>
      Array.from({ length: 48 }, (_, i) => ({
        id: i,
        left: ((i * 47) % 100) / 100,
        top: ((i * 31 + 13) % 100) / 100,
        w: 6 + (i % 5) * 4,
        h: 2 + (i % 3),
        phase: (i % 10) / 10,
      })),
    []
  );

  useAnimatedReaction(
    () => {
      const t = progress.value;
      if (t < 0.28) return "INGEST · COORDS";
      if (t < 0.48) return "NOISE · ANALYZE";
      if (t < 0.78) return "SCAN · RECONSTRUCT";
      return "RECON · OK";
    },
    (next, prev) => {
      if (next !== prev) runOnJS(setStatus)(next);
    },
    []
  );

  useEffect(() => {
    if (staticPose) {
      progress.value = 1;
      setStatus("RECON · OK");
      onComplete?.();
      return;
    }
    progress.value = 0;
    setStatus("INGEST · COORDS");
    progress.value = withTiming(
      1,
      { duration: CONCEPT.totalMs, easing: Easing.bezier(0.22, 0.02, 0.12, 1) },
      (finished) => {
        if (finished && onComplete) runOnJS(onComplete)();
      }
    );
  }, [playKey, staticPose, progress, onComplete]);

  const dataLayerStyle = useAnimatedStyle(() => {
    if (staticPose) return { opacity: 0 };
    const t = progress.value;
    return {
      opacity: interpolate(
        t,
        [0.02, 0.1, 0.28, 0.42],
        [0, 0.85, 0.7, 0],
        "clamp"
      ),
    };
  });

  const noiseLayerStyle = useAnimatedStyle(() => {
    if (staticPose) return { opacity: 0 };
    const t = progress.value;
    return {
      opacity: interpolate(
        t,
        [0.22, 0.34, 0.48, 0.62],
        [0, 0.9, 0.75, 0],
        "clamp"
      ),
    };
  });

  const revealStyle = useAnimatedStyle(() => {
    if (staticPose) return { height: markSize, opacity: 1 };
    const t = progress.value;
    return {
      height: interpolate(t, [0.42, 0.74], [0, markSize], "clamp"),
      opacity: interpolate(t, [0.4, 0.48], [0, 1], "clamp"),
    };
  });

  const scanBarStyle = useAnimatedStyle(() => {
    if (staticPose) return { opacity: 0, transform: [{ translateY: 0 }] };
    const t = progress.value;
    return {
      opacity: interpolate(
        t,
        [0.4, 0.46, 0.72, 0.8],
        [0, 1, 0.85, 0],
        "clamp"
      ),
      transform: [
        {
          translateY: interpolate(t, [0.42, 0.74], [0, markSize], "clamp"),
        },
      ],
    };
  });

  const ghostStyle = useAnimatedStyle(() => {
    if (staticPose) return { opacity: 0 };
    const t = progress.value;
    return {
      opacity: interpolate(
        t,
        [0.38, 0.48, 0.62, 0.72],
        [0, 0.28, 0.16, 0],
        "clamp"
      ),
    };
  });

  const lockStyle = useAnimatedStyle(() => {
    if (staticPose) return { opacity: 1, transform: [{ scale: 1 }] };
    const t = progress.value;
    return {
      opacity: interpolate(t, [0.7, 0.82], [0, 1], "clamp"),
      transform: [
        { scale: interpolate(t, [0.7, 0.86], [0.98, 1], "clamp") },
      ],
    };
  });

  const statusStyle = useAnimatedStyle(() => {
    if (staticPose) return { opacity: 0.4 };
    const t = progress.value;
    return {
      opacity: interpolate(
        t,
        [0.06, 0.14, 0.82, 0.94],
        [0, 0.55, 0.45, 0],
        "clamp"
      ),
    };
  });

  return (
    <View style={styles.root} accessibilityLabel="UNITERZ">
      <Animated.View
        style={[StyleSheet.absoluteFill, dataLayerStyle]}
        pointerEvents="none"
      >
        {DATA_ROWS.map((row) => (
          <Text
            key={row.id}
            style={[
              styles.dataText,
              { left: row.x * width, top: row.y * height },
            ]}
          >
            {row.text}
          </Text>
        ))}
      </Animated.View>

      <Animated.View
        style={[StyleSheet.absoluteFill, noiseLayerStyle]}
        pointerEvents="none"
      >
        {noiseCells.map((c) => (
          <View
            key={c.id}
            style={[
              styles.noiseCell,
              {
                left: c.left * width,
                top: c.top * height,
                width: c.w,
                height: c.h,
                opacity: 0.35 + c.phase * 0.55,
              },
            ]}
          />
        ))}
        {Array.from({ length: 18 }, (_, i) => (
          <View
            key={`band-${i}`}
            style={[
              styles.noiseBand,
              {
                top: (i / 18) * height,
                opacity: i % 2 === 0 ? 0.08 : 0.04,
              },
            ]}
          />
        ))}
      </Animated.View>

      <View style={styles.center}>
        <View style={{ width: markSize, height: markSize }}>
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <VoidCoronaUMarkNative
              size={markSize}
              fill={TONE.accentSoft}
              style={ghostStyle}
            />
          </View>

          <Animated.View
            style={[styles.revealClip, { width: markSize }, revealStyle]}
            pointerEvents="none"
          >
            <VoidCoronaUMarkNative size={markSize} fill={TONE.accent} />
          </Animated.View>

          <Animated.View
            style={[styles.scanBar, { width: markSize }, scanBarStyle]}
            pointerEvents="none"
          />

          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <VoidCoronaUMarkNative
              size={markSize}
              fill={TONE.white}
              style={lockStyle}
            />
          </View>
        </View>
      </View>

      <Animated.View
        style={[styles.statusWrap, statusStyle]}
        pointerEvents="none"
      >
        <Text style={styles.status}>{status}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: TONE.bg,
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  dataText: {
    position: "absolute",
    color: TONE.mute,
    fontSize: 10,
    letterSpacing: 0.6,
    fontVariant: ["tabular-nums"],
    fontWeight: "500",
  },
  noiseCell: {
    position: "absolute",
    backgroundColor: TONE.noise,
  },
  noiseBand: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: "rgba(180, 190, 200, 1)",
  },
  revealClip: {
    overflow: "hidden",
  },
  scanBar: {
    position: "absolute",
    left: 0,
    height: 2,
    backgroundColor: TONE.accent,
    shadowColor: TONE.accent,
    shadowOpacity: 0.9,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  statusWrap: {
    position: "absolute",
    bottom: 72,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  status: {
    color: TONE.dim,
    fontSize: 10,
    letterSpacing: 2.8,
    fontWeight: "600",
  },
});
