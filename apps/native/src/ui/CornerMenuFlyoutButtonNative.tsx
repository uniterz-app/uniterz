/**
 * Web `ResultCard` コーナー FAB フライアウト（`size-7` 角丸ボタン）
 */
import { type ReactNode } from "react";
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from "react-native";

type Variant = "default" | "trash" | "share";

type Props = {
  onPress: () => void;
  accessibilityLabel: string;
  variant?: Variant;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

export default function CornerMenuFlyoutButtonNative({
  onPress,
  accessibilityLabel,
  variant = "default",
  disabled = false,
  style,
  children,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.base,
        variant === "trash"
          ? styles.trash
          : variant === "share"
            ? styles.share
            : styles.default,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  default: {
    borderColor: "rgba(255,255,255,0.2)",
  },
  share: {
    borderColor: "rgba(34,211,238,0.4)",
    shadowColor: "#22d3ee",
    shadowOpacity: 0.14,
  },
  trash: {
    borderColor: "rgba(239,68,68,0.45)",
    shadowColor: "#f87171",
    shadowOpacity: 0.16,
    backgroundColor: "rgba(0,0,0,0.75)",
    borderRadius: 4,
  },
  pressed: {
    opacity: 0.82,
  },
  disabled: {
    opacity: 0.45,
  },
});
