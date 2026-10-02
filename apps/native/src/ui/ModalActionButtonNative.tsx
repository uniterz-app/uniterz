/**
 * モーダル操作ボタンの共通形（カタログ 06）。
 * 四角。ghost = 枠、primary = 金塗り、danger = 赤塗り。
 */
import { type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export type ModalActionTone = "ghost" | "primary" | "danger";

export function ModalActionButtonNative({
  label,
  onPress,
  tone = "primary",
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  tone?: ModalActionTone;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.btn,
        tone === "ghost" && styles.ghost,
        tone === "primary" && styles.primary,
        tone === "danger" && styles.danger,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Text
        style={[
          styles.label,
          tone === "ghost" && styles.ghostLabel,
          tone === "primary" && styles.primaryLabel,
          tone === "danger" && styles.dangerLabel,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function ModalActionRowNative({
  children,
}: {
  children: ReactNode;
}) {
  return <View style={styles.row}>{children}</View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 0,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  ghost: {
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  primary: {
    borderColor: "rgba(252,211,77,0.45)",
    backgroundColor: "#fcd34d",
  },
  danger: {
    borderColor: "rgba(252,165,165,0.35)",
    backgroundColor: "#dc2626",
  },
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.4,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
  },
  ghostLabel: {
    color: "rgba(255,255,255,0.9)",
    fontWeight: "600",
  },
  primaryLabel: {
    color: "#120e08",
  },
  dangerLabel: {
    color: "#fff",
  },
});
