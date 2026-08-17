import type { ReactNode } from "react";
import { Modal, Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";
import { RankingsShellGridOverlay } from "../rankings/rankingsUiDecorations";
import { communityCrtStyles } from "./communityCrtThemeNative";

export function CommunityCrtSectionLabelNative({
  children,
  suffix,
  accent = "cyan",
}: {
  children: string;
  suffix?: string;
  accent?: "cyan" | "amber";
}) {
  const isAmber = accent === "amber";
  return (
    <View style={styles.sectionRow}>
      <View style={[styles.diamond, isAmber && styles.diamondAmber]} />
      <Text
        style={[
          communityCrtStyles.sectionLabel,
          isAmber && styles.labelAmber,
        ]}
      >
        {children}
      </Text>
      {suffix ? (
        <Text
          style={[
            communityCrtStyles.sectionSuffix,
            isAmber && styles.suffixAmber,
          ]}
        >
          {suffix}
        </Text>
      ) : null}
    </View>
  );
}

export function CommunityModalBackdropNative({
  visible,
  onClose,
  children,
  cardStyle,
}: {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  cardStyle?: ViewStyle;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" />
        <View style={[styles.card, cardStyle]}>
          <RankingsShellGridOverlay borderRadius={0} />
          <View style={styles.cardInner}>{children}</View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  diamond: {
    width: 5,
    height: 5,
    backgroundColor: "rgba(0,245,255,0.85)",
    transform: [{ rotate: "45deg" }],
    shadowColor: "#00F5FF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
  },
  diamondAmber: {
    backgroundColor: "rgba(251,191,36,0.85)",
    shadowColor: "#fbbf24",
  },
  labelAmber: {
    color: "rgba(253,230,138,0.88)",
    textShadowColor: "rgba(251,191,36,0.32)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  suffixAmber: {
    borderColor: "rgba(251,191,36,0.22)",
    backgroundColor: "rgba(245,158,11,0.06)",
    color: "rgba(253,230,138,0.55)",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    padding: 16,
  },
  card: {
    borderRadius: 0,
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.22)",
    backgroundColor: "rgba(5,11,20,0.97)",
    overflow: "hidden",
    maxHeight: "92%",
  },
  cardInner: {
    position: "relative",
    zIndex: 1,
    padding: 20,
  },
});
