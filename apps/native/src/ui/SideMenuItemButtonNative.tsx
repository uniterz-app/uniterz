import { ReactNode } from "react";
import {
  Image,
  type ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  CYBER_SIDE_MENU_ITEM,
  CYBER_TAB_CYAN,
  SIDE_MENU_LABEL_FONT,
  SIDE_MENU_LABEL_FONT_JA,
} from "./cyberSideMenuNative";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

const CJK_RE = /[\u3040-\u30ff\u4e00-\u9fff]/;

type Props = {
  /** MCI アイコン（`iconSource` と排他） */
  icon?: IconName;
  /** カスタム画像アイコン */
  iconSource?: ImageSourcePropType;
  iconSize?: number;
  children: string;
  onPress: () => void;
  trailing?: ReactNode;
  dense?: boolean;
  tone?: "default" | "danger";
  active?: boolean;
  labelStyle?: TextStyle;
};

/** Web `SideMenuItemButton` — スキューチップ台座（スキャンアニメなし・アイコン枠四角なし） */
export default function SideMenuItemButtonNative({
  icon,
  iconSource,
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
  const usesCjk = CJK_RE.test(children);
  const sz = dense ? Math.max(14, iconSize - 3) : Math.max(16, iconSize - 1);
  /** カスタム PNG は枠いっぱい近くまで拡大 */
  const imgSz = dense ? 28 : 32;
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
            <View
              style={[
                styles.chip,
                (active || pressed) && styles.chipActive,
              ]}
              pointerEvents="none"
            />
          ) : null}

          {/* 選択行の左アクセントレール */}
          {active && !isDanger ? (
            <View style={styles.activeRail} pointerEvents="none" />
          ) : null}

          <View style={styles.iconCol}>
            <View
              style={[
                styles.iconBox,
                dense && styles.iconBoxDense,
                !!iconSource && styles.iconBoxImage,
                !!iconSource && dense && styles.iconBoxImageDense,
              ]}
            >
              {iconSource ? (
                <Image
                  source={iconSource}
                  style={{ width: imgSz, height: imgSz }}
                  resizeMode="contain"
                />
              ) : icon ? (
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
              ) : null}
            </View>
          </View>

          <Text
            style={[
              styles.label,
              dense && styles.labelDense,
              isDanger && styles.labelDanger,
              active && !isDanger && { textShadowColor: `${accent}33`, textShadowRadius: 18 },
              labelStyle,
              /** Bebas に無い日本語は Noto Bold（細いシステムフォールバック回避） */
              usesCjk && styles.labelJa,
            ]}
            numberOfLines={2}
          >
            {children}
          </Text>

          {/* 選択行の ▸ インジケータ */}
          {active && !isDanger ? (
            <Text style={styles.activeCaret} allowFontScaling={false}>
              ▸
            </Text>
          ) : null}

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

const styles = StyleSheet.create({
  root: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderLeftWidth: 0,
    paddingRight: 12,
    overflow: "hidden",
    backgroundColor: CYBER_SIDE_MENU_ITEM.bg,
  },
  normal: {
    minHeight: 36,
    paddingVertical: 5,
  },
  dense: {
    minHeight: 32,
    paddingVertical: 4,
  },
  default: {
    borderColor: CYBER_SIDE_MENU_ITEM.border,
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
    shadowOpacity: 0.26,
    shadowRadius: 30,
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
  chip: {
    position: "absolute",
    left: -7,
    top: 0,
    bottom: 0,
    width: 54,
    backgroundColor: "rgba(0, 42, 56, 0.7)",
    borderRightWidth: 1,
    borderRightColor: "rgba(0, 245, 255, 0.26)",
    transform: [{ skewX: "-14deg" }],
  },
  chipActive: {
    backgroundColor: "rgba(0, 70, 88, 0.96)",
    borderRightColor: "rgba(0, 245, 255, 0.85)",
  },
  iconCol: {
    width: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: 3,
    zIndex: 1,
  },
  iconBox: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBoxDense: {
    width: 26,
    height: 26,
  },
  iconBoxImage: {
    width: 36,
    height: 36,
  },
  iconBoxImageDense: {
    width: 32,
    height: 32,
  },
  label: {
    flex: 1,
    color: "#fff",
    fontSize: 15,
    zIndex: 1,
    paddingLeft: 10,
    includeFontPadding: false,
    ...SIDE_MENU_LABEL_FONT,
  },
  labelDense: {
    fontSize: 13,
  },
  labelJa: {
    ...SIDE_MENU_LABEL_FONT_JA,
  },
  labelDanger: {
    color: "rgba(254, 202, 202, 0.96)",
  },
  trailing: {
    zIndex: 1,
    flexShrink: 0,
    paddingLeft: 4,
  },
  activeRail: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: CYBER_TAB_CYAN,
    shadowColor: CYBER_TAB_CYAN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    zIndex: 2,
  },
  activeCaret: {
    zIndex: 1,
    flexShrink: 0,
    paddingLeft: 4,
    fontSize: 10,
    lineHeight: 12,
    color: CYBER_TAB_CYAN,
    textShadowColor: "rgba(0, 245, 255, 0.8)",
    textShadowRadius: 8,
  },
});
