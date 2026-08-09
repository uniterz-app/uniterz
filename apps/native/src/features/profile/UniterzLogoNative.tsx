/**
 * Web `UniterzLogo` 相当 — 確定版ロゴ画像をそのまま表示。
 */
import {
  Image,
  StyleSheet,
  View,
  type ImageResizeMode,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { UNITERZ_LOGO_ASSET } from "../../../../../lib/units/uniterzLogoAsset";

const LOGO = require("../../../assets/brand/uniterz-logo.png");

export type UniterzLogoNativeProps = {
  width?: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
  /** 親いっぱいに配置（resizeMode で contain / cover） */
  fill?: boolean;
  resizeMode?: ImageResizeMode;
};

export default function UniterzLogoNative({
  width = 300,
  height,
  style,
  fill = false,
  resizeMode = "contain",
}: UniterzLogoNativeProps) {
  if (fill) {
    const contain = resizeMode === "contain";
    return (
      <View
        style={[
          contain ? styles.fillWrapContain : styles.fillWrap,
          style,
        ]}
        accessibilityLabel="UNITERZ"
        accessibilityRole="image"
      >
        <Image
          source={LOGO}
          style={contain ? styles.fillImageWidth : styles.fillImage}
          resizeMode={resizeMode}
        />
      </View>
    );
  }

  const h = height ?? width / UNITERZ_LOGO_ASSET.aspectRatio;

  return (
    <View
      style={[styles.wrap, { width, height: h }, style]}
      accessibilityLabel="UNITERZ"
      accessibilityRole="image"
    >
      <Image
        source={LOGO}
        style={{ width, height: h }}
        resizeMode={resizeMode}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  fillWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-start",
  },
  /** 親幅に合わせて高さを確保（absoluteFill だと高さが 0 になることがある） */
  fillWrapContain: {
    width: "100%",
    aspectRatio: UNITERZ_LOGO_ASSET.aspectRatio,
  },
  fillImage: {
    width: "100%",
    height: "100%",
  },
  fillImageWidth: {
    width: "100%",
    height: "100%",
  },
});
