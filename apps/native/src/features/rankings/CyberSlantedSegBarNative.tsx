import { memo, useLayoutEffect, useRef } from "react";
import { Platform, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import type { CyberSegAccent } from "../../../../../app/component/rankings/CyberSlantedSegBar";

/** Web `CyberSlantedSegBar` */
const SEG_STAGGER_MS = 22;
const SEG_OPACITY_DURATION_MS = 160;
const SEG_SKEW_DEG = "-16deg";
const UNLIT_BORDER = "rgba(0,245,255,0.22)";
const UNLIT_BG = "rgba(255,255,255,0.03)";

function filledSegCount(pct: number, segments: number): number {
  return Math.round((Math.min(100, Math.max(0, pct)) / 100) * segments);
}

/** Web `.cyber-slanted-seg__scan` */
function SegGrillLines({ height }: { height: number }) {
  const lineCount = Math.max(1, Math.floor(height / 2));
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {Array.from({ length: lineCount }, (_, i) => (
        <View key={`grill-${i}`} style={[styles.grillLine, { top: i * 2 + 1 }]} />
      ))}
    </View>
  );
}

const SlantedSegItem = memo(function SlantedSegItem({
  index,
  lit,
  height,
  accent,
  enterActive,
  enterDelayMs,
  forceStatic,
  replayKey,
}: {
  index: number;
  lit: boolean;
  height: number;
  accent: CyberSegAccent;
  enterActive: boolean;
  enterDelayMs: number;
  forceStatic: boolean;
  replayKey?: string | number;
}) {
  const reduceMotion = useReducedMotion() ?? false;
  const motionOff = reduceMotion || forceStatic;
  const enteredRef = useRef(false);
  const replayRef = useRef(replayKey);

  const opacity = useSharedValue(motionOff ? (lit ? 1 : 0.55) : 0);
  const scaleY = useSharedValue(motionOff ? 1 : 0.35);

  useLayoutEffect(() => {
    if (replayKey !== undefined && replayRef.current !== replayKey) {
      enteredRef.current = false;
      replayRef.current = replayKey;
    }

    if (motionOff) {
      opacity.value = lit ? 1 : 0.55;
      scaleY.value = 1;
      enteredRef.current = true;
      return;
    }

    if (!enterActive) {
      enteredRef.current = false;
      opacity.value = 0;
      scaleY.value = 0.35;
      return;
    }

    const delayMs = index * SEG_STAGGER_MS + enterDelayMs;
    const targetOpacity = lit ? 1 : 0.55;

    if (!enteredRef.current) {
      opacity.value = 0;
      scaleY.value = 0.35;
      opacity.value = withDelay(
        delayMs,
        withTiming(targetOpacity, {
          duration: SEG_OPACITY_DURATION_MS,
          easing: Easing.out(Easing.cubic),
        })
      );
      scaleY.value = withDelay(
        delayMs,
        withSpring(1, {
          stiffness: 380,
          damping: 28,
        })
      );
      enteredRef.current = true;
      return;
    }

    opacity.value = withTiming(targetOpacity, {
      duration: 180,
      easing: Easing.out(Easing.cubic),
    });
    scaleY.value = 1;
  }, [
    motionOff,
    enterActive,
    lit,
    index,
    enterDelayMs,
    opacity,
    scaleY,
    replayKey,
  ]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scaleY: scaleY.value }],
  }));

  return (
    <View style={styles.segSlot}>
      <Animated.View
        style={[
          styles.segGlowWrap,
          lit
            ? Platform.select({
                ios: {
                  shadowColor: accent.glow,
                  shadowOpacity: 0.85,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 0 },
                },
                android: { elevation: 4 },
                default: {},
              })
            : null,
          animStyle,
        ]}
      >
        <View style={styles.segSkew}>
          <View
            style={[
              styles.segFace,
              { height },
              lit
                ? {
                    backgroundColor: accent.border,
                    borderColor: accent.bg ?? accent.border,
                  }
                : {
                    backgroundColor: UNLIT_BG,
                    borderColor: UNLIT_BORDER,
                  },
            ]}
          >
            {lit ? (
              <>
                <View
                  pointerEvents="none"
                  style={[styles.segTopHighlight, { backgroundColor: "rgba(255,255,255,0.18)" }]}
                />
                <SegGrillLines height={height} />
              </>
            ) : null}
          </View>
        </View>
      </Animated.View>
    </View>
  );
});

/** Web `CyberSlantedSegBar` のネイティブ版 */
export function CyberSlantedSegBarNative({
  pct,
  segments = 12,
  compact = false,
  tall = false,
  enterDelay = 0,
  accent,
  enter = true,
  forceStatic = false,
  replayKey,
}: {
  pct: number;
  segments?: number;
  compact?: boolean;
  tall?: boolean;
  enterDelay?: number;
  accent: CyberSegAccent;
  enter?: boolean;
  forceStatic?: boolean;
  /** タブ切替など — 値が変わるとセグメントを再点灯 */
  replayKey?: string | number;
}) {
  const reduceMotion = useReducedMotion() ?? false;
  const motionOff = reduceMotion || forceStatic;
  const enterActive = motionOff ? true : enter;
  const filled = enterActive ? filledSegCount(pct, segments) : 0;
  const segH = compact ? 9 : tall ? 13 : 11;
  const enterDelayMs = Math.round(enterDelay * 1000);

  return (
    <View style={styles.track} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {Array.from({ length: segments }).map((_, i) => (
        <SlantedSegItem
          key={i}
          index={i}
          lit={i < filled}
          height={segH}
          accent={accent}
          enterActive={enterActive}
          enterDelayMs={enterDelayMs}
          forceStatic={forceStatic}
          replayKey={replayKey}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
    width: "100%",
  },
  segSlot: {
    flex: 1,
    minWidth: 0,
  },
  segGlowWrap: {
    width: "100%",
  },
  segSkew: {
    transform: [{ skewX: SEG_SKEW_DEG }],
  },
  segFace: {
    width: "100%",
    borderWidth: 1,
    overflow: "hidden",
    position: "relative",
  },
  segTopHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  grillLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(0,0,0,0.18)",
  },
});
