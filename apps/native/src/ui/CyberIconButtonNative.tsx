/**
 * 角切りシアン枠のアイコンボタン（共有・編集フライアウト等）
 */
import { type ReactNode } from "react";
import { type StyleProp, type ViewStyle } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import CyberChamferButtonNative, {
  type CyberChamferButtonSize,
} from "./CyberChamferButtonNative";

export type CyberIconButtonSize = CyberChamferButtonSize;

type Props = {
  size?: CyberIconButtonSize;
  icon?: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  iconColor?: string;
  onPress?: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  hitSlop?: number;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

/** 予想オーバーレイと同型の角切りアイコンボタン */
export default function CyberIconButtonNative({
  size = "sm",
  icon = "share-variant",
  iconColor = "rgba(236,254,255,0.9)",
  onPress,
  disabled = false,
  accessibilityLabel,
  hitSlop = 4,
  style,
  children,
}: Props) {
  const mappedIcon =
    icon === "pencil"
      ? "edit"
      : icon === "share-variant"
        ? "share"
        : undefined;

  if (mappedIcon) {
    return (
      <CyberChamferButtonNative
        size={size}
        embedded
        icon={mappedIcon}
        onPress={onPress}
        disabled={disabled}
        hitSlop={hitSlop}
        accessibilityLabel={accessibilityLabel}
        style={style}
      />
    );
  }

  return (
    <CyberChamferButtonNative
      size={size}
      embedded
      icon="close"
      onPress={onPress}
      disabled={disabled}
      hitSlop={hitSlop}
      accessibilityLabel={accessibilityLabel}
      style={style}
    >
      {children ?? (
        <MaterialCommunityIcons name={icon} size={13} color={iconColor} />
      )}
    </CyberChamferButtonNative>
  );
}
