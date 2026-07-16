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

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.panel} onPress={(e) => e.stopPropagation()}>
          <View style={styles.accent} />

          <Pressable style={styles.closeBtn} onPress={onClose} accessibilityRole="button">
            <Text style={styles.closeGlyph}>×</Text>
          </Pressable>

          {badge.icon ? <BadgeHeroNative icon={badge.icon} /> : null}

          <View style={styles.divider} />

          <Text style={styles.kicker}>{isJa ? "バッジ" : "Badge"}</Text>
          <Text style={styles.title}>{badge.title}</Text>
          {badge.description ? <Text style={styles.desc}>{badge.description}</Text> : null}

          {badge.grantedAt ? (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>{awardedLabel}</Text>
              <Text style={styles.metaDot}>·</Text>
              <Text style={styles.metaValue}>
                {badge.grantedAt.toLocaleDateString(isJa ? "ja-JP" : "en-US")}
              </Text>
            </View>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(2,5,10,0.82)",
    justifyContent: "center",
    padding: 18,
  },
  panel: {
    alignSelf: "center",
    width: "100%",
    maxWidth: 328,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 3,
    backgroundColor: "rgba(6,12,22,0.97)",
    paddingTop: 24,
    paddingHorizontal: 18,
    paddingBottom: 18,
    overflow: "hidden",
  },
  accent: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "42%",
    height: 2,
    backgroundColor: "rgba(34,211,238,0.9)",
    opacity: 0.85,
  },
  closeBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  closeGlyph: {
    color: "rgba(255,255,255,0.42)",
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
  },
  heroGlow: {
    position: "absolute",
    width: "64%",
    height: "64%",
    borderRadius: 999,
    backgroundColor: "rgba(34,211,238,0.12)",
  },
  icon: {
    width: 140,
    height: 140,
  },
  divider: {
    height: 1,
    marginTop: 16,
    marginBottom: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  kicker: {
    fontFamily: MONO,
    fontSize: 9,
    fontWeight: "500",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "rgba(34,211,238,0.55)",
    marginBottom: 6,
  },
  title: {
    color: "rgba(248,250,252,0.96)",
    fontSize: 17,
    lineHeight: 23,
    fontWeight: "700",
    fontFamily: OXANIUM_BOLD,
  },
  desc: {
    marginTop: 6,
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.07)",
  },
  metaLabel: {
    fontFamily: MONO,
    fontSize: 9,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.34)",
  },
  metaDot: {
    fontFamily: MONO,
    fontSize: 9,
    color: "rgba(255,255,255,0.34)",
  },
  metaValue: {
    fontFamily: MONO,
    fontSize: 9,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.58)",
    fontVariant: ["tabular-nums"],
  },
});
