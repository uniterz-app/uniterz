import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export type CyberMenuButtonSize = "xs" | "sm" | "md" | "lg";

const SIZE_PX: Record<CyberMenuButtonSize, number> = {
  xs: 22,
  sm: 32,
  md: 36,
  lg: 40,
};

const ICON_PX: Record<CyberMenuButtonSize, number> = {
  xs: 10,
  sm: 14,
  md: 15,
  lg: 16,
};

type Props = {
  size?: CyberMenuButtonSize;
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityState?: { expanded?: boolean };
  hitSlop?: number;
  style?: StyleProp<ViewStyle>;
  badge?: React.ReactNode;
  /** メニュー展開中は × 表示 */
  open?: boolean;
};

/** 角切り風シアン枠のハンバーガーボタン（Native 共通） */
export default function CyberMenuButton({
  size = "sm",
  onPress,
  accessibilityLabel,
  accessibilityState,
  hitSlop = 8,
  style,
  badge,
  open = false,
}: Props) {
  const dim = SIZE_PX[size];

  return (
    <Pressable
      onPress={onPress}
      hitSlop={hitSlop}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState}
      style={({ pressed }) => [
        styles.btn,
        { width: dim, height: dim, borderRadius: size === "xs" ? 4 : 5 },
        pressed && styles.btnPressed,
        style,
      ]}
    >
      <LinearGradient
        pointerEvents="none"
        colors={["rgba(39,39,42,0.96)", "rgba(0,0,0,0.92)"]}
        locations={[0, 1]}
        style={[StyleSheet.absoluteFillObject, { borderRadius: size === "xs" ? 4 : 5 }]}
      />
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons
          name={open ? "close" : "menu"}
          size={ICON_PX[size]}
          color={open ? "rgba(103,232,249,0.95)" : "rgba(224,250,254,0.72)"}
        />
      </View>
      {badge}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    position: "relative",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.5)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#22d3ee",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 6,
  },
  btnPressed: {
    opacity: 0.9,
  },
  iconWrap: {
    zIndex: 1,
    transform: [{ scaleX: 0.82 }],
  },
});
