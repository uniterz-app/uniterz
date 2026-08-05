/**
 * Web `ReferralStampCelebrateOverlay` 相当 — 招待達成「スタンプ・ドン」
 */
import { useEffect } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import UniterzClearStampNative from "./UniterzClearStampNative";
import {
  REFERRAL_STAMP_CELEBRATE_MOTION_MS as M,
  referralStampCelebrateContent,
} from "../../../../../../lib/referral/referralStampCelebrate";
import type { ReferralStampToneId } from "../../../../../../lib/referral/referralStampBoard";
import { CYBER_TAB_CYAN } from "../../../ui/cyberSideMenuNative";

const SLAM_EASE = Easing.bezier(0.16, 0.84, 0.24, 1.12);

function flashColorForTone(tone: ReferralStampToneId): string {
  switch (tone) {
    case "lime":
      return "rgba(184,255,60,0.45)";
    case "amber":
      return "rgba(251,191,36,0.45)";
    case "ink":
      return "rgba(255,45,85,0.4)";
    default:
      return "rgba(0,245,255,0.45)";
  }
}

type Props = {
  open: boolean;
  slotIndex: number;
  isJa?: boolean;
  replayKey?: number;
  onClose: () => void;
  onViewStampRally: () => void;
};

export default function ReferralStampCelebrateOverlayNative({
  open,
  slotIndex,
  isJa = true,
  replayKey = 0,
  onClose,
  onViewStampRally,
}: Props) {
  const reduceMotion = useReducedMotion() ?? false;
  const content = referralStampCelebrateContent(slotIndex, isJa);
  const stampRotate = -10 - (content.slotIndex % 3);

  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(stampRotate);
  const flashOpacity = useSharedValue(0);
  const flashScale = useSharedValue(0.6);

  useEffect(() => {
    if (!open) return;
    if (reduceMotion) {
      scale.value = 1;
      translateY.value = 0;
      rotate.value = stampRotate;
      flashOpacity.value = 0;
      return;
    }
    scale.value = 2.35;
    translateY.value = -48;
    rotate.value = stampRotate - 14;
    flashOpacity.value = 0;
    flashScale.value = 0.6;

    scale.value = withTiming(1, { duration: M.stampSlamMs, easing: SLAM_EASE });
    translateY.value = withTiming(0, {
      duration: M.stampSlamMs,
      easing: SLAM_EASE,
    });
    rotate.value = withTiming(stampRotate, {
      duration: M.stampSlamMs,
      easing: SLAM_EASE,
    });

    const flashAt = Math.round(M.stampSlamMs * 0.72);
    flashOpacity.value = withDelay(
      flashAt,
      withSequence(
        withTiming(0.9, { duration: 80 }),
        withTiming(0, { duration: 400 })
      )
    );
    flashScale.value = withDelay(
      flashAt,
      withTiming(1.35, { duration: 480, easing: Easing.out(Easing.quad) })
    );
  }, [
    open,
    replayKey,
    slotIndex,
    reduceMotion,
    stampRotate,
    scale,
    translateY,
    rotate,
    flashOpacity,
    flashScale,
  ]);

  const stampStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
    transform: [{ scale: flashScale.value }],
  }));

  function handleViewStampRally() {
    onClose();
    onViewStampRally();
  }

  return (
    <Modal
      visible={open}
      transparent
      animationType={reduceMotion ? "none" : "fade"}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.root} accessibilityViewIsModal>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={content.dismissLabel}
        />

        <View style={styles.glow} pointerEvents="none" />

        <View style={styles.center}>
          <View style={styles.stampStage}>
            {!reduceMotion ? (
              <Animated.View
                style={[
                  styles.flash,
                  { backgroundColor: flashColorForTone(content.tone) },
                  flashStyle,
                ]}
                pointerEvents="none"
              />
            ) : null}
            <Animated.View style={[styles.stampWrap, stampStyle]}>
              <UniterzClearStampNative size={200} tone={content.tone} />
            </Animated.View>
          </View>

          {reduceMotion ? (
            <View style={styles.copyBlock}>
              <Text style={styles.kicker}>INVITE CLEAR</Text>
              <Text style={styles.title}>{content.title}</Text>
              <Text style={styles.desc}>{content.description}</Text>
              <Text style={styles.units}>{content.unitsLine}</Text>
            </View>
          ) : (
            <Animated.View
              entering={FadeInDown.duration(M.copyFadeMs).delay(M.copyDelayMs)}
              style={styles.copyBlock}
            >
              <Text style={styles.kicker}>INVITE CLEAR</Text>
              <Text style={styles.title} accessibilityRole="header">
                {content.title}
              </Text>
              <Text style={styles.desc}>{content.description}</Text>
              <Text style={styles.units}>{content.unitsLine}</Text>
            </Animated.View>
          )}

          {reduceMotion ? (
            <View style={styles.ctaBlock}>
              <Pressable style={styles.primaryBtn} onPress={handleViewStampRally}>
                <Text style={styles.primaryBtnText}>{content.ctaLabel}</Text>
              </Pressable>
              <Pressable style={styles.ghostBtn} onPress={onClose}>
                <Text style={styles.ghostBtnText}>{content.dismissLabel}</Text>
              </Pressable>
            </View>
          ) : (
            <Animated.View
              entering={FadeIn.duration(M.ctaFadeMs).delay(M.ctaDelayMs)}
              style={styles.ctaBlock}
            >
              <Pressable style={styles.primaryBtn} onPress={handleViewStampRally}>
                <Text style={styles.primaryBtnText}>{content.ctaLabel}</Text>
              </Pressable>
              <Pressable style={styles.ghostBtn} onPress={onClose}>
                <Text style={styles.ghostBtnText}>{content.dismissLabel}</Text>
              </Pressable>
            </Animated.View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.72)",
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,245,255,0.08)",
  },
  center: {
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
  },
  stampStage: {
    width: 220,
    height: 220,
    alignItems: "center",
    justifyContent: "center",
  },
  flash: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 999,
  },
  stampWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  copyBlock: {
    marginTop: 4,
    alignItems: "center",
    width: "100%",
  },
  kicker: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2.2,
    color: "rgba(103,232,249,0.7)",
    textTransform: "uppercase",
  },
  title: {
    marginTop: 8,
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
  },
  desc: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
  },
  units: {
    marginTop: 6,
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.5,
    color: "rgba(207,250,254,1)",
    textAlign: "center",
  },
  ctaBlock: {
    marginTop: 28,
    width: "100%",
    gap: 10,
  },
  primaryBtn: {
    borderWidth: 1,
    borderColor: "rgba(103,232,249,0.5)",
    backgroundColor: "rgba(34,211,238,0.15)",
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryBtnText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.4,
    color: CYBER_TAB_CYAN,
    textTransform: "uppercase",
  },
  ghostBtn: {
    paddingVertical: 8,
    alignItems: "center",
  },
  ghostBtnText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: "rgba(255,255,255,0.45)",
    textTransform: "uppercase",
  },
});
