/**
 * 案 D — コロナ心拍
 * 縁が呼吸し、待ちのあいだロゴが淡く鼓動。確定してからロック。
 * プレビューではデータ準備を ~1.1s でシミュレートし、最低尺を守る。
 */
import { useEffect, useRef } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import {
  getVoidCoronaConcept,
  VOID_CORONA_COLORS,
} from "../../../../../../lib/splash/voidCoronaConcepts";
import VoidCoronaFieldNative from "./VoidCoronaFieldNative";
import {
  VoidCoronaMarkNative,
  voidCoronaLogoSize,
} from "./VoidCoronaMarkNative";

const CONCEPT = getVoidCoronaConcept("D");
const DATA_READY_MS = 1100;
const SETTLE_MS = 700;

type Props = {
  playKey?: number;
  forceStatic?: boolean;
  onComplete?: () => void;
  /** 実データ待ちを差し替える（ms）。未指定時はプレビュー用シミュレート */
  dataReadyAfterMs?: number;
};

export default function VoidCoronaSplashDNative({
  playKey = 0,
  forceStatic = false,
  onComplete,
  dataReadyAfterMs = DATA_READY_MS,
}: Props) {
  const reduceMotion = useReducedMotion();
  const staticPose = forceStatic || reduceMotion === true;
  const { width, height } = useWindowDimensions();
  const voidD = Math.min(width, height) * 0.336;
  const { logoW, logoH } = voidCoronaLogoSize(width, voidD);
  const progress = useSharedValue(staticPose ? 1 : 0);
  const pulse = useSharedValue(staticPose ? 0.35 : 0);
  const settled = useSharedValue(staticPose ? 1 : 0);
  const doneRef = useRef(false);

  useEffect(() => {
    doneRef.current = false;
    let settleTimer: ReturnType<typeof setTimeout> | null = null;
    let readyTimer: ReturnType<typeof setTimeout> | null = null;

    if (staticPose) {
      progress.value = 1;
      pulse.value = 0.35;
      settled.value = 1;
      onComplete?.();
      return;
    }

    progress.value = 0;
    settled.value = 0;
    pulse.value = 0;
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, {
          duration: 780,
          easing: Easing.inOut(Easing.sin),
        }),
        withTiming(0.15, {
          duration: 780,
          easing: Easing.inOut(Easing.sin),
        })
      ),
      -1,
      false
    );

    progress.value = withTiming(0.45, {
      duration: CONCEPT.totalMs * 0.45,
      easing: Easing.out(Easing.cubic),
    });

    const minHold = CONCEPT.totalMs;
    const readyAt = Math.max(dataReadyAfterMs, minHold - SETTLE_MS);
    const startedAt = Date.now();

    const beginSettle = () => {
      cancelAnimation(pulse);
      pulse.value = withTiming(0.2, { duration: 280 });
      settled.value = withTiming(1, {
        duration: SETTLE_MS,
        easing: Easing.bezier(0.2, 0.9, 0.2, 1),
      });
      progress.value = withTiming(
        1,
        {
          duration: SETTLE_MS,
          easing: Easing.bezier(0.2, 0.9, 0.2, 1),
        },
        (finished) => {
          if (finished && onComplete && !doneRef.current) {
            doneRef.current = true;
            runOnJS(onComplete)();
          }
        }
      );
    };

    readyTimer = setTimeout(() => {
      const elapsed = Date.now() - startedAt;
      const waitMore = Math.max(0, minHold - SETTLE_MS - elapsed);
      if (waitMore > 0) {
        settleTimer = setTimeout(beginSettle, waitMore);
      } else {
        beginSettle();
      }
    }, readyAt);

    return () => {
      if (readyTimer) clearTimeout(readyTimer);
      if (settleTimer) clearTimeout(settleTimer);
      cancelAnimation(pulse);
    };
  }, [
    playKey,
    staticPose,
    progress,
    pulse,
    settled,
    onComplete,
    dataReadyAfterMs,
  ]);

  const softStyle = useAnimatedStyle(() => {
    if (staticPose) return { opacity: 0.45 };
    const breath = pulse.value;
    const lock = settled.value;
    return {
      opacity:
        interpolate(progress.value, [0.08, 0.22], [0, 0.45], "clamp") *
          (1 - lock) +
        interpolate(breath, [0, 1], [0.35, 0.62]) * (1 - lock),
      transform: [
        {
          scale: 1 + breath * 0.018 * (1 - lock),
        },
      ],
    };
  });

  const hardStyle = useAnimatedStyle(() => {
    if (staticPose) {
      return { opacity: 1, transform: [{ scale: 1 }] };
    }
    const lock = settled.value;
    return {
      opacity: interpolate(lock, [0, 0.55], [0, 1], "clamp"),
      transform: [
        {
          scale: interpolate(lock, [0, 0.7, 1], [0.96, 1.03, 1], "clamp"),
        },
      ],
    };
  });

  return (
    <View style={styles.root} accessibilityLabel="UNITERZ">
      <VoidCoronaFieldNative
        width={width}
        height={height}
        progress={progress}
        mode="pulse"
        pulse={pulse}
        staticPose={staticPose}
      />
      <View style={styles.center}>
        <VoidCoronaMarkNative
          width={logoW}
          height={logoH}
          fill={VOID_CORONA_COLORS.logoSoft}
          style={softStyle}
        />
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <View style={styles.centerInner}>
            <VoidCoronaMarkNative
              width={logoW}
              height={logoH}
              fill={VOID_CORONA_COLORS.logoWhite}
              style={hardStyle}
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
  centerInner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
