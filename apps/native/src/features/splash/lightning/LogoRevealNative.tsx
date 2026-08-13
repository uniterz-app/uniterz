/**
 * UNITERZ ロゴ出現 — 既存 SVG path をそのまま使用。形状変更なし。
 * 雷の光に連動して opacity / 背面シアン Glow を変化。
 */
import { StyleSheet, View } from "react-native";
import Animated, {
  interpolate,
  type SharedValue,
  useAnimatedStyle,
  useDerivedValue,
} from "react-native-reanimated";
import Svg, { G, Path } from "react-native-svg";
import {
  UNITERZ_LOGO_SPLASH_PATHS,
  UNITERZ_LOGO_SPLASH_VIEWBOX,
} from "../../../../../../lib/units/uniterzLogoSplash";
import { LIGHTNING_T } from "./lightningTiming";

type Props = {
  logoW: number;
  logoH: number;
  progress: SharedValue<number>;
  /** プレストライク / メイン落雷の瞬間強度 0〜1 */
  strikePulse: SharedValue<number>;
  staticPose: boolean;
};

function LogoPaths({
  fill,
  opacity = 1,
}: {
  fill: string;
  opacity?: number;
}) {
  return (
    <G fill={fill} opacity={opacity}>
      {UNITERZ_LOGO_SPLASH_PATHS.map((d, i) => (
        <Path key={i} d={d} />
      ))}
    </G>
  );
}

export default function LogoRevealNative({
  logoW,
  logoH,
  progress,
  strikePulse,
  staticPose,
}: Props) {
  const logoOpacity = useDerivedValue(() => {
    if (staticPose) return 1;
    const t = progress.value;
    const pulse = strikePulse.value;

    // 序盤はほぼ見えない
    if (t < LIGHTNING_T.preStrike) {
      return 0.05 + pulse * 0.15;
    }

    // プレストライクで一瞬見える → また暗く
    if (t < LIGHTNING_T.mainStart) {
      const pre =
        t < LIGHTNING_T.preStrikeEnd
          ? interpolate(
              t,
              [LIGHTNING_T.preStrike, LIGHTNING_T.preStrikeEnd],
              [0.05, 1],
              "clamp"
            )
          : interpolate(
              t,
              [LIGHTNING_T.preStrikeEnd, LIGHTNING_T.mainStart],
              [1, 0.4],
              "clamp"
            );
      return Math.max(pre, pulse * 0.9);
    }

    // メイン落雷後は完全出現へ
    if (t < LIGHTNING_T.logoSettle) {
      const base = interpolate(
        t,
        [LIGHTNING_T.mainStart, LIGHTNING_T.logoSettle],
        [0.4, 1],
        "clamp"
      );
      return Math.max(base, 0.55 + pulse * 0.45);
    }

    return 1;
  });

  const glowOpacity = useDerivedValue(() => {
    if (staticPose) return 0.07;
    const pulse = strikePulse.value;
    const t = progress.value;
    if (t < LIGHTNING_T.preStrike) return 0.02;
    if (t < LIGHTNING_T.logoSettle) {
      // 落雷瞬間だけ強く
      return 0.05 + pulse * 0.42;
    }
    // 終了後はごく弱く
    return 0.07;
  });

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <View style={[styles.wrap, { width: logoW, height: logoH }]} pointerEvents="none">
      {/* 背面シアン Glow（落雷時のみ強く） */}
      <Animated.View style={[styles.glowLayer, glowStyle]}>
        <Svg width={logoW} height={logoH} viewBox={UNITERZ_LOGO_SPLASH_VIEWBOX}>
          <LogoPaths fill="#7EC8FF" />
        </Svg>
      </Animated.View>
      <Animated.View style={logoStyle}>
        <Svg width={logoW} height={logoH} viewBox={UNITERZ_LOGO_SPLASH_VIEWBOX}>
          <LogoPaths fill="#FFFFFF" />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  glowLayer: {
    ...StyleSheet.absoluteFillObject,
    // RN では blur フィルタが限定的なため、拡大 + シアン塗りで疑似 Glow
    transform: [{ scale: 1.06 }],
  },
});
