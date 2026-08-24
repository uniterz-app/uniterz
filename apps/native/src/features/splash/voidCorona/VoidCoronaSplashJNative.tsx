/**
 * 案 J — ダークサイバー
 * スキャン線 + HUD。暗い粒子が U に収束 → グリッチ → 赤紫ドクン → ロック。
 */
import { useEffect, useMemo } from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { getVoidCoronaConcept } from "../../../../../../lib/splash/voidCoronaConcepts";
import VoidCoronaFieldNative from "./VoidCoronaFieldNative";
import {
  VoidCoronaUMarkNative,
  voidCoronaUMarkSize,
} from "./VoidCoronaMarkNative";

const CONCEPT = getVoidCoronaConcept("J");

const CYBER = {
  red: "#C41E3A",
  redSoft: "rgba(196, 30, 58, 0.55)",
  violet: "#6B2FA0",
  gray: "#9A9AA3",
  frame: "rgba(180, 40, 70, 0.75)",
  scan: "rgba(200, 50, 80, 0.07)",
  white: "#E8E8EC",
} as const;

type Props = {
  playKey?: number;
  forceStatic?: boolean;
  onComplete?: () => void;
};

export default function VoidCoronaSplashJNative({
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

  const scanYs = useMemo(() => {
    const out: number[] = [];
    for (let y = 0; y < height; y += 4) out.push(y);
    return out;
  }, [height]);

  useEffect(() => {
    if (staticPose) {
      progress.value = 1;
      onComplete?.();
      return;
    }
    progress.value = 0;
    progress.value = withTiming(
      1,
      { duration: CONCEPT.totalMs, easing: Easing.bezier(0.2, 0.02, 0.1, 1) },
      (finished) => {
        if (finished && onComplete) runOnJS(onComplete)();
      }
    );
  }, [playKey, staticPose, progress, onComplete]);

  const hudStyle = useAnimatedStyle(() => {
    if (staticPose) return { opacity: 0.55 };
    const t = progress.value;
    return {
      opacity: interpolate(
        t,
        [0.05, 0.18, 0.78, 0.92],
        [0, 0.85, 0.7, 0.15],
        "clamp"
      ),
    };
  });

  const scanFieldStyle = useAnimatedStyle(() => {
    if (staticPose) return { opacity: 0.12 };
    const t = progress.value;
    return {
      opacity: interpolate(
        t,
        [0, 0.15, 0.75, 0.95],
        [0.2, 0.28, 0.18, 0.04],
        "clamp"
      ),
    };
  });

  const sweepStyle = useAnimatedStyle(() => {
    if (staticPose) return { opacity: 0, transform: [{ translateY: 0 }] };
    const t = progress.value;
    return {
      opacity: interpolate(
        t,
        [0.08, 0.2, 0.55, 0.7],
        [0, 0.9, 0.55, 0],
        "clamp"
      ),
      transform: [
        {
          translateY: interpolate(
            t,
            [0.08, 0.7],
            [-height * 0.15, height * 1.05],
            "clamp"
          ),
        },
      ],
    };
  });

  const glitchRedStyle = useAnimatedStyle(() => {
    if (staticPose) return { opacity: 0 };
    const t = progress.value;
    const kick = t > 0.48 && t < 0.58 ? 1 : 0;
    return {
      opacity: interpolate(
        t,
        [0.46, 0.5, 0.56, 0.62],
        [0, 0.7, 0.4, 0],
        "clamp"
      ),
      transform: [{ translateX: kick * -5 }],
    };
  });

  const glitchVioletStyle = useAnimatedStyle(() => {
    if (staticPose) return { opacity: 0 };
    const t = progress.value;
    const kick = t > 0.48 && t < 0.58 ? 1 : 0;
    return {
      opacity: interpolate(
        t,
        [0.46, 0.5, 0.56, 0.62],
        [0, 0.55, 0.35, 0],
        "clamp"
      ),
      transform: [{ translateX: kick * 6 }],
    };
  });

  const fillStyle = useAnimatedStyle(() => {
    if (staticPose) return { opacity: 1, transform: [{ scale: 1 }] };
    const t = progress.value;
    return {
      opacity: interpolate(t, [0.54, 0.64], [0, 1], "clamp"),
      transform: [
        {
          scale: interpolate(
            t,
            [0.54, 0.64, 0.72, 0.78, 0.86, 0.94],
            [0.92, 1, 1, 1.14, 0.97, 1],
            "clamp"
          ),
        },
      ],
    };
  });

  const beatStyle = useAnimatedStyle(() => {
    if (staticPose) return { opacity: 0, transform: [{ scale: 1 }] };
    const t = progress.value;
    return {
      opacity: interpolate(t, [0.72, 0.78, 0.86], [0, 0.7, 0], "clamp"),
      transform: [
        {
          scale: interpolate(t, [0.72, 0.78, 0.86], [1, 1.24, 1.06], "clamp"),
        },
      ],
    };
  });

  const tagStyle = useAnimatedStyle(() => {
    if (staticPose) return { opacity: 0.4 };
    const t = progress.value;
    return {
      opacity: interpolate(
        t,
        [0.2, 0.32, 0.8, 0.92],
        [0, 0.55, 0.4, 0],
        "clamp"
      ),
    };
  });

  const bracket = Math.min(width, height) * 0.055;
  const inset = 22;

  return (
    <View style={styles.root} accessibilityLabel="UNITERZ">
      <VoidCoronaFieldNative
        width={width}
        height={height}
        progress={progress}
        mode="formU"
        formUExit="lock"
        markSize={markSize}
        staticPose={staticPose}
      />

      <Animated.View
        style={[styles.scanField, scanFieldStyle]}
        pointerEvents="none"
      >
        {scanYs.map((y) => (
          <View
            key={y}
            style={[styles.scanLine, { top: y, backgroundColor: CYBER.scan }]}
          />
        ))}
      </Animated.View>

      <Animated.View
        style={[styles.sweep, { width }, sweepStyle]}
        pointerEvents="none"
      />

      <Animated.View
        style={[StyleSheet.absoluteFill, hudStyle]}
        pointerEvents="none"
      >
        <View
          style={[
            styles.corner,
            styles.tl,
            { width: bracket, height: bracket, top: inset, left: inset },
          ]}
        />
        <View
          style={[
            styles.corner,
            styles.tr,
            { width: bracket, height: bracket, top: inset, right: inset },
          ]}
        />
        <View
          style={[
            styles.corner,
            styles.bl,
            {
              width: bracket,
              height: bracket,
              bottom: inset + 48,
              left: inset,
            },
          ]}
        />
        <View
          style={[
            styles.corner,
            styles.br,
            {
              width: bracket,
              height: bracket,
              bottom: inset + 48,
              right: inset,
            },
          ]}
        />
        <Animated.View style={[styles.tagWrap, tagStyle]}>
          <Text style={styles.tag}>UNITERZ // BOOT</Text>
        </Animated.View>
      </Animated.View>

      <View style={styles.center}>
        <View style={{ width: markSize, height: markSize }}>
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <VoidCoronaUMarkNative
              size={markSize}
              fill={CYBER.red}
              style={glitchRedStyle}
            />
          </View>
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <VoidCoronaUMarkNative
              size={markSize}
              fill={CYBER.violet}
              style={glitchVioletStyle}
            />
          </View>
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <VoidCoronaUMarkNative
              size={markSize}
              fill={CYBER.redSoft}
              style={beatStyle}
            />
          </View>
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <VoidCoronaUMarkNative
              size={markSize}
              fill={CYBER.white}
              style={fillStyle}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000",
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  scanField: {
    ...StyleSheet.absoluteFillObject,
  },
  scanLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
  },
  sweep: {
    position: "absolute",
    left: 0,
    height: 2,
    backgroundColor: "rgba(200, 40, 70, 0.55)",
    shadowColor: "#C41E3A",
    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  corner: {
    position: "absolute",
    borderColor: CYBER.frame,
  },
  tl: {
    borderTopWidth: 2,
    borderLeftWidth: 2,
  },
  tr: {
    borderTopWidth: 2,
    borderRightWidth: 2,
  },
  bl: {
    borderBottomWidth: 2,
    borderLeftWidth: 2,
  },
  br: {
    borderBottomWidth: 2,
    borderRightWidth: 2,
  },
  tagWrap: {
    position: "absolute",
    bottom: 64,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  tag: {
    color: CYBER.gray,
    fontSize: 10,
    letterSpacing: 3.2,
    fontWeight: "600",
  },
});
