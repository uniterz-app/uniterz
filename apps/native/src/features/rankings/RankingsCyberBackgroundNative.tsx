/**
 * Web の `CyberPageBackground` + `UniterzLogo3DBackground` に相当。
 *
 * - `expo-gl` がネイティブにリンク済み（`requireNativeModule('ExponentGLObjectManager')` が成功）→ 3D ロゴを遅延読み込み
 * - 未再ビルドの開発クライアント → 2D（ベース色・グロー・薄い「U」）のみ（クラッシュしない）
 *
 * 3D を常に使うには: `cd apps/native && npx expo run:ios` または `run:android` で再ビルド。
 * GLB は Next の `public/logo/...` を `EXPO_PUBLIC_UNITERZ_API_BASE_URL` 経由で取得（`RankingsLogo3DCanvasNative`）。
 */
import { lazy, Suspense, useEffect } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { requireNativeModule } from "expo-modules-core";
import { prefetchRankingsLogoGlb } from "./rankingsLogoGlbCache";

const BG = "#020409";

const DISPLAY_FONT = Platform.select({
  ios: "BebasNeue_400Regular",
  android: "BebasNeue_400Regular",
  default: "BebasNeue_400Regular",
});

/** expo-gl がネイティブにリンク済みか。`NativeModules` 直参照は新アーキテクチャで空になることがあるため `requireNativeModule` を使う */
function isExpoGLNativeLinked(): boolean {
  try {
    requireNativeModule("ExponentGLObjectManager");
    return true;
  } catch {
    return false;
  }
}

const RankingsLogo3DCanvasLazy = lazy(
  () => import("./RankingsLogo3DCanvasNative")
);

function GlowOverlays() {
  return (
    <>
      <LinearGradient
        pointerEvents="none"
        colors={["rgba(133,182,222,0.07)", "rgba(0,0,0,0)", "rgba(111,146,180,0.05)"]}
        locations={[0, 0.42, 1]}
        start={{ x: 0.5, y: 0.12 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <LinearGradient
        pointerEvents="none"
        colors={["rgba(0,0,0,0)", "rgba(8,17,22,0.12)", "rgba(8,17,22,0.22)"]}
        locations={[0, 0.55, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
    </>
  );
}

export default function RankingsCyberBackgroundNative() {
  const use3d = isExpoGLNativeLinked();

  useEffect(() => {
    if (!use3d) return;
    // GLB 取得と R3F チャンクを並列で先読み（Suspense 解除後の待ちを短縮）
    prefetchRankingsLogoGlb();
    void import("./RankingsLogo3DCanvasNative");
  }, [use3d]);

  return (
    <View style={[StyleSheet.absoluteFillObject, { zIndex: 0 }]} pointerEvents="none">
      <View style={[StyleSheet.absoluteFillObject, { zIndex: 0 }]} collapsable={false}>
        {use3d ? (
          <Suspense
            fallback={
              <View style={[styles.fill, { backgroundColor: BG }]} />
            }
          >
            <RankingsLogo3DCanvasLazy />
          </Suspense>
        ) : (
          <>
            <View style={[StyleSheet.absoluteFillObject, { backgroundColor: BG }]} />
            <GlowOverlays />
            <Text style={styles.watermarkU} maxFontSizeMultiplier={1.2}>
              U
            </Text>
          </>
        )}
      </View>
      {use3d ? (
        <View
          style={[StyleSheet.absoluteFillObject, { zIndex: 1 }]}
          pointerEvents="none"
        >
          <GlowOverlays />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  watermarkU: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "22%",
    textAlign: "center",
    fontFamily: DISPLAY_FONT,
    fontSize: 200,
    lineHeight: 200,
    letterSpacing: -6,
    color: "rgba(99,246,255,0.045)",
    includeFontPadding: false,
  },
});
