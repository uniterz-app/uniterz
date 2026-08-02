/**
 * DarkMetalBackground — 画像アセットによるダークメタル背景。
 * 前景 UI・レイアウトは変更しない。装飾は画像 + 可読性オーバーレイのみ。
 */
import { memo } from "react";
import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { ProfileBgProps } from "./types";

const BG_FALLBACK = "#0a0e14";

const DARK_METAL_BG = require("../../../../assets/profile-bg/dark-metal-background.webp") as number;

function DarkMetalBackground({
  width: widthProp,
  height: heightProp,
  style,
  children,
}: ProfileBgProps) {
  const rootStyle: StyleProp<ViewStyle> = [
    StyleSheet.absoluteFillObject,
    widthProp != null && heightProp != null
      ? { width: widthProp, height: heightProp }
      : null,
    { backgroundColor: BG_FALLBACK },
    style,
  ];

  return (
    <View style={rootStyle} pointerEvents="none">
      <Image
        source={DARK_METAL_BG}
        style={styles.image}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      />

      {/* 端は透かし、UI 帯だけ少し暗くして可読性を確保（メタルは外周で見える） */}
      <LinearGradient
        colors={["rgba(4,6,10,0.42)", "rgba(4,6,10,0.22)", "transparent"]}
        locations={[0, 0.55, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.overlayHeader}
        pointerEvents="none"
      />
      <LinearGradient
        colors={["transparent", "rgba(4,6,10,0.48)", "rgba(4,6,10,0.52)", "transparent"]}
        locations={[0, 0.28, 0.62, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.overlayTitle}
        pointerEvents="none"
      />
      <LinearGradient
        colors={["transparent", "rgba(4,6,10,0.4)", "rgba(4,6,10,0.46)", "transparent"]}
        locations={[0, 0.22, 0.72, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.overlayCards}
        pointerEvents="none"
      />
      <LinearGradient
        colors={[
          "transparent",
          "rgba(4,6,10,0.1)",
          "rgba(4,6,10,0.16)",
          "rgba(4,6,10,0.1)",
          "transparent",
        ]}
        locations={[0, 0.18, 0.5, 0.82, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      {children ? (
        <View style={styles.children} pointerEvents="box-none">
          {children}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayHeader: {
    position: "absolute",
    top: 0,
    left: "6%",
    right: "6%",
    height: "22%",
  },
  overlayTitle: {
    position: "absolute",
    top: "30%",
    left: "10%",
    right: "10%",
    height: "14%",
  },
  overlayCards: {
    position: "absolute",
    top: "48%",
    left: "6%",
    right: "6%",
    height: "42%",
  },
  children: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
});

export default memo(DarkMetalBackground);
