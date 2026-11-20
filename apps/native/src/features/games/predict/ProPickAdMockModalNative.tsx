/**
 * PRO PICK 解除用の広告（モック）。広告 SDK 導入までの仮の画面。
 * 一定秒数待ってから「PRO PICK を開く」を出す。視聴の検証はサーバー側（PRO_PICK_AD_MOCK）。
 */
import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { proPickAdCopy } from "../../../../../../lib/predict/proPickAdCopy";

const WAIT_SECONDS = 5;

type Props = {
  visible: boolean;
  language: string;
  onWatched: () => void;
  onCancel: () => void;
};

export default function ProPickAdMockModalNative({
  visible,
  language,
  onWatched,
  onCancel,
}: Props) {
  const copy = proPickAdCopy(language);
  const [remain, setRemain] = useState(WAIT_SECONDS);

  useEffect(() => {
    if (!visible) return;
    setRemain(WAIT_SECONDS);
    const timer = setInterval(() => {
      setRemain((n) => (n <= 1 ? 0 : n - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [visible]);

  const done = remain === 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.kicker}>{copy.adModalTitle}</Text>
          <View style={styles.screen}>
            <Text style={styles.screenCount}>{done ? "✓" : remain}</Text>
          </View>
          <Text style={styles.body}>{copy.adModalBody}</Text>
          <Text style={styles.wait}>{done ? "" : copy.adModalWait}</Text>
          <Pressable
            onPress={done ? onWatched : undefined}
            disabled={!done}
            accessibilityRole="button"
            style={[styles.primary, !done && styles.primaryDisabled]}
          >
            <Text style={styles.primaryLabel}>{copy.adModalDone}</Text>
          </Pressable>
          <Pressable onPress={onCancel} accessibilityRole="button" style={styles.cancel}>
            <Text style={styles.cancelLabel}>{copy.adModalCancel}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    borderWidth: 1,
    borderColor: "#00F5FF",
    backgroundColor: "#050508",
    padding: 20,
    gap: 14,
  },
  kicker: {
    color: "#00F5FF",
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: "700",
  },
  screen: {
    height: 160,
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.35)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0B0B14",
  },
  screenCount: {
    color: "#FFFFFF",
    fontSize: 56,
    fontWeight: "800",
  },
  body: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 20,
  },
  wait: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    minHeight: 16,
  },
  primary: {
    backgroundColor: "#00F5FF",
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryDisabled: {
    opacity: 0.35,
  },
  primaryLabel: {
    color: "#050508",
    fontWeight: "800",
    fontSize: 14,
  },
  cancel: {
    paddingVertical: 8,
    alignItems: "center",
  },
  cancelLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
  },
});
