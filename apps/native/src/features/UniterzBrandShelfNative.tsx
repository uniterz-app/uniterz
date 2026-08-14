/**
 * Web `app/component/Header.tsx` 相当 — UNITERZ ワードマーク + シアンライン。
 * 通常は MainTab で 1 枚。welcome 中は世界カメラ内に載せる。
 */
import { Platform, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BrandCyanLineAnimated from "./games/BrandCyanLineAnimated";

const DISPLAY_FONT_FAMILY = Platform.select({
  ios: "BebasNeue_400Regular",
  android: "BebasNeue_400Regular",
  default: "BebasNeue_400Regular",
});

/** Web Header `text-[22px] tracking-[0.35em]` */
export const WORDMARK_SIZE = 22;
const WORDMARK_TRACKING = WORDMARK_SIZE * 0.35;

/** ロゴ + ライン + 上下パディング（safe area 除く） */
export const UNITERZ_BRAND_SHELF_BODY_H = 8 + WORDMARK_SIZE + 2 + 4 + 6;

export function uniterzBrandShelfOffsetTop(insetsTop: number): number {
  return insetsTop + UNITERZ_BRAND_SHELF_BODY_H;
}

type Props = {
  /** MainTab ルートで safe area を含める */
  includeSafeAreaTop?: boolean;
  /** タブに応じたワードマーク（未指定時は UNITERZ） */
  title?: string;
};

export default function UniterzBrandShelfNative({
  includeSafeAreaTop = false,
  title = "UNITERZ",
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.shell,
        includeSafeAreaTop ? { paddingTop: insets.top + 8 } : styles.shellPadTop,
      ]}
      pointerEvents="none"
      accessibilityRole="header"
      accessibilityLabel={title}
    >
      {/* Web: linear-gradient(180deg, rgba(0,0,0,0.28) → transparent) */}
      <LinearGradient
        pointerEvents="none"
        colors={[
          "rgba(0,0,0,0.28)",
          "rgba(0,0,0,0.10)",
          "rgba(0,0,0,0)",
        ]}
        locations={[0, 0.6, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.inner}>
      <View style={styles.wordmarkStack}>
        <Text
          style={[styles.brandText, styles.brandExtrude]}
          maxFontSizeMultiplier={1.12}
          accessibilityElementsHidden
          importantForAccessibility="no"
        >
          {title}
        </Text>
        <Text
          style={styles.brandText}
          maxFontSizeMultiplier={1.12}
          accessibilityElementsHidden
          importantForAccessibility="no"
        >
          {title}
        </Text>
      </View>
        <BrandCyanLineAnimated />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    alignSelf: "stretch",
    overflow: "visible",
    backgroundColor: "transparent",
    paddingBottom: 6,
    zIndex: 20,
  },
  shellPadTop: {
    paddingTop: 8,
  },
  inner: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 24,
  },
  wordmarkStack: {
    position: "relative",
    alignItems: "center",
    shadowColor: "rgba(103,232,249,1)",
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  brandExtrude: {
    position: "absolute",
    top: 2,
    color: "rgba(6, 18, 24, 0.78)",
    textShadowColor: "transparent",
    textShadowRadius: 0,
  },
  brandText: {
    color: "rgba(255,237,213,0.92)",
    fontSize: WORDMARK_SIZE,
    lineHeight: WORDMARK_SIZE + 2,
    fontWeight: "400",
    letterSpacing: WORDMARK_TRACKING,
    fontFamily: DISPLAY_FONT_FAMILY,
    includeFontPadding: false,
    textShadowColor: "rgba(255,255,255,0.4)",
    textShadowOffset: { width: 0, height: -1 },
    textShadowRadius: 0,
  },
});
