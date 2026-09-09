import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import CyberChamferButtonNative, {
  type CyberChamferButtonSize,
} from "./CyberChamferButtonNative";
import {
  MENU_WHITE_THEME,
  type CyberChamferTheme,
} from "./cyberChamferButtonTheme";

export type CyberMenuButtonSize = CyberChamferButtonSize;

type Props = {
  size?: CyberMenuButtonSize;
  /** size より優先 */
  dim?: number;
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityState?: { expanded?: boolean };
  hitSlop?: number;
  style?: StyleProp<ViewStyle>;
  badge?: React.ReactNode;
  /** Web `.cyber-menu-btn--white` — 枠白 */
  frameWhite?: boolean;
  themeOverride?: CyberChamferTheme;
};

/** 角切り黄枠のハンバーガーボタン（プロフィールと同型） */
export default function CyberMenuButton({
  size = "sm",
  dim,
  onPress,
  accessibilityLabel,
  accessibilityState,
  hitSlop = 8,
  style,
  badge,
  frameWhite = false,
  themeOverride,
}: Props) {
  return (
    <View style={styles.shell}>
      <CyberChamferButtonNative
        size={size}
        dim={dim}
        embedded
        variant="menu"
        themeOverride={themeOverride ?? (frameWhite ? MENU_WHITE_THEME : undefined)}
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
