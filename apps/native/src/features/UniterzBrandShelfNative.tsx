/**
 * Web `app/component/Header.tsx` 相当 — UNITERZ ワードマーク + シアンライン。
 * MainTab 共通（`MainTabNavigator`）で 1 枚だけ描画する。
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
export const UNITERZ_BRAND_SHELF_BODY_H = 8 + WORDMARK_SIZE + 2 + 2 + 6;

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
        <Text
          style={styles.brandText}
          maxFontSizeMultiplier={1.12}
          accessibilityElementsHidden
          importantForAccessibility="no"
        >
          {title}
        </Text>
        <BrandCyanLineAnimated />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    alignSelf: "stretch",
    overflow: "hidden",
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
  brandText: {
    color: "rgba(255,237,213,0.85)",
    fontSize: WORDMARK_SIZE,
    lineHeight: WORDMARK_SIZE + 2,
    fontWeight: "400",
    letterSpacing: WORDMARK_TRACKING,
    fontFamily: DISPLAY_FONT_FAMILY,
    includeFontPadding: false,
    textShadowColor: "rgba(103,232,249,0.16)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 22,
  },
});
