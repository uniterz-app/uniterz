import type { ReactNode } from "react";
import { Modal, Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";
import { RankingsShellGridOverlay } from "../rankings/rankingsUiDecorations";
import { communityCrtStyles } from "./communityCrtThemeNative";

export function CommunityCrtSectionLabelNative({
  children,
  suffix,
}: {
  children: string;
  suffix?: string;
}) {
  return (
    <View style={styles.sectionRow}>
      <View style={[communityCrtStyles.sectionLine, communityCrtStyles.sectionLineLeft]} />
      <View style={styles.sectionCenter}>
        <Text style={communityCrtStyles.sectionLabel}>{children}</Text>
        {suffix ? <Text style={communityCrtStyles.sectionSuffix}>{suffix}</Text> : null}
      </View>
      <View style={[communityCrtStyles.sectionLine, communityCrtStyles.sectionLineRight]} />
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
