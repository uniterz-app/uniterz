import { Image, Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useEffect } from "react";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  useReducedMotion,
} from "react-native-reanimated";
import type { ResolvedBadgeNative } from "./useNativeProfileBadges";
import VelvetTuftFieldNative from "./VelvetTuftFieldNative";
import {
  badgeParticipantLabel,
  formatBadgeParticipantCount,
  readBadgeParticipantCount,
} from "../../../../../lib/badges/badgeCohort";

type Props = {
  visible: boolean;
  badge: ResolvedBadgeNative | null;
  language: "ja" | "en";
  onClose: () => void;
};

const OXANIUM_BOLD = Platform.select({
  ios: "Oxanium_700Bold",
  android: "Oxanium_700Bold",
  default: "sans-serif",
});

const MONO = Platform.select({
  ios: "Menlo",
  android: "monospace",
  default: "monospace",
});

function BadgeHeroNative({ icon }: { icon: string }) {
  const reduceMotion = useReducedMotion();
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      translateY.value = 0;
      return;
    }
    translateY.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
  }, [reduceMotion, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <View style={styles.hero}>
      <View style={styles.heroGlow} />
      <Animated.View style={animatedStyle}>
        <Image source={{ uri: icon }} style={styles.icon} resizeMode="contain" />
      </Animated.View>
    </View>
  );
}

export default function ProfileBadgeDetailModal({
  visible,
  badge,
  language,
  onClose,
}: Props) {
  const isJa = language === "ja";
  if (!badge) return null;

  const awardedLabel = isJa ? "付与日" : "Granted";
  const lang = isJa ? "ja" : "en";
  const participantCount = readBadgeParticipantCount(badge);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.panel} onPress={(e) => e.stopPropagation()}>
          <Pressable style={styles.closeBtn} onPress={onClose} accessibilityRole="button">
            <Text style={styles.closeGlyph}>×</Text>
          </Pressable>

          <View style={styles.heroStage}>
            <VelvetTuftFieldNative contained />
            {badge.icon ? <BadgeHeroNative icon={badge.icon} /> : null}
          </View>

          <View style={styles.copy}>
            <Text style={styles.kicker}>{isJa ? "バッジ" : "Badge"}</Text>
            <Text style={styles.title}>{badge.title}</Text>
            {badge.description ? <Text style={styles.desc}>{badge.description}</Text> : null}

            {badge.grantedAt || participantCount != null ? (
              <View style={styles.metaBlock}>
                {badge.grantedAt ? (
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>{awardedLabel}</Text>
                    <Text style={styles.metaDot}>·</Text>
                    <Text style={styles.metaValue}>
                      {badge.grantedAt.toLocaleDateString(isJa ? "ja-JP" : "en-US")}
                    </Text>
                  </View>
                ) : null}
                {participantCount != null ? (
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>{badgeParticipantLabel(lang)}</Text>
                    <Text style={styles.metaDot}>·</Text>
                    <Text style={styles.metaValue}>
                      {formatBadgeParticipantCount(participantCount, lang)}
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.78)",
    justifyContent: "center",
    padding: 18,
  },
  panel: {
    alignSelf: "center",
    width: "100%",
    maxWidth: 328,
    borderWidth: 1,
    borderColor: "rgba(201,162,39,0.38)",
    borderRadius: 3,
    backgroundColor: "#070707",
    overflow: "hidden",
  },
  heroStage: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 24,
    paddingHorizontal: 18,
    paddingBottom: 16,
    overflow: "hidden",
  },
  copy: {
    backgroundColor: "#070707",
    paddingTop: 15,
    paddingHorizontal: 18,
    paddingBottom: 18,
    borderTopWidth: 1,
    borderTopColor: "rgba(201,162,39,0.28)",
  },
  closeBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 4,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  closeGlyph: {
    color: "rgba(244,224,176,0.42)",
    fontSize: 22,
    lineHeight: 24,
    marginTop: -2,
  },
  hero: {
    alignSelf: "center",
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  heroGlow: {
    position: "absolute",
    width: "64%",
    height: "64%",
    borderRadius: 999,
    backgroundColor: "rgba(236,212,138,0.16)",
  },
  icon: {
    width: 140,
    height: 140,
  },
  kicker: {
    fontFamily: MONO,
    fontSize: 9,
    fontWeight: "500",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "rgba(244,224,176,0.72)",
    marginBottom: 6,
  },
  title: {
    color: "rgba(252,246,232,0.96)",
    fontSize: 17,
    lineHeight: 23,
    fontWeight: "700",
    fontFamily: OXANIUM_BOLD,
    textShadowColor: "rgba(0,0,0,0.55)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  desc: {
    marginTop: 6,
    color: "rgba(244,224,176,0.48)",
    fontSize: 12,
    lineHeight: 18,
  },
  metaBlock: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(201,162,39,0.18)",
    gap: 6,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
  },
  metaLabel: {
    fontFamily: MONO,
    fontSize: 9,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: "rgba(244,224,176,0.38)",
  },
  metaDot: {
    fontFamily: MONO,
    fontSize: 9,
    color: "rgba(244,224,176,0.38)",
  },
  metaValue: {
    fontFamily: MONO,
    fontSize: 9,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: "rgba(244,224,176,0.62)",
    fontVariant: ["tabular-nums"],
  },
});
