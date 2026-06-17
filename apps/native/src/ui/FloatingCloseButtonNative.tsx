/**
 * Web `FloatingCloseButton` 相当
 */
import { Platform, Pressable, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

type Props = {
  onPress: () => void;
  /** 左上に戻る矢印 */
  variant?: "close" | "back";
  top?: number;
  right?: number;
  left?: number;
};

export default function FloatingCloseButtonNative({
  onPress,
  variant = "close",
  top = Platform.OS === "ios" ? 48 : 40,
  right = 16,
  left,
}: Props) {
  const icon = variant === "back" ? "chevron-left" : "close";
  const posStyle = left != null ? { left, right: undefined as number | undefined } : { right, left: undefined as number | undefined };

  return (
    <Pressable
      style={[styles.btn, { top, ...posStyle }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={variant === "back" ? "戻る" : "閉じる"}
    >
      <MaterialCommunityIcons name={icon} size={26} color="#f8fafc" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(24,24,27,0.88)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },
});
