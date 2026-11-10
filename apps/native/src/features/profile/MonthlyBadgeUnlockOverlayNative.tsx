/**
 * 月間ランキングバッジの受け取り演出。上から落ちてきて着地で振動、光が走る。タップで裏返して刻印を見る。
 */
import { useEffect } from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Canvas, Circle, RadialGradient, vec } from "@shopify/react-native-skia";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import MonthlyBadgeShowcaseNative from "./MonthlyBadgeShowcaseNative";
import { hapticImpact, hapticSuccess } from "../../lib/hapticsNative";
import { badgeDetailModalCopy } from "../../../../../lib/badges/badgeDetailModalCopy";
import {
  monthlyBadgeCopy,
  type MonthlyBadgeRecord,
  type MonthlyBadgeRef,
} from "../../../../../lib/badges/monthlyRankingBadge";

const OXANIUM_BOLD = Platform.select({ ios: "Oxanium_700Bold", android: "Oxanium_700Bold", default: "sans-serif" });
const MONO = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" });

const GLOW: Record<number, string> = { 1: "#ffd36b", 2: "#dfe6ee", 3: "#e09a5c" };
const FALL_MS = 520;

type Props = {
  badgeRef: MonthlyBadgeRef;
  record?: MonthlyBadgeRecord | null;
  language: string;
  onClose: () => void;
};

export default function MonthlyBadgeUnlockOverlayNative({ badgeRef, record, language, onClose }: Props) {
  const ui = badgeDetailModalCopy(language);
  const copy = monthlyBadgeCopy(badgeRef, ui.lang);
  const reduceMotion = useReducedMotion() ?? false;
  const { width, height } = useWindowDimensions();
  const size = Math.min(268, width - 72);
  const glowSize = size * 1.7;
  const glowColor = GLOW[Math.min(badgeRef.rank, 3)] ?? GLOW[1];

  const drop = useSharedValue(reduceMotion ? 0 : -height * 0.65);
  const tilt = useSharedValue(reduceMotion ? 0 : -14);
  const glow = useSharedValue(0);
  const glowScale = useSharedValue(0.6);
  const text = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      glow.value = withTiming(0.5, { duration: 300 });
      glowScale.value = 1.1;
      text.value = withTiming(1, { duration: 300 });
      return;
    }
    drop.value = withSequence(
      withTiming(0, { duration: FALL_MS, easing: Easing.in(Easing.quad) }),
      withTiming(-16, { duration: 140, easing: Easing.out(Easing.quad) }),
      withTiming(0, { duration: 170, easing: Easing.in(Easing.quad) })
    );
    tilt.value = withTiming(0, { duration: FALL_MS + 200, easing: Easing.out(Easing.cubic) });
    glow.value = withDelay(
      FALL_MS - 40,
      withSequence(withTiming(1, { duration: 180 }), withTiming(0.5, { duration: 1100 }))
    );
    glowScale.value = withDelay(FALL_MS - 40, withTiming(1.15, { duration: 900, easing: Easing.out(Easing.cubic) }));
    text.value = withDelay(FALL_MS + 300, withTiming(1, { duration: 420 }));
    const land = setTimeout(() => hapticImpact("heavy"), FALL_MS);
    const done = setTimeout(() => hapticSuccess(), FALL_MS + 330);
    return () => {
      clearTimeout(land);
      clearTimeout(done);
    };
  }, [reduceMotion, drop, tilt, glow, glowScale, text]);

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: drop.value }, { rotate: `${tilt.value}deg` }],
  }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value, transform: [{ scale: glowScale.value }] }));
  const textStyle = useAnimatedStyle(() => ({
    opacity: text.value,
    transform: [{ translateY: (1 - text.value) * 8 }],
  }));

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.backdrop}>
        <Animated.View style={textStyle}>
          <Text style={styles.kicker}>{ui.newBadgeKicker}</Text>
        </Animated.View>

        <View style={[styles.stage, { width: size, height: size }]}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.glow,
              { width: glowSize, height: glowSize, left: (size - glowSize) / 2, top: (size - glowSize) / 2 },
              glowStyle,
            ]}
          >
            <Canvas style={{ width: glowSize, height: glowSize }}>
              <Circle cx={glowSize / 2} cy={glowSize / 2} r={glowSize / 2}>
                <RadialGradient
                  c={vec(glowSize / 2, glowSize / 2)}
                  r={glowSize / 2}
                  colors={[`${glowColor}66`, `${glowColor}22`, `${glowColor}00`]}
                  positions={[0, 0.45, 1]}
                />
              </Circle>
            </Canvas>
          </Animated.View>
          <Animated.View style={badgeStyle}>
            <MonthlyBadgeShowcaseNative
              badgeRef={badgeRef}
              record={record}
              size={size}
              introSheenDelayMs={reduceMotion ? 0 : FALL_MS + 280}
            />
          </Animated.View>
        </View>

        <Animated.View style={[styles.copy, textStyle]}>
          <Text style={styles.title}>{copy.title}</Text>
          <Text style={styles.desc}>{copy.description}</Text>
          <Text style={styles.hint}>{ui.flipHint}</Text>
          <Pressable onPress={onClose} accessibilityRole="button" style={styles.closeBtn}>
            <Text style={styles.closeText}>{ui.close}</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.88)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  kicker: {
    fontFamily: MONO,
    fontSize: 10,
    letterSpacing: 2.4,
    textTransform: "uppercase",
    color: "rgba(244,224,176,0.78)",
    marginBottom: 14,
  },
  stage: {
    alignItems: "center",
    justifyContent: "center",
  },
  glow: {
    position: "absolute",
  },
  copy: {
    marginTop: 18,
    alignItems: "center",
    maxWidth: 320,
  },
  title: {
    color: "rgba(252,246,232,0.96)",
    fontSize: 17,
    lineHeight: 23,
    fontFamily: OXANIUM_BOLD,
    textAlign: "center",
  },
  desc: {
    marginTop: 6,
    color: "rgba(244,224,176,0.52)",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  hint: {
    marginTop: 10,
    fontFamily: MONO,
    fontSize: 8,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: "rgba(244,224,176,0.4)",
  },
  closeBtn: {
    marginTop: 18,
    minWidth: 160,
    paddingVertical: 11,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: "rgba(201,162,39,0.55)",
    borderRadius: 2,
    alignItems: "center",
  },
  closeText: {
    fontFamily: OXANIUM_BOLD,
    fontSize: 13,
    letterSpacing: 1.6,
    color: "rgba(252,246,232,0.92)",
  },
});
