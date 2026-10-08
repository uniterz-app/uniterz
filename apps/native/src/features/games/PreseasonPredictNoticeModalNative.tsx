/**
 * Web `PreseasonPredictNoticeModal` 相当 — プレシーズン試合を初めて予想するときの告知。
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  preseasonPredictNoticeCopy,
  preseasonPredictNoticeStorageKey,
} from "../../../../../lib/predict/preseasonPredictNotice";

const OXANIUM_BOLD = "Oxanium_700Bold";
const OXANIUM_EXTRA = "Oxanium_800ExtraBold";

export async function readPreseasonPredictNoticeSeenNative(
  uid: string
): Promise<boolean> {
  try {
    return (
      (await AsyncStorage.getItem(preseasonPredictNoticeStorageKey(uid))) === "1"
    );
  } catch {
    return true;
  }
}

export async function writePreseasonPredictNoticeSeenNative(
  uid: string
): Promise<void> {
  try {
    await AsyncStorage.setItem(preseasonPredictNoticeStorageKey(uid), "1");
  } catch {
    // 無視
  }
}

type Props = {
  open: boolean;
  language?: string | null;
  onClose: () => void;
  onConfirm: () => void;
};

export default function PreseasonPredictNoticeModalNative({
  open,
  language,
  onClose,
  onConfirm,
}: Props) {
  const insets = useSafeAreaInsets();
  const copy = preseasonPredictNoticeCopy(language);

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { marginBottom: Math.max(12, insets.bottom) }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.header}>
            <Text style={styles.eyebrow}>{copy.eyebrow}</Text>
            <Text style={styles.title}>{copy.title}</Text>
            <Text style={styles.body}>{copy.body}</Text>
          </View>
          <View style={styles.actions}>
            <Pressable
              onPress={onConfirm}
              style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
            >
              <Text style={styles.btnText}>{copy.ok}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 16,
  },
  sheet: {
    borderWidth: 1,
    borderColor: "rgba(56,189,248,0.55)",
    backgroundColor: "#0a0a0c",
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  eyebrow: {
    color: "rgba(56,189,248,0.9)",
    fontFamily: OXANIUM_BOLD,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  title: {
    marginTop: 4,
    color: "#fff",
    fontFamily: OXANIUM_EXTRA,
    fontSize: 15,
    fontWeight: "800",
    transform: [{ skewX: "-8deg" }],
  },
  body: {
    marginTop: 8,
    color: "rgba(255,255,255,0.65)",
    fontSize: 12,
    lineHeight: 19,
  },
  actions: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    padding: 8,
  },
  btn: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 42,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(56,189,248,0.45)",
    backgroundColor: "rgba(56,189,248,0.1)",
  },
  btnPressed: {
    opacity: 0.8,
  },
  btnText: {
    color: "#E0F2FE",
    fontFamily: OXANIUM_BOLD,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
});
