/**
 * UNITERZ ロゴ（確定 SVG path）— 出現 overshoot・スキャン連動グロー・短グリッチ。
 * ロゴ形状は変更しない。
 */
import { StyleSheet } from "react-native";
import Animated, {
  interpolate,
  type SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";
import Svg, { ClipPath, Defs, G, Path, Rect } from "react-native-svg";
import {
  UNITERZ_LOGO_SPLASH_MAGENTA,
  UNITERZ_LOGO_SPLASH_PATHS,
  UNITERZ_LOGO_SPLASH_SPACE,
  UNITERZ_LOGO_SPLASH_VIEWBOX,
} from "../../../../../../lib/units/uniterzLogoSplash";

const BAND_COUNT = 4;
/** タイムライン（progress 0..1 = 0..2300ms） */
const APPEAR0 = 0.55 / 2.3;
const APPEAR1 = 1.0 / 2.3;
const APPEAR2 = 1.15 / 2.3;
const SCAN0 = 0.9 / 2.3;
const SCAN1 = 1.4 / 2.3;
const GLITCH0 = 1.15 / 2.3;
const GLITCH1 = 1.45 / 2.3;

type Props = {
  progress: SharedValue<number>;
  logoW: number;
  logoH: number;
  staticPose: boolean;
};

function LogoPaths({ fill, opacity = 1 }: { fill: string; opacity?: number }) {
  return (
    <G fill={fill} opacity={opacity}>
      {UNITERZ_LOGO_SPLASH_PATHS.map((d, i) => (
        <Path key={i} d={d} />
      ))}
    </G>
  );
}

/** グリッチ横帯の固定オフセット（初期化時固定） */
const BAND_OFFSETS = [5, -7, 4, -6] as const;
const GLITCH_BURSTS = [
  { a: 0.08, b: 0.14 },
  { a: 0.38, b: 0.46 },
  { a: 0.72, b: 0.8 },
] as const;

function GlitchBand({
  index,
  progress,
  logoW,
  logoH,
  bandH,
  staticPose,
}: {
  index: number;
  progress: SharedValue<number>;
  logoW: number;
  logoH: number;
  bandH: number;
  staticPose: boolean;
}) {
  const y = index * bandH;
  const clipId = `glitch-band-${index}`;
  const offset = BAND_OFFSETS[index % BAND_OFFSETS.length];

  const style = useAnimatedStyle(() => {
    if (staticPose) {
      return { transform: [{ translateX: 0 }], opacity: 0 };
    }
    const t = progress.value;
    const g = interpolate(t, [GLITCH0, GLITCH1], [0, 1], "clamp");
    let active = 0;
    for (const burst of GLITCH_BURSTS) {
      if (g >= burst.a && g <= burst.b) {
        active = 1;
        break;
      }
    }
    return {
      opacity: active,
      transform: [{ translateX: active * offset }],
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: 0,
          top: 0,
          width: logoW,
          height: logoH,
        },
        style,
      ]}
      pointerEvents="none"
    >
      <Svg width={logoW} height={logoH} viewBox={UNITERZ_LOGO_SPLASH_VIEWBOX}>
        <Defs>
          <ClipPath id={clipId}>
            <Rect
              x={0}
              y={(y / logoH) * 313.66}
              width={1248.9}
              height={(bandH / logoH) * 313.66}
            />
          </ClipPath>
        </Defs>
        <G clipPath={`url(#${clipId})`}>
          <LogoPaths fill={UNITERZ_LOGO_SPLASH_SPACE.logoWhite} />
        </G>
      </Svg>
    </Animated.View>
  );
}

export default function GlitchLogoNative({
  progress,
  logoW,
  logoH,
  staticPose,
}: Props) {
  const bandH = logoH / BAND_COUNT;

  const rootStyle = useAnimatedStyle(() => {
    if (staticPose) {
      return {
        opacity: 1,
        transform: [{ scale: 1 }, { translateY: 0 }],
      };
    }
    const t = progress.value;
    const opacity = interpolate(
      t,
      [APPEAR0, APPEAR0 + 0.04, 1],
      [0, 1, 1],
      "clamp"
    );
    const scale = interpolate(
      t,
      [APPEAR0, APPEAR1, APPEAR2, 1],
      [0.86, 1.03, 1.0, 1.0],
      "clamp"
    );
    const translateY = interpolate(
      t,
      [APPEAR0, APPEAR1, 1],
      [8, 0, 0],
      "clamp"
    );
    return {
      opacity,
      transform: [{ scale }, { translateY }],
    };
  });

  const glowStyle = useAnimatedStyle(() => {
    if (staticPose) return { opacity: 0 };
    const t = progress.value;
    const scan = interpolate(t, [SCAN0, SCAN1], [0, 1], "clamp");
    const inScan = t >= SCAN0 && t <= SCAN1 ? 1 : 0;
    const peak = 1 - Math.abs(scan - 0.5) * 2;
    return { opacity: inScan * peak * 0.55 };
  });

  const rgbCyanStyle = useAnimatedStyle(() => {
    if (staticPose) return { opacity: 0, transform: [{ translateX: 0 }] };
    const t = progress.value;
    const g = interpolate(t, [GLITCH0, GLITCH1], [0, 1], "clamp");
    let active = 0;
    for (const burst of GLITCH_BURSTS) {
      if (g >= burst.a && g <= burst.b) {
        active = 1;
        break;
      }
    }
    return {
      opacity: active * 0.12,
      transform: [{ translateX: active * -1.5 }],
    };
  });

  const rgbMagentaStyle = useAnimatedStyle(() => {
    if (staticPose) return { opacity: 0, transform: [{ translateX: 0 }] };
    const t = progress.value;
    const g = interpolate(t, [GLITCH0, GLITCH1], [0, 1], "clamp");
    let active = 0;
    for (const burst of GLITCH_BURSTS) {
      if (g >= burst.a && g <= burst.b) {
        active = 1;
        break;
      }
    }
    return {
      opacity: active * 0.1,
      transform: [{ translateX: active * 1.5 }],
    };
  });

  return (
    <Animated.View style={[{ width: logoW, height: logoH }, rootStyle]}>
      <Animated.View style={[StyleSheet.absoluteFill, glowStyle]}>
        <Svg width={logoW} height={logoH} viewBox={UNITERZ_LOGO_SPLASH_VIEWBOX}>
          <LogoPaths fill={UNITERZ_LOGO_SPLASH_SPACE.accentBright} />
        </Svg>
      </Animated.View>

      <Animated.View style={[StyleSheet.absoluteFill, rgbCyanStyle]}>
        <Svg width={logoW} height={logoH} viewBox={UNITERZ_LOGO_SPLASH_VIEWBOX}>
          <LogoPaths fill={UNITERZ_LOGO_SPLASH_SPACE.accent} />
        </Svg>
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, rgbMagentaStyle]}>
        <Svg width={logoW} height={logoH} viewBox={UNITERZ_LOGO_SPLASH_VIEWBOX}>
          <LogoPaths fill={UNITERZ_LOGO_SPLASH_MAGENTA} />
        </Svg>
      </Animated.View>

      <Svg width={logoW} height={logoH} viewBox={UNITERZ_LOGO_SPLASH_VIEWBOX}>
        <LogoPaths fill={UNITERZ_LOGO_SPLASH_SPACE.logoWhite} />
      </Svg>

      {Array.from({ length: BAND_COUNT }, (_, i) => (
        <GlitchBand
          key={i}
          index={i}
          progress={progress}
          logoW={logoW}
          logoH={logoH}
          bandH={bandH}
          staticPose={staticPose}
        />
      ))}
    </Animated.View>
  );
}
