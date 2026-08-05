/**
 * Web `UnitEarnCelebrateOverlay` 相当 — Phase A（v2 パネル）
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
  withTiming,
} from "react-native-reanimated";
import {
  UNIT_EARN_CELEBRATE_MOTION_MS as M,
  type UnitEarnCelebratePresetId,
  unitEarnCelebrateContent,
} from "../../../../../../lib/units/unitEarnCelebrate";
import { UnitEarnVaultCoinNative } from "./UnitEarnCelebrateVisualNative";

const SLAM_EASE = Easing.bezier(0.16, 1, 0.3, 1);
const PANEL_EASE = Easing.bezier(0.22, 1, 0.36, 1);

type Props = {
  open: boolean;
  presetId: UnitEarnCelebratePresetId;
  isJa?: boolean;
  replayKey?: number;
  onClose: () => void;
  onClaim: () => void;
  onViewHistory: () => void;
};

export default function UnitEarnCelebrateOverlayNative({
  open,
  presetId,
  isJa = true,
  replayKey = 0,
  onClose,
  onClaim,
  onViewHistory,
}: Props) {
  const reduceMotion = useReducedMotion() ?? false;
  const content = unitEarnCelebrateContent(presetId, isJa);

  const heroScale = useSharedValue(1);
  const heroY = useSharedValue(0);
  const heroOpacity = useSharedValue(1);

  useEffect(() => {
    if (!open) return;
    if (reduceMotion) {
      heroScale.value = 1;
      heroY.value = 0;
      heroOpacity.value = 1;
      return;
    }
    heroScale.value = 1.28;
    heroY.value = -12;
    heroOpacity.value = 0;
    heroScale.value = withDelay(
      80,
      withTiming(1, { duration: M.amountSlamMs, easing: SLAM_EASE })
    );
    heroY.value = withDelay(
      80,
      withTiming(0, { duration: M.amountSlamMs, easing: SLAM_EASE })
    );
    heroOpacity.value = withDelay(
      80,
      withTiming(1, { duration: M.amountSlamMs, easing: SLAM_EASE })
    );
  }, [open, replayKey, presetId, reduceMotion, heroOpacity, heroScale, heroY]);

  const heroStyle = useAnimatedStyle(() => ({
    opacity: heroOpacity.value,
    transform: [{ translateY: heroY.value }, { scale: heroScale.value }],
  }));

  function handleHistory() {
    onViewHistory();
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

        <Animated.View
          entering={
            reduceMotion
              ? undefined
              : FadeInDown.duration(M.panelEnterMs).easing(PANEL_EASE)
          }
          style={styles.panel}
        >
          <View style={styles.panelTopLine} pointerEvents="none" />
          <View style={styles.panelGlow} pointerEvents="none" />

          <Text style={styles.kicker}>{content.kicker}</Text>

          <Animated.View style={[styles.heroRow, heroStyle]}>
            <UnitEarnVaultCoinNative size={64} />
            <View>
              <Text style={styles.amountHero}>{content.amountHero}</Text>
              <Text style={styles.unitLabel}>UNIT</Text>
            </View>
          </Animated.View>

          <View style={styles.divider} />
          <Text style={styles.title} accessibilityRole="header">
            {content.title}
          </Text>
          {content.subtitle ? (
            <Text style={styles.subtitle}>{content.subtitle}</Text>
          ) : null}

          <View style={styles.ctaBlock}>
            <Pressable style={styles.claimBtn} onPress={onClaim}>
              <Text style={styles.claimBtnText}>{content.claimLabel}</Text>
            </Pressable>
            <Pressable style={styles.historyBtn} onPress={handleHistory}>
              <Text style={styles.historyBtnText}>{content.historyLabel}</Text>
            </Pressable>
            <Pressable style={styles.ghostBtn} onPress={onClose}>
              <Text style={styles.ghostBtnText}>{content.dismissLabel}</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2,6,12,0.82)",
  },
  panel: {
    width: "100%",
    maxWidth: 360,
    borderWidth: 1,
    borderColor: "rgba(103,232,249,0.2)",
    backgroundColor: "rgba(4,10,16,0.96)",
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.65,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 24 },
  },
  panelTopLine: {
    position: "absolute",
    top: 0,
    left: 24,
    right: 24,
    height: 1,
    backgroundColor: "rgba(251,191,36,0.45)",
  },
  panelGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,245,255,0.04)",
  },
  kicker: {
    textAlign: "center",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 2,
    color: "rgba(103,232,249,0.55)",
    textTransform: "uppercase",
  },
  heroRow: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  amountHero: {
    fontSize: 44,
    fontWeight: "800",
    color: "#ffe9a8",
    fontVariant: ["tabular-nums"],
    textShadowColor: "rgba(246,195,68,0.35)",
    textShadowRadius: 12,
  },
  unitLabel: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 4,
    color: "rgba(251,191,36,0.45)",
  },
  divider: {
    marginTop: 24,
    marginBottom: 16,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  title: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
  },
  subtitle: {
    marginTop: 8,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(255,255,255,0.45)",
  },
  ctaBlock: {
    marginTop: 24,
    gap: 8,
  },
  claimBtn: {
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.4)",
    backgroundColor: "rgba(251,191,36,0.14)",
    paddingVertical: 14,
    alignItems: "center",
  },
  claimBtnText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.6,
    color: "#fff7e6",
    textTransform: "uppercase",
  },
  historyBtn: {
    borderWidth: 1,
    borderColor: "rgba(103,232,249,0.25)",
    paddingVertical: 11,
    alignItems: "center",
  },
  historyBtnText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.4,
    color: "rgba(207,250,254,0.75)",
    textTransform: "uppercase",
  },
  ghostBtn: {
    paddingVertical: 8,
    alignItems: "center",
  },
  ghostBtnText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: "rgba(255,255,255,0.35)",
    textTransform: "uppercase",
  },
});
