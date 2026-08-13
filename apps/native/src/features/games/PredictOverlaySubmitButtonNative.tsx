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
import { PREDICT_OVERLAY_SUBMIT_BTN_CUT } from "./matchListCyberClipPath";
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
      >
        <PredictOverlayChamferedFrameNative
          key={enabled ? "submit-on" : "submit-off"}
          cut={PREDICT_OVERLAY_SUBMIT_BTN_CUT}
          gradientColors={
            enabled
              ? [
                  "rgba(0,245,255,0.34)",
                  "rgba(0,210,240,0.48)",
                  "rgba(0,140,180,0.58)",
                ]
              : [
                  "rgba(148,163,184,0.07)",
                  "rgba(71,85,105,0.13)",
                  "rgba(51,65,85,0.17)",
                ]
          }
          gradientLocations={[0, 0.42, 1]}
          borderColor={
            enabled ? "rgba(0,245,255,0.62)" : "rgba(148,163,184,0.2)"
          }
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
          <Text style={[styles.label, !enabled && styles.labelDisabled]}>
            {enabled ? label : disabledLabel ?? label}
          </Text>
        </PredictOverlayChamferedFrameNative>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    position: "relative",
  },
  glowPlate: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 4,
    backgroundColor: "rgba(0,245,255,0.55)",
    shadowColor: "#00F5FF",
    shadowOpacity: 0.9,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  root: {
    width: "100%",
  },
  content: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  label: {
    color: "#f0fdff",
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700",
    letterSpacing: 0.8,
    textShadowColor: "rgba(0,245,255,0.42)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },
  labelDisabled: {
    color: "rgba(255,255,255,0.36)",
    textShadowRadius: 0,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
});
