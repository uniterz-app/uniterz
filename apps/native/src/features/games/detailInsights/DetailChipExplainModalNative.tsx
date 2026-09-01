import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import type { DetailChipExplainPayload } from "../../../../../../lib/nba/detailInsights/detailInsightTypes";

const OXANIUM = "Oxanium_700Bold";

type Props = {
  visible: boolean;
  payload: DetailChipExplainPayload | null;
  isJa: boolean;
  accent: string;
  onClose: () => void;
};

export function DetailChipExplainModalNative({
  visible,
  payload,
  isJa,
  accent,
  onClose,
}: Props) {
  return (
    <Modal
      visible={visible && payload != null}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { borderColor: accent }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.head}>
            <Text style={[styles.title, { color: accent }]}>
              {payload?.label ?? ""}
            </Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Text style={styles.close}>{isJa ? "閉じる" : "Close"}</Text>
            </Pressable>
          </View>
          <Text style={styles.body}>
            {isJa ? payload?.hintJa : payload?.hintEn}
          </Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  sheet: {
    width: "100%",
    maxWidth: 400,
    borderWidth: 1,
    backgroundColor: "#080a10",
    padding: 16,
    borderRadius: 2,
  },
  head: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  title: {
    flex: 1,
    fontFamily: OXANIUM,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  close: {
    fontFamily: OXANIUM,
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.45)",
    textTransform: "uppercase",
  },
  body: {
    fontFamily: OXANIUM,
    fontSize: 13,
    lineHeight: 20,
    color: "rgba(255,255,255,0.78)",
  },
});
