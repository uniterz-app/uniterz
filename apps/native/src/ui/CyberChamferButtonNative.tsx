/**
 * Web `.predict-overlay-close-btn` / `.cyber-menu-btn` 相当 — 直角四角枠ボタン
 */
import { type ReactNode, useMemo, useState } from "react";
import {
  type LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  Canvas,
  Group,
  Path,
  Rect,
  Skia,
} from "@shopify/react-native-skia";
import { CYBER_MENU_BTN_CUT, cyberMenuBtnPathD } from "./cyberMenuClipPath";
import {
  CYBER_CHAMFER_THEMES,
  type CyberChamferAction,
  type CyberChamferTheme,
} from "./cyberChamferButtonTheme";

export type CyberChamferButtonSize = "xs" | "sm" | "md" | "lg";

const SIZE_PX: Record<CyberChamferButtonSize, number> = {
  xs: 24,
  sm: 28,
  md: 36,
  lg: 40,
};

const ICON_PX: Record<CyberChamferButtonSize, number> = {
  xs: 10,
  sm: 13,
  md: 15,
  lg: 16,
};

/** 直角枠は RN border（Skia 端ストローク欠けを避ける） */
const USE_SQUARE_BORDER = CYBER_MENU_BTN_CUT <= 0;

/** chamfer 時: strokeWidth 1 がキャンバス端で欠けるのを防ぐ内側オフセット */
const STROKE_INSET = 0.5;

type FloatingAlign = "left" | "right";

type Props = {
  size?: CyberChamferButtonSize;
  /** size より優先 */
  dim?: number;
  embedded?: boolean;
  floatingAlign?: FloatingAlign;
  variant?: CyberChamferAction;
  /** variant テーマを上書き（例: 白枠メニュー） */
  themeOverride?: CyberChamferTheme;
  /** @deprecated variant を使用 */
  icon?: "close" | "edit" | "delete" | "menu" | "share";
  /** menu 時：展開中は × */
  open?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  hitSlop?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityState?: { expanded?: boolean };
  children?: ReactNode;
};

function makeSkiaPath(width: number, height: number, inset = 0) {
  const d = cyberMenuBtnPathD(
    Math.max(0, width - inset * 2),
    Math.max(0, height - inset * 2)
  );
  if (!d) return null;
  const path = Skia.Path.MakeFromSVGString(d);
  if (!path) return null;
  if (inset > 0) {
    path.offset(inset, inset);
  }
  return path;
}

function resolveVariant(
  variant: CyberChamferAction | undefined,
  icon: Props["icon"]
): CyberChamferAction {
  if (variant) return variant;
  if (icon === "close") return "close";
  if (icon === "edit") return "edit";
  if (icon === "delete") return "delete";
  if (icon === "share") return "share";
  return "menu";
}

/**
 * MCI の menu グリフは上下余白が偏り、角切り枠だと左上に寄って見える。
 * 3 本線を自前で描いて幾何中心に揃える。
 */
function MenuGlyph({ size, color }: { size: number; color: string }) {
  const barH = Math.max(1.5, Math.round(size * 0.14 * 10) / 10);
  const width = Math.max(8, Math.round(size * 0.92));
  const gap = Math.max(2, Math.round(size * 0.2 * 10) / 10);
  return (
    <View style={{ width, gap, alignItems: "stretch", justifyContent: "center" }}>
      <View style={{ height: barH, borderRadius: 0.5, backgroundColor: color }} />
      <View style={{ height: barH, borderRadius: 0.5, backgroundColor: color }} />
      <View style={{ height: barH, borderRadius: 0.5, backgroundColor: color }} />
    </View>
  );
}

/** 予想オーバーレイ × / ペン / 共有 / バーガー（Native 共通） */
export default function CyberChamferButtonNative({
  size = "sm",
  dim,
  embedded = true,
  floatingAlign = "left",
  variant,
  themeOverride,
  icon = "menu",
  open = false,
  onPress,
  disabled = false,
  hitSlop = 8,
  style,
  accessibilityLabel,
  accessibilityState,
  children,
}: Props) {
  const buttonDim = dim ?? SIZE_PX[size];
  const iconPx = ICON_PX[size];
  const action = resolveVariant(variant, icon);
  const theme = themeOverride ?? CYBER_CHAMFER_THEMES[action];
  const [layout, setLayout] = useState({ w: 0, h: 0 });

  const fillPath = useMemo(
    () =>
      !USE_SQUARE_BORDER && layout.w > 0 && layout.h > 0
        ? makeSkiaPath(layout.w, layout.h)
        : null,
    [layout.w, layout.h]
  );
  const strokePath = useMemo(
    () =>
      !USE_SQUARE_BORDER && layout.w > 0 && layout.h > 0
        ? makeSkiaPath(layout.w, layout.h, STROKE_INSET)
        : null,
    [layout.w, layout.h]
  );

  function onLayout(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout;
    if (Math.abs(width - layout.w) < 0.5 && Math.abs(height - layout.h) < 0.5) {
      return;
    }
    setLayout({ w: width, h: height });
  }

  const hasSize = layout.w > 0 && layout.h > 0;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={hitSlop}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState}
      style={({ pressed }) => [
        embedded ? styles.embeddedRoot : styles.floatingRoot,
        !embedded &&
          (floatingAlign === "right" ? styles.floatingRight : styles.floatingLeft),
        { width: buttonDim, height: buttonDim },
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <View
        style={[
          styles.frame,
          { width: buttonDim, height: buttonDim },
          USE_SQUARE_BORDER && {
            backgroundColor: theme.fill,
            borderWidth: 1,
            borderColor: theme.stroke,
          },
        ]}
        onLayout={onLayout}
      >
        {!USE_SQUARE_BORDER && hasSize && fillPath && strokePath ? (
          <>
            <Canvas
              pointerEvents="none"
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: layout.w,
                height: layout.h,
              }}
            >
              <Group clip={fillPath}>
                <Rect
                  x={0}
                  y={0}
                  width={layout.w}
                  height={layout.h}
                  color={theme.fill}
                />
              </Group>
            </Canvas>
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: layout.w,
                height: layout.h,
              }}
            >
              <Canvas style={{ width: layout.w, height: layout.h }} pointerEvents="none">
                <Path
                  path={strokePath}
                  style="stroke"
                  strokeWidth={1}
                  color={theme.stroke}
                />
              </Canvas>
            </View>
          </>
        ) : null}
        <View style={styles.iconSlot} pointerEvents="none">
          {children ??
            (action === "edit" ? (
              <MaterialCommunityIcons
                name="pencil"
                size={iconPx}
                color={theme.icon}
              />
            ) : action === "delete" ? (
              <MaterialCommunityIcons
                name="trash-can-outline"
                size={iconPx}
                color={theme.icon}
              />
            ) : action === "menu" ? (
              <MenuGlyph size={iconPx} color={theme.icon} />
            ) : action === "share" ? (
              <MaterialCommunityIcons
                name="share-variant"
                size={iconPx}
                color={theme.icon}
              />
            ) : (
              <Text
                style={[styles.closeIcon, { color: theme.icon }]}
                accessibilityElementsHidden
                importantForAccessibility="no"
              >
                ×
              </Text>
            ))}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  embeddedRoot: {
    zIndex: 30,
  },
  floatingRoot: {
    position: "absolute",
    top: 8,
    zIndex: 30,
  },
  floatingLeft: {
    left: 8,
  },
  floatingRight: {
    right: 8,
  },
  pressed: {
    opacity: 0.72,
  },
  disabled: {
    opacity: 0.45,
  },
  frame: {
    alignItems: "center",
    justifyContent: "center",
  },
  /**
 * ハンバーガー等の幾何中心。角切り時のみ光学補正していたが、直角枠では不要。
 */
  iconSlot: {
    alignItems: "center",
    justifyContent: "center",
  },
  closeIcon: {
    fontSize: 16,
    lineHeight: 18,
    fontWeight: "300",
    includeFontPadding: false,
    textAlign: "center",
  },
});
