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
      <View
        style={[
          communityCrtStyles.sectionLine,
          communityCrtStyles.sectionLineLeft,
          isAmber && styles.lineAmberLeft,
        ]}
      />
      <View style={styles.sectionCenter}>
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
      <View
        style={[
          communityCrtStyles.sectionLine,
          communityCrtStyles.sectionLineRight,
          isAmber && styles.lineAmberRight,
        ]}
      />
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
          <RankingsShellGridOverlay borderRadius={16} />
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
    gap: 12,
    marginBottom: 12,
  },
  sectionCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
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
  lineAmberLeft: {
    borderTopColor: "rgba(251,191,36,0.32)",
  },
  lineAmberRight: {
    borderTopColor: "rgba(251,191,36,0.12)",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    padding: 16,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(12,20,25,0.95)",
    overflow: "hidden",
    maxHeight: "92%",
  },
  cardInner: {
    position: "relative",
    zIndex: 1,
    padding: 20,
  },
});
