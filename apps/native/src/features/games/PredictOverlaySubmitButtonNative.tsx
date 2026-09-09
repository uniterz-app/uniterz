/**
 * Web `.predict-overlay-submit-btn` 相当。
 */
import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import PredictOverlayChamferedFrameNative from "./PredictOverlayChamferedFrameNative";
import { registerTutorialPredictSubmit } from "../tutorial/tutorialPredictSubmitBridgeNative";

type Props = {
  label: string;
  disabledLabel?: string;
  enabled: boolean;
  onPress: () => void;
  /** チュートリアル時は有効化でパルス発光 */
  tutorialPulse?: boolean;
};

export default function PredictOverlaySubmitButtonNative({
  label,
  disabledLabel,
  enabled,
  onPress,
  tutorialPulse = false,
}: Props) {
  const reduceMotion = useReducedMotion() ?? false;
  const glow = useSharedValue(0);

  useEffect(() => {
    return registerTutorialPredictSubmit({
      submit: onPress,
      enabled,
      label: enabled ? label : disabledLabel ?? label,
    });
  }, [enabled, label, disabledLabel, onPress]);

  useEffect(() => {
    cancelAnimation(glow);
    if (!enabled || !tutorialPulse || reduceMotion) {
      glow.value = enabled && tutorialPulse ? 1 : 0;
      return;
    }
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.35, { duration: 700, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );
    return () => {
      cancelAnimation(glow);
    };
  }, [enabled, tutorialPulse, reduceMotion, glow]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: enabled ? 0.35 + glow.value * 0.55 : 0,
    transform: [{ scale: 1 + glow.value * 0.012 }],
  }));

  return (
    <View style={styles.wrap}>
      {enabled && tutorialPulse ? (
        <Animated.View
          pointerEvents="none"
          style={[styles.glowPlate, glowStyle]}
        />
      ) : null}
      <Pressable
        disabled={!enabled}
        onPress={onPress}
        style={({ pressed }) => [pressed && enabled ? styles.pressed : null]}
        accessibilityRole="button"
        accessibilityState={{ disabled: !enabled }}
      >
        {/* 外枠リング — 背景に溶けないよう明示的なシアン縁 */}
        <View
          style={[
            styles.outerRing,
            enabled ? styles.outerRingOn : styles.outerRingOff,
          ]}
        >
          <PredictOverlayChamferedFrameNative
            key={enabled ? "submit-on" : "submit-off"}
            cut={0}
            gradientColors={
              enabled
                ? [
                    "rgba(0,245,255,0.48)",
                    "rgba(0,200,235,0.58)",
                    "rgba(0,120,170,0.68)",
                  ]
                : [
                    "rgba(148,163,184,0.1)",
                    "rgba(71,85,105,0.16)",
                    "rgba(51,65,85,0.2)",
                  ]
            }
            gradientLocations={[0, 0.46, 1]}
            borderColor={
              enabled ? "rgba(180,255,255,0.72)" : "rgba(148,163,184,0.28)"
            }
            borderWidth={1.5}
            /**
             * RN の shadow/elevation は矩形のまま出るため、角切りボタンの下に
             * 「ずれた影プレート」が見える。Web は clip-path で影も切れるが Native では不可。
             * チュートリアル発光は背面の glowPlate で表現する。
             */
            shadowOpacity={0}
            maskCorners={false}
            overflowHidden
            style={styles.root}
            contentStyle={styles.content}
          >
            <View
              pointerEvents="none"
              style={[
                styles.insetShine,
                !enabled ? styles.insetShineOff : null,
              ]}
            />
            <Text style={[styles.label, !enabled && styles.labelDisabled]}>
              {enabled ? label : disabledLabel ?? label}
            </Text>
          </PredictOverlayChamferedFrameNative>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    position: "relative",
    marginTop: 4,
  },
  glowPlate: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 2,
    backgroundColor: "rgba(0,245,255,0.55)",
    shadowColor: "#00F5FF",
    shadowOpacity: 0.9,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  outerRing: {
    width: "100%",
    borderWidth: 1,
    padding: 2,
  },
  outerRingOn: {
    borderColor: "rgba(0,245,255,0.55)",
    backgroundColor: "rgba(0,245,255,0.08)",
  },
  outerRingOff: {
    borderColor: "rgba(148,163,184,0.22)",
    backgroundColor: "rgba(15,23,42,0.35)",
  },
  root: {
    width: "100%",
  },
  content: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    position: "relative",
  },
  insetShine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  insetShineOff: {
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  label: {
    color: "#F0FDFF",
    fontSize: 15,
    lineHeight: 19,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    textShadowColor: "rgba(0,245,255,0.65)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  labelDisabled: {
    color: "rgba(255,255,255,0.4)",
    textShadowRadius: 0,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
});
