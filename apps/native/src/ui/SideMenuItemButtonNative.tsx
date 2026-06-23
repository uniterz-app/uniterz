import { ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  CYBER_SIDE_MENU_ITEM,
  CYBER_TAB_CYAN,
  SIDE_MENU_LABEL_FONT,
} from "./cyberSideMenuNative";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

type Props = {
  icon: IconName;
  iconSize?: number;
  children: string;
  onPress: () => void;
  trailing?: ReactNode;
  dense?: boolean;
  tone?: "default" | "danger";
  active?: boolean;
  labelStyle?: TextStyle;
};

/** Web `SideMenuItemButton` — HUD 行・角切り・走査線・選択時シアン枠 */
export default function SideMenuItemButtonNative({
  icon,
  iconSize = 18,
  children,
  onPress,
  trailing,
  dense = false,
  tone = "default",
  active = false,
  labelStyle,
}: Props) {
  const isDanger = tone === "danger";
  const sz = dense ? Math.max(14, iconSize - 2) : iconSize;
  const accent = isDanger ? "#fb7185" : CYBER_TAB_CYAN;

  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <View
          style={[
            styles.root,
            dense ? styles.dense : styles.normal,
            isDanger ? styles.danger : styles.default,
            active && !isDanger && styles.active,
            active && isDanger && styles.activeDanger,
            pressed && !active && !isDanger && styles.pressed,
            pressed && !active && isDanger && styles.pressedDanger,
          ]}
        >
          {!isDanger ? (
            <>
              <View
                style={[styles.rail, (active || pressed) && styles.railVisible]}
                pointerEvents="none"
              />
              <View
                style={[styles.corner, styles.cornerTL, active && styles.cornerVisible]}
                pointerEvents="none"
              />
              <View
                style={[styles.corner, styles.cornerBR, active && styles.cornerVisible]}
                pointerEvents="none"
              />
              {active ? <View style={styles.scan} pointerEvents="none" /> : null}
            </>
          ) : null}

          <View
            style={[
              styles.iconBox,
              dense && styles.iconBoxDense,
              active && !isDanger && styles.iconBoxActive,
              active && isDanger && styles.iconBoxActiveDanger,
            ]}
          >
            <MaterialCommunityIcons
              name={icon}
              size={sz}
              color={
                isDanger
                  ? CYBER_SIDE_MENU_ITEM.dangerIcon
                  : active
                    ? CYBER_TAB_CYAN
                    : CYBER_SIDE_MENU_ITEM.iconDefault
              }
            />
          </View>

          <Text
            style={[
              styles.label,
              dense && styles.labelDense,
              isDanger && styles.labelDanger,
              active && !isDanger && { textShadowColor: `${accent}33`, textShadowRadius: 18 },
              labelStyle,
            ]}
            numberOfLines={2}
          >
            {children}
          </Text>

          {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
        </View>
      )}
    </Pressable>
  );
}

export function SideMenuUnreadBadgeNative({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <View style={badgeStyles.root}>
      <Text style={badgeStyles.text}>{count > 99 ? "99+" : String(count)}</Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  root: {
    borderRadius: 999,
    backgroundColor: "#ef4444",
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 22,
    alignItems: "center",
  },
  text: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
});

const cornerBase: ViewStyle = {
  position: "absolute",
  width: 7,
  height: 7,
  borderColor: "rgba(0, 245, 255, 0.55)",
  opacity: 0,
};

const styles = StyleSheet.create({
  root: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    overflow: "hidden",
  },
  normal: {
    minHeight: 48,
    paddingVertical: 10,
  },
  dense: {
    minHeight: 40,
    paddingVertical: 8,
  },
  default: {
    borderColor: CYBER_SIDE_MENU_ITEM.border,
    backgroundColor: CYBER_SIDE_MENU_ITEM.bg,
  },
  danger: {
    borderColor: CYBER_SIDE_MENU_ITEM.dangerBorder,
    backgroundColor: CYBER_SIDE_MENU_ITEM.bg,
  },
  active: {
    borderColor: CYBER_SIDE_MENU_ITEM.borderActive,
    backgroundColor: CYBER_SIDE_MENU_ITEM.bgActive,
    shadowColor: CYBER_TAB_CYAN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
  },
  activeDanger: {
    borderColor: CYBER_SIDE_MENU_ITEM.dangerBorderActive,
    backgroundColor: CYBER_SIDE_MENU_ITEM.dangerBgActive,
    shadowColor: "#fb7185",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 22,
  },
  pressed: {
    borderColor: CYBER_SIDE_MENU_ITEM.borderHover,
  },
  pressedDanger: {
    borderColor: "rgba(251, 113, 133, 0.38)",
  },
  rail: {
    position: "absolute",
    left: 0,
    top: "12%",
    bottom: "12%",
    width: 2,
    backgroundColor: CYBER_TAB_CYAN,
    opacity: 0,
    shadowColor: CYBER_TAB_CYAN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 8,
  },
  railVisible: { opacity: 1 },
  corner: cornerBase,
  cornerTL: {
    left: 0,
    top: 0,
    borderLeftWidth: 2,
    borderTopWidth: 2,
  },
  cornerBR: {
    right: 0,
    bottom: 0,
    borderRightWidth: 2,
    borderBottomWidth: 2,
  },
  cornerVisible: { opacity: 1 },
  scan: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.06)",
    opacity: 0.5,
  },
  iconBox: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    zIndex: 1,
  },
  iconBoxDense: {
    width: 32,
    height: 32,
  },
  iconBoxActive: {
    borderColor: "rgba(0, 245, 255, 0.35)",
    backgroundColor: "rgba(0, 245, 255, 0.1)",
  },
  iconBoxActiveDanger: {
    borderColor: "rgba(251, 113, 133, 0.35)",
    backgroundColor: "rgba(251, 113, 133, 0.14)",
  },
  label: {
    flex: 1,
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    zIndex: 1,
    ...SIDE_MENU_LABEL_FONT,
  },
  labelDense: {
    fontSize: 12,
  },
  labelDanger: {
    color: "rgba(254, 202, 202, 0.96)",
  },
  trailing: {
    zIndex: 1,
    flexShrink: 0,
  },
});
