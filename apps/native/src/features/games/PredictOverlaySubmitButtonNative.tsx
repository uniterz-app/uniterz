/**
 * Web `.predict-overlay-submit-btn` 相当。
 * ソリッド塗り（ガラス／発光グラデなし）・直角・1px 枠。
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
    opacity: enabled ? 0.22 + glow.value * 0.35 : 0,
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
        style={({ pressed }) => [
          styles.root,
          enabled ? styles.rootOn : styles.rootOff,
          pressed && enabled ? styles.pressed : null,
        ]}
        accessibilityRole="button"
        accessibilityState={{ disabled: !enabled }}
      >
        <Text style={[styles.label, !enabled && styles.labelDisabled]}>
          {enabled ? label : disabledLabel ?? label}
        </Text>
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
    backgroundColor: "rgba(0,245,255,0.28)",
    shadowColor: "#00F5FF",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  root: {
    width: "100%",
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 0,
    overflow: "hidden",
  },
  rootOn: {
    borderColor: "#00F5FF",
    backgroundColor: "#00F5FF",
  },
  rootOff: {
    borderColor: "rgba(148,163,184,0.28)",
    backgroundColor: "rgba(71,85,105,0.35)",
  },
  label: {
    color: "#050508",
    fontSize: 15,
    lineHeight: 19,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  labelDisabled: {
    color: "rgba(255,255,255,0.42)",
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
});
