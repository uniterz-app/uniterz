import { Image, Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import type { ResolvedBadgeNative } from "./useNativeProfileBadges";

type Props = {
  visible: boolean;
  badge: ResolvedBadgeNative | null;
  language: "ja" | "en";
  onClose: () => void;
};

export default function ProfileBadgeDetailModal({
  visible,
  badge,
  language,
  onClose,
}: Props) {
  const isJa = language === "ja";
  if (!badge) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{badge.title}</Text>
          {badge.icon ? (
            <Image source={{ uri: badge.icon }} style={styles.icon} resizeMode="contain" />
          ) : null}
          <Text style={styles.desc}>{badge.description}</Text>
          {badge.grantedAt ? (
            <Text style={styles.meta}>
              {isJa ? "付与日: " : "Granted: "}
              {badge.grantedAt.toLocaleDateString(isJa ? "ja-JP" : "en-US")}
            </Text>
          ) : null}
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>{isJa ? "閉じる" : "Close"}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    padding: 24,
  },
  sheet: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "#0b1120",
    padding: 20,
    maxWidth: 400,
    alignSelf: "center",
    width: "100%",
  },
  title: {
    color: "rgba(248,250,252,0.96)",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 12,
    fontFamily: Platform.select({
      ios: "Oxanium_800ExtraBold",
      android: "Oxanium_800ExtraBold",
      default: "sans-serif",
    }),
  },
  icon: {
    width: 96,
    height: 96,
    alignSelf: "center",
    marginBottom: 12,
  },
  desc: {
    color: "rgba(226,232,240,0.88)",
    fontSize: 14,
    lineHeight: 21,
  },
  meta: {
    marginTop: 12,
    fontSize: 12,
    color: "rgba(148,163,184,0.9)",
  },
  closeBtn: {
    marginTop: 20,
    alignSelf: "flex-end",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "rgba(45,99,235,0.5)",
  },
  closeText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
});
