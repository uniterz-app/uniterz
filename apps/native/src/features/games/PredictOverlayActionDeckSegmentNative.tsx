/**
 * `.predict-overlay-cyber-deck > button + button` 相当のセグメント。
 */
import { type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  PREDICT_OVERLAY_ACTION_DECK_SEGMENT,
} from "./PredictOverlayActionDeckNative";

type Props = {
  onPress: () => void;
  accessibilityLabel: string;
  accessibilityState?: { expanded?: boolean };
  icon?: "close" | "edit" | "menu" | "share";
  /** menu 時：展開中は × */
  open?: boolean;
  showDivider?: boolean;
  disabled?: boolean;
  children?: ReactNode;
};

export default function PredictOverlayActionDeckSegmentNative({
  onPress,
  accessibilityLabel,
  accessibilityState,
  icon = "close",
  open = false,
  showDivider = false,
  disabled = false,
  children,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState}
      style={({ pressed }) => [
        styles.segment,
        showDivider && styles.segmentDivider,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <View style={styles.iconWrap}>
        {children ??
          (icon === "edit" ? (
            <MaterialCommunityIcons
              name="pencil"
              size={13}
              color="rgba(236,254,255,0.9)"
            />
          ) : icon === "menu" ? (
            open ? (
              <Text style={styles.closeIcon} accessibilityElementsHidden importantForAccessibility="no">
                ×
              </Text>
            ) : (
              <MaterialCommunityIcons
                name="menu"
                size={13}
                color="rgba(236,254,255,0.9)"
              />
            )
          ) : icon === "share" ? (
            <MaterialCommunityIcons
              name="share-variant"
              size={13}
              color="rgba(236,254,255,0.9)"
            />
          ) : (
            <Text style={styles.closeIcon} accessibilityElementsHidden importantForAccessibility="no">
              ×
            </Text>
          ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  segment: {
    width: PREDICT_OVERLAY_ACTION_DECK_SEGMENT,
    height: PREDICT_OVERLAY_ACTION_DECK_SEGMENT,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentDivider: {
    borderLeftWidth: 1,
    borderLeftColor: "rgba(0,245,255,0.14)",
  },
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  closeIcon: {
    color: "rgba(236,254,255,0.9)",
    fontSize: 16,
    lineHeight: 18,
    fontWeight: "300",
    includeFontPadding: false,
    textAlign: "center",
  },
  pressed: {
    opacity: 0.72,
    backgroundColor: "rgba(0,245,255,0.1)",
  },
  disabled: {
    opacity: 0.45,
  },
});
