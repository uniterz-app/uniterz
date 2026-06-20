/**
 * Web `.predict-overlay-close-btn` 相当の角切りコーナーボタン（× / ペン共通）。
 */
import { type ReactNode, useMemo, useState } from "react";
import {
  type LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  Canvas,
  Group,
  Path,
  Rect,
  Skia,
} from "@shopify/react-native-skia";
import {
  PREDICT_OVERLAY_CLOSE_BTN_CUT,
  predictOverlayCloseBtnPathD,
} from "./matchListCyberClipPath";

const BTN_SIZE = 28;

type Align = "left" | "right";

type Props = {
  onPress: () => void;
  accessibilityLabel: string;
  align?: Align;
  icon?: "close" | "edit";
  children?: ReactNode;
};

function makeSkiaPath(width: number, height: number, cut: number) {
  const d = predictOverlayCloseBtnPathD(width, height, cut);
  if (!d) return null;
  return Skia.Path.MakeFromSVGString(d);
}

/** Web ScheduleList オーバーレイの左上 × / 右上ペン */
export default function PredictOverlayCornerButtonNative({
  onPress,
  accessibilityLabel,
  align = "left",
  icon = "close",
  children,
}: Props) {
  const cut = PREDICT_OVERLAY_CLOSE_BTN_CUT;
  const [size, setSize] = useState({ w: BTN_SIZE, h: BTN_SIZE });

  const skiaPath = useMemo(
    () => (size.w > 0 && size.h > 0 ? makeSkiaPath(size.w, size.h, cut) : null),
    [size.w, size.h, cut]
  );

  function onLayout(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout;
    if (Math.abs(width - size.w) < 0.5 && Math.abs(height - size.h) < 0.5) return;
    setSize({ w: width, h: height });
  }

  const hasSize = size.w > 0 && size.h > 0;

  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.root,
        align === "right" ? styles.rootRight : styles.rootLeft,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.frame} onLayout={onLayout}>
        {hasSize && skiaPath ? (
          <>
            <Canvas
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: size.w,
                height: size.h,
              }}
              pointerEvents="none"
            >
              <Group clip={skiaPath}>
                <Rect
                  x={0}
                  y={0}
                  width={size.w}
                  height={size.h}
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
                width: size.w,
                height: size.h,
              }}
            >
              <Canvas style={{ width: size.w, height: size.h }} pointerEvents="none">
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
  root: {
    position: "absolute",
    /** Web `top-1.5` — 外枠 chamfer 内（cut=12）に収める */
    top: 8,
    zIndex: 30,
  },
  rootLeft: {
    /** Web `left-1.5` — 外枠 chamfer 内 */
    left: 8,
  },
  rootRight: {
    right: 8,
  },
  pressed: {
    opacity: 0.72,
  },
  frame: {
    width: BTN_SIZE,
    height: BTN_SIZE,
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
