/**
 * 試合一覧（GamesHomeScreen）と同じ UNITERZ ブランド段：暖色ヘイズ + シアンアニメライン。
 * 親の横パディングに合わせて `horizontalBleed` でフル幅に食い込ませる。
 */
import { Platform, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { spacing } from "../theme/tokens";
import BrandCyanLineAnimated from "./games/BrandCyanLineAnimated";

const DISPLAY_FONT_FAMILY = Platform.select({
  ios: "BebasNeue_400Regular",
  android: "BebasNeue_400Regular",
  default: "BebasNeue_400Regular",
});

type Props = {
  /** 親の paddingHorizontal と相殺（Games: spacing.xs、Profile: spacing.sm など） */
  horizontalBleed?: number;
};

export default function UniterzBrandShelfNative({
  horizontalBleed = spacing.xs,
}: Props) {
  return (
    <View style={[styles.brandShelf, { marginHorizontal: -horizontalBleed }]}>
      <LinearGradient
        pointerEvents="none"
        colors={[
          "rgba(5,7,10,0)",
          "rgba(61,46,32,0.52)",
          "rgba(45,36,26,0.4)",
          "rgba(61,46,32,0.52)",
          "rgba(5,7,10,0)",
        ]}
        locations={[0, 0.32, 0.5, 0.68, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.brandWarmHaze}
      />
      <Text style={styles.brandText} maxFontSizeMultiplier={1.15}>
        UNITERZ
      </Text>
      <BrandCyanLineAnimated />
    </View>
  );
}

const styles = StyleSheet.create({
  brandShelf: {
    alignSelf: "stretch",
    alignItems: "center",
    marginBottom: 8,
    paddingTop: 12,
    paddingBottom: 8,
    borderRadius: 0,
    overflow: "hidden",
    borderWidth: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(6,9,14,0.72)",
  },
  brandWarmHaze: {
    ...StyleSheet.absoluteFillObject,
  },
  brandText: {
    color: "rgba(203,220,245,0.92)",
    fontSize: 20,
    lineHeight: 22,
    fontWeight: "400",
    letterSpacing: 5.4,
    fontFamily: DISPLAY_FONT_FAMILY,
    includeFontPadding: false,
    marginBottom: 0,
  },
});
