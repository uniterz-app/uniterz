/**
 * 画面 CTA の共通形（カタログ B3）。
 * 斜め平行四辺形。primary = 金塗り、accent = シアン塗り、ghost = 金枠、
 * mono = 白塗り、monoGhost = 白枠、danger = 赤枠。
 * 試合カードの PREDICT には使わない。
 */
import { Pressable, StyleSheet, Text, View } from "react-native";
import { fonts } from "../theme/tokens";

export type SlantCtaVariant =
  | "primary"
  | "accent"
  | "ghost"
  | "mono"
  | "monoGhost"
  | "danger";

type Props = {
  label: string;
  onPress: () => void;
  variant?: SlantCtaVariant;
  disabled?: boolean;
  onPressIn?: () => void;
  onPressOut?: () => void;
  /** ランディング CTA と同じ Bebas Neue */
  display?: boolean;
};

export default function SlantCtaNative({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  onPressIn,
  onPressOut,
  display = false,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.outer,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <View
        style={[
          styles.skew,
          variant === "primary" && styles.primary,
          variant === "accent" && styles.accent,
          variant === "ghost" && styles.ghost,
          variant === "mono" && styles.mono,
          variant === "monoGhost" && styles.monoGhost,
          variant === "danger" && styles.danger,
        ]}
      >
        <View style={styles.unskew}>
          <Text
            style={[
              styles.label,
              display && styles.labelDisplay,
              variant === "primary" && styles.primaryText,
              variant === "accent" && styles.accentText,
              variant === "ghost" && styles.ghostText,
              variant === "mono" && styles.monoText,
              variant === "monoGhost" && styles.monoGhostText,
              variant === "danger" && styles.dangerText,
            ]}
          >
            {label}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outer: {
    overflow: "hidden",
    width: "100%",
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.97 }],
  },
  disabled: {
    opacity: 0.4,
  },
  skew: {
    transform: [{ skewX: "-12deg" }],
    paddingVertical: 14,
    alignItems: "center",
  },
  primary: {
    backgroundColor: "#fcd34d",
  },
  accent: {
    backgroundColor: "#00F5FF",
  },
  ghost: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(252,211,77,0.55)",
  },
  mono: {
    backgroundColor: "#FFFFFF",
  },
  monoGhost: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.88)",
  },
  danger: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.55)",
  },
  unskew: {
    transform: [{ skewX: "12deg" }],
    alignItems: "center",
  },
  label: {
    fontFamily: fonts.metric,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  labelDisplay: {
    fontFamily: "BebasNeue_400Regular",
    fontSize: 16,
    fontWeight: "400",
    letterSpacing: 2.4,
    transform: [{ skewX: "-10deg" }],
  },
  primaryText: {
    color: "#120e08",
  },
  accentText: {
    color: "#050508",
  },
  ghostText: {
    color: "#fde68a",
  },
  monoText: {
    color: "#050508",
  },
  monoGhostText: {
    color: "#FFFFFF",
  },
  dangerText: {
    fontSize: 12,
    letterSpacing: 1.8,
    color: "#fca5a5",
  },
});
