import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import CyberChamferButtonNative, {
  type CyberChamferButtonSize,
} from "./CyberChamferButtonNative";

export type CyberMenuButtonSize = CyberChamferButtonSize;

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

/** 角切りシアン枠のハンバーガーボタン（予想オーバーレイと同型） */
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
  return (
    <View style={styles.shell}>
      <CyberChamferButtonNative
        size={size}
        embedded
        icon="menu"
        open={open}
        onPress={onPress}
        hitSlop={hitSlop}
        accessibilityLabel={accessibilityLabel}
        accessibilityState={accessibilityState}
        style={style}
      />
      {badge}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    position: "relative",
  },
});
