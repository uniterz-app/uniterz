/** 通知設定 — Free が Pro 行を触ったときのゲート */
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { notificationProGateCopy } from "@/lib/notifications/notificationProGateCopy";
import ProCyberBadgeNative from "../kinetik/ProCyberBadgeNative";
import {
  OXANIUM_700,
  OXANIUM_800,
} from "../reports/reportThemeNative";

type Props = {
  visible: boolean;
  language: "ja" | "en";
  onClose: () => void;
  onSeePro: () => void;
};

export default function NotificationProGateModalNative({
  visible,
  language,
  onClose,
  onSeePro,
}: Props) {
  const copy = notificationProGateCopy(language);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={styles.card}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={[styles.bracket, styles.bracketTL]} pointerEvents="none" />
          <View style={[styles.bracket, styles.bracketTR]} pointerEvents="none" />
          <View style={[styles.bracket, styles.bracketBL]} pointerEvents="none" />
          <View style={[styles.bracket, styles.bracketBR]} pointerEvents="none" />

          <ScrollView
            bounces={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.inner}
          >
            <View style={styles.header}>
              <Text style={styles.eyebrow}>{copy.eyebrow}</Text>
              <Pressable
                onPress={onClose}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={copy.dismiss}
                style={styles.closeBtn}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={15}
                  color="rgba(254,243,199,0.85)"
                />
              </Pressable>
            </View>

            <View style={styles.badgeWrap}>
              <ProCyberBadgeNative premium />
            </View>

            <Text style={styles.title}>{copy.title}</Text>
            <Text style={styles.body}>{copy.body}</Text>

            <View style={styles.priceRow}>
              <View>
                <Text style={styles.priceLabel}>{copy.priceLabel}</Text>
                <View style={styles.priceLine}>
                  <Text style={styles.price}>{copy.price}</Text>
                  <Text style={styles.period}>{copy.period}</Text>
                </View>
              </View>
              <View style={styles.trialChip}>
                <Text style={styles.trialText}>{copy.trial}</Text>
              </View>
            </View>

            <View style={styles.bulletPanel}>
              {copy.bullets.map((item) => (
                <View key={item.title} style={styles.bulletRow}>
                  <View style={styles.bulletDot} />
                  <View style={styles.bulletCopy}>
                    <Text style={styles.bulletTitle}>{item.title}</Text>
                    <Text style={styles.bulletDetail}>{item.detail}</Text>
                  </View>
                </View>
              ))}
            </View>

            <Pressable
              onPress={onSeePro}
              style={({ pressed }) => [styles.cta, pressed && { opacity: 0.88 }]}
              accessibilityRole="button"
              accessibilityLabel={copy.cta}
            >
              <Text style={styles.ctaLabel}>{copy.cta}</Text>
            </Pressable>

            <Pressable onPress={onClose} hitSlop={8}>
              <Text style={styles.dismiss}>{copy.dismiss}</Text>
            </Pressable>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    backgroundColor: "rgba(5,2,8,0.78)",
  },
  card: {
    width: "100%",
    maxWidth: 400,
    maxHeight: "88%",
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.4)",
    backgroundColor: "#140e06",
    overflow: "hidden",
    shadowColor: "#FBBF24",
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
  },
  bracket: {
    position: "absolute",
    width: 12,
    height: 12,
    zIndex: 2,
  },
  bracketTL: {
    top: 8,
    left: 8,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: "rgba(252,211,77,0.7)",
  },
  bracketTR: {
    top: 8,
    right: 8,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderColor: "rgba(252,211,77,0.7)",
  },
  bracketBL: {
    bottom: 8,
    left: 8,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderColor: "rgba(252,211,77,0.7)",
  },
  bracketBR: {
    bottom: 8,
    right: 8,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: "rgba(252,211,77,0.7)",
  },
  inner: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 18,
    gap: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  eyebrow: {
    fontFamily: OXANIUM_700,
    fontSize: 10,
    letterSpacing: 2,
    color: "rgba(253,230,138,0.88)",
    textTransform: "uppercase",
  },
  closeBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeWrap: {
    alignItems: "center",
    transform: [{ scale: 1.35 }],
    marginVertical: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    lineHeight: 24,
    color: "#ffffff",
    textAlign: "center",
  },
  body: {
    fontSize: 13,
    lineHeight: 20,
    color: "rgba(255,255,255,0.72)",
    textAlign: "center",
    marginTop: -4,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.35)",
    backgroundColor: "rgba(245,158,11,0.08)",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  priceLabel: {
    fontFamily: OXANIUM_700,
    fontSize: 10,
    letterSpacing: 1.2,
    color: "rgba(253,230,138,0.8)",
    textTransform: "uppercase",
  },
  priceLine: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
    marginTop: 2,
  },
  price: {
    fontFamily: OXANIUM_800,
    fontSize: 22,
    color: "#fde68a",
  },
  period: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(254,243,199,0.72)",
  },
  trialChip: {
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.45)",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  trialText: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(253,230,138,0.95)",
  },
  bulletPanel: {
    borderWidth: 1,
    borderColor: "rgba(251,146,60,0.45)",
    backgroundColor: "rgba(249,115,22,0.07)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  bulletDot: {
    width: 6,
    height: 6,
    marginTop: 5,
    borderRadius: 1,
    backgroundColor: "#fdba74",
  },
  bulletCopy: {
    flex: 1,
    minWidth: 0,
  },
  bulletTitle: {
    fontFamily: OXANIUM_800,
    fontSize: 11,
    letterSpacing: 0.4,
    color: "#ffedd5",
  },
  bulletDetail: {
    marginTop: 2,
    fontSize: 11,
    lineHeight: 15,
    color: "rgba(255,255,255,0.7)",
  },
  cta: {
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    backgroundColor: "#00F5FF",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  ctaLabel: {
    fontFamily: OXANIUM_800,
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: "#050508",
  },
  dismiss: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.55)",
    textAlign: "center",
    textDecorationLine: "underline",
  },
});
