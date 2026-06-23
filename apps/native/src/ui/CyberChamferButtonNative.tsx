/**
 * Web `.predict-overlay-close-btn` / `.cyber-menu-btn` 相当 — 角切りシアン枠ボタン
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

export type CyberChamferButtonSize = "xs" | "sm" | "md" | "lg";

const SIZE_PX: Record<CyberChamferButtonSize, number> = {
  xs: 28,
  sm: 28,
  md: 36,
  lg: 40,
};

const ICON_PX: Record<CyberChamferButtonSize, number> = {
  xs: 13,
  sm: 13,
  md: 15,
  lg: 16,
};

type FloatingAlign = "left" | "right";

type Props = {
  size?: CyberChamferButtonSize;
  /** size より優先 */
  dim?: number;
  embedded?: boolean;
  floatingAlign?: FloatingAlign;
  icon?: "close" | "edit" | "menu" | "share";
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

function makeSkiaPath(width: number, height: number) {
  const d = cyberMenuBtnPathD(width, height, CYBER_MENU_BTN_CUT);
  if (!d) return null;
  return Skia.Path.MakeFromSVGString(d);
}

/** 予想オーバーレイ × / バーガーと同じ角切り枠（Native 共通） */
export default function CyberChamferButtonNative({
  size = "sm",
  dim,
  embedded = true,
  floatingAlign = "left",
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
  const [layout, setLayout] = useState({ w: 0, h: 0 });

  const skiaPath = useMemo(
    () =>
      layout.w > 0 && layout.h > 0
        ? makeSkiaPath(layout.w, layout.h)
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
        style={[styles.frame, { width: buttonDim, height: buttonDim }]}
        onLayout={onLayout}
      >
        {hasSize && skiaPath ? (
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
              <Group clip={skiaPath}>
                <Rect
                  x={0}
                  y={0}
                  width={layout.w}
                  height={layout.h}
                  color="rgba(4,10,18,0.82)"
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
                  path={skiaPath}
                  style="stroke"
                  strokeWidth={1}
                  color="rgba(34,211,238,0.35)"
                />
              </Canvas>
            </View>
          </>
        ) : null}
        {children ??
          (icon === "edit" ? (
            <MaterialCommunityIcons
              name="pencil"
              size={iconPx}
              color="rgba(236,254,255,0.9)"
            />
          ) : icon === "menu" ? (
            open ? (
              <Text
                style={styles.closeIcon}
                accessibilityElementsHidden
                importantForAccessibility="no"
              >
                ×
              </Text>
            ) : (
              <MaterialCommunityIcons
                name="menu"
                size={iconPx}
                color="rgba(236,254,255,0.9)"
              />
            )
          ) : icon === "share" ? (
            <MaterialCommunityIcons
              name="share-variant"
              size={iconPx}
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
  closeIcon: {
    color: "rgba(236,254,255,0.9)",
    fontSize: 16,
    lineHeight: 18,
    fontWeight: "300",
    includeFontPadding: false,
    textAlign: "center",
  },
});
