/**
 * Web `CyberLogoSplashScreen` 相当 —
 * SVG path を使い、案ごとに雰囲気を大きく変えた起動スプラッシュ。
 */
import { useEffect, type ReactNode } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, { ClipPath, Defs, G, Path, Rect } from "react-native-svg";
import {
  UNITERZ_LOGO_SPLASH_ACCENT,
  UNITERZ_LOGO_SPLASH_MAGENTA,
  UNITERZ_LOGO_SPLASH_PATHS,
  UNITERZ_LOGO_SPLASH_PHOSPHOR,
  UNITERZ_LOGO_SPLASH_VB_H,
  UNITERZ_LOGO_SPLASH_VB_W,
  UNITERZ_LOGO_SPLASH_VIEWBOX,
  type UniterzLogoSplashVariantId,
} from "../../../../../lib/units/uniterzLogoSplash";
import SplashScreenNative from "./SplashScreenNative";
import LineFormSplashScreenNative from "./LineFormSplashScreenNative";
import LightningSplashScreenNative from "./LightningSplashScreenNative";
import LettersSplashScreenNative from "./LettersSplashScreenNative";

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const SNAP = Easing.bezier(0.2, 0.9, 0.2, 1);
const OUT = Easing.out(Easing.cubic);
const LOGO_ASPECT = UNITERZ_LOGO_SPLASH_VB_H / UNITERZ_LOGO_SPLASH_VB_W;
const SLICE_COUNT = 5;

type Props = {
  playKey?: number;
  forceStatic?: boolean;
  variant?: UniterzLogoSplashVariantId;
};

type Common = {
  playKey: number;
  staticPose: boolean;
  logoW: number;
  logoH: number;
};

function LogoPaths({
  fill,
  stroke,
  strokeWidth = 0,
  strokeOpacity = 1,
}: {
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  strokeOpacity?: number;
}) {
  return (
    <G
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeOpacity={strokeOpacity}
    >
      {UNITERZ_LOGO_SPLASH_PATHS.map((d, i) => (
        <Path key={i} d={d} />
      ))}
    </G>
  );
}

function LogoSvg({
  width,
  height,
  fill,
  stroke,
  strokeWidth,
  strokeOpacity,
}: {
  width: number;
  height: number;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  strokeOpacity?: number;
}) {
  return (
    <Svg width={width} height={height} viewBox={UNITERZ_LOGO_SPLASH_VIEWBOX}>
      <LogoPaths
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeOpacity={strokeOpacity}
      />
    </Svg>
  );
}

/** Pass — 黒空間＋透視。装飾なしで距離だけ感じさせる */
function VariantPass({ playKey, staticPose, logoW, logoH }: Common) {
  const p = useSharedValue(staticPose ? 0.48 : 0);

  useEffect(() => {
    if (staticPose) {
      p.value = 0.48;
      return;
    }
    p.value = 0;
    p.value = withTiming(1, {
      duration: 3600,
      easing: Easing.bezier(0.45, 0.0, 0.12, 1),
    });
  }, [p, playKey, staticPose]);

  /**
   * カメラ z が進む。ロゴは worldZ=0.55 固定。
   * scale = focal / (worldZ - cam) → 近づくほど指数的に巨大化＝奥行き。
   *
   * 0–0.25  遠くに浮かぶ
   * 0.25–0.52  寄る
   * 0.52–0.60  正面ホールド
   * 0.60–1.00  くぐって通過
   */
  const mainStyle = useAnimatedStyle(() => {
    const t = p.value;
    const cam = interpolate(
      t,
      [0, 0.25, 0.52, 0.6, 1],
      [0.08, 0.22, 0.4, 0.46, 1.2]
    );
    const worldZ = 0.55;
    const rel = Math.max(0.016, worldZ - cam);
    const s = Math.min(0.4 / rel, 30);
    const appear = interpolate(t, [0.04, 0.14], [0, 1]);
    const past = interpolate(rel, [0.016, 0.08], [0, 1]);
    return {
      opacity: cam >= worldZ ? past : appear,
      transform: [
        { perspective: 1200 },
        { translateY: interpolate(t, [0, 0.55, 0.9], [18, 0, -6]) },
        { rotateX: `${interpolate(t, [0, 0.55, 0.9], [6, 1.5, -1])}deg` },
        { scale: s },
      ],
    };
  });

  // 奥のソフトゴースト（同色・低透過）。遠近の空気遠近法
  const hazeStyle = useAnimatedStyle(() => {
    const t = p.value;
    const cam = interpolate(
      t,
      [0, 0.25, 0.52, 0.6, 1],
      [0.08, 0.22, 0.4, 0.46, 1.2]
    );
    const worldZ = 0.68;
    const rel = Math.max(0.02, worldZ - cam);
    const s = Math.min(0.28 / rel, 10);
    return {
      opacity: interpolate(rel, [0.04, 0.18, 0.4, 0.65], [0, 0.22, 0.28, 0.08]),
      transform: [
        { perspective: 1200 },
        { translateY: interpolate(t, [0, 0.55], [28, 10]) },
        { rotateX: `${interpolate(t, [0, 0.55], [9, 4])}deg` },
        { scale: s },
      ],
    };
  });

  // 床ではなく「空間の奥」を示すグラデ面（色はほぼ黒）
  const volumeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0.08, 0.28, 0.6, 0.82], [0, 0.7, 0.45, 0]),
    transform: [
      { perspective: 900 },
      { rotateX: "68deg" },
      { translateY: interpolate(p.value, [0, 1], [110, 55]) },
      { scale: interpolate(p.value, [0, 0.55, 1], [0.95, 1.25, 2.2]) },
    ],
  }));

  // 接触影（黒）。距離で濃く・小さく
  const shadowStyle = useAnimatedStyle(() => {
    const t = p.value;
    const cam = interpolate(
      t,
      [0, 0.25, 0.52, 0.6, 1],
      [0.08, 0.22, 0.4, 0.46, 1.2]
    );
    const rel = Math.max(0.016, 0.55 - cam);
    return {
      opacity: interpolate(rel, [0.04, 0.18, 0.4], [0.05, 0.35, 0.12]),
      transform: [
        { translateY: logoH * 0.48 },
        { scaleX: interpolate(rel, [0.04, 0.4], [1.7, 0.65]) },
        { scaleY: interpolate(rel, [0.04, 0.4], [0.25, 0.55]) },
      ],
    };
  });

  const wakeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0, 0.1, 0.2], [1, 0.45, 0]),
  }));

  const exitStyle = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0.86, 0.95, 1], [0, 0.65, 1]),
  }));

  return (
    <>
      <Animated.View style={[styles.wakeScrim, wakeStyle]} pointerEvents="none" />

      <Animated.View
        style={[styles.passVolume, { width: logoW * 2.8 }, volumeStyle]}
        pointerEvents="none"
      />

      <Animated.View style={[styles.layer, hazeStyle]} pointerEvents="none">
        <LogoSvg width={logoW} height={logoH} fill="rgba(255,255,255,0.35)" />
      </Animated.View>

      <Animated.View
        style={[
          styles.passContactShadow,
          { width: logoW * 0.88, height: logoH * 0.32 },
          shadowStyle,
        ]}
        pointerEvents="none"
      />

      <Animated.View style={mainStyle}>
        <LogoSvg width={logoW} height={logoH} fill="#ffffff" />
      </Animated.View>

      <Animated.View style={[styles.wakeScrim, exitStyle]} pointerEvents="none" />
    </>
  );
}

/** Flash — 画面白飛び → 露光が落ちてロゴ焼き付き */
function VariantFlash({ playKey, staticPose, logoW, logoH }: Common) {
  const flash = useSharedValue(0);
  const logo = useSharedValue(staticPose ? 1 : 0);

  useEffect(() => {
    if (staticPose) {
      flash.value = 0;
      logo.value = 1;
      return;
    }
    flash.value = 0;
    logo.value = 0;
    flash.value = withSequence(
      withTiming(1, { duration: 80 }),
      withTiming(0.95, { duration: 100 }),
      withTiming(0, { duration: 780, easing: OUT })
    );
    logo.value = withDelay(160, withTiming(1, { duration: 920, easing: SNAP }));
  }, [flash, logo, playKey, staticPose]);

  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.value }));
  const logoStyle = useAnimatedStyle(() => ({
    opacity: interpolate(logo.value, [0, 0.35, 1], [0, 1, 1]),
    transform: [{ scale: interpolate(logo.value, [0, 1], [1.14, 1]) }],
  }));

  return (
    <>
      <Animated.View style={[styles.screenFlash, flashStyle]} pointerEvents="none" />
      <Animated.View style={logoStyle}>
        <LogoSvg width={logoW} height={logoH} fill="#ffffff" />
      </Animated.View>
    </>
  );
}

/** Glitch — 帯ずれ・RGB・チラつき → 急ロック */
function VariantGlitch({ playKey, staticPose, logoW, logoH }: Common) {
  const t = useSharedValue(staticPose ? 1 : 0);

  useEffect(() => {
    if (staticPose) {
      t.value = 1;
      return;
    }
    t.value = 0;
    t.value = withSequence(
      withTiming(0.22, { duration: 100 }),
      withTiming(0.15, { duration: 70 }),
      withTiming(0.5, { duration: 140 }),
      withTiming(0.38, { duration: 80 }),
      withTiming(0.78, { duration: 180 }),
      withTiming(0.68, { duration: 60 }),
      withTiming(1, { duration: 360, easing: SNAP })
    );
  }, [playKey, staticPose, t]);

  const cyanStyle = useAnimatedStyle(() => {
    const chaos = 1 - t.value;
    return {
      opacity: interpolate(t.value, [0, 0.45, 1], [0, 0.9, 0]),
      transform: [
        { translateX: interpolate(chaos, [0, 1], [0, -16]) },
        { translateY: interpolate(chaos, [0, 1], [0, 4]) },
      ],
    };
  });

  const magStyle = useAnimatedStyle(() => {
    const chaos = 1 - t.value;
    return {
      opacity: interpolate(t.value, [0, 0.45, 1], [0, 0.8, 0]),
      transform: [
        { translateX: interpolate(chaos, [0, 1], [0, 18]) },
        { translateY: interpolate(chaos, [0, 1], [0, -5]) },
      ],
    };
  });

  const whiteStyle = useAnimatedStyle(() => ({
    opacity: interpolate(t.value, [0, 0.3, 0.72, 1], [0, 0.3, 0.5, 1]),
    transform: [
      { translateX: interpolate(t.value, [0, 0.55, 1], [10, -8, 0]) },
    ],
  }));

  const bandStyle = useAnimatedStyle(() => {
    const chaos = 1 - t.value;
    return {
      opacity: interpolate(t.value, [0, 0.25, 0.85, 1], [0, 1, 0.55, 0]),
      transform: [{ translateX: interpolate(chaos, [0, 1], [0, 32]) }],
    };
  });

  return (
    <>
      <Animated.View style={[styles.layer, cyanStyle]} pointerEvents="none">
        <LogoSvg width={logoW} height={logoH} fill={UNITERZ_LOGO_SPLASH_ACCENT} />
      </Animated.View>
      <Animated.View style={[styles.layer, magStyle]} pointerEvents="none">
        <LogoSvg width={logoW} height={logoH} fill={UNITERZ_LOGO_SPLASH_MAGENTA} />
      </Animated.View>
      <View
        style={[
          styles.sliceWindow,
          { width: logoW, height: logoH * 0.3, top: logoH * 0.34 },
        ]}
      >
        <Animated.View style={[{ marginTop: -logoH * 0.34 }, bandStyle]}>
          <LogoSvg width={logoW} height={logoH} fill="#ffffff" />
        </Animated.View>
      </View>
      <Animated.View style={[styles.layer, whiteStyle]} pointerEvents="none">
        <LogoSvg width={logoW} height={logoH} fill="#ffffff" />
      </Animated.View>
    </>
  );
}

/** Rise — リキッドメタルが下から満ちる */
function VariantRise({ playKey, staticPose, logoW, logoH }: Common) {
  const rise = useSharedValue(staticPose ? 1 : 0);
  const glow = useSharedValue(staticPose ? 0.2 : 0);

  useEffect(() => {
    if (staticPose) {
      rise.value = 1;
      glow.value = 0.2;
      return;
    }
    rise.value = 0;
    glow.value = 0;
    glow.value = withTiming(0.75, { duration: 350 });
    rise.value = withDelay(
      180,
      withTiming(1, { duration: 1650, easing: Easing.inOut(Easing.cubic) })
    );
    glow.value = withDelay(1700, withTiming(0.12, { duration: 400 }));
  }, [glow, playKey, rise, staticPose]);

  const clipProps = useAnimatedProps(() => {
    const h = interpolate(rise.value, [0, 1], [0, UNITERZ_LOGO_SPLASH_VB_H + 24]);
    return {
      y: UNITERZ_LOGO_SPLASH_VB_H + 12 - h,
      height: h,
    };
  });

  const meniscusStyle = useAnimatedStyle(() => ({
    opacity: interpolate(rise.value, [0, 0.04, 0.9, 1], [0, 1, 1, 0]),
    transform: [
      {
        translateY: interpolate(rise.value, [0, 1], [logoH * 0.52, -logoH * 0.52]),
      },
    ],
  }));

  const wireStyle = useAnimatedStyle(() => ({ opacity: glow.value }));

  return (
    <>
      <Animated.View style={[styles.layer, wireStyle]} pointerEvents="none">
        <LogoSvg
          width={logoW}
          height={logoH}
          fill="transparent"
          stroke={UNITERZ_LOGO_SPLASH_ACCENT}
          strokeWidth={2.2}
        />
      </Animated.View>
      <Svg width={logoW} height={logoH} viewBox={UNITERZ_LOGO_SPLASH_VIEWBOX}>
        <Defs>
          <ClipPath id={`riseClip-${playKey}`}>
            <AnimatedRect
              x={-24}
              width={UNITERZ_LOGO_SPLASH_VB_W + 48}
              animatedProps={clipProps}
            />
          </ClipPath>
        </Defs>
        <G clipPath={`url(#riseClip-${playKey})`}>
          <LogoPaths fill="#E8FDFF" />
        </G>
      </Svg>
      <Animated.View
        style={[styles.meniscus, { width: logoW }, meniscusStyle]}
        pointerEvents="none"
      />
    </>
  );
}

/** Boot — CRT 緑蛍光 → ロール → 白確定 */
function VariantBoot({ playKey, staticPose, logoW, logoH }: Common) {
  const phase = useSharedValue(staticPose ? 1 : 0);

  useEffect(() => {
    if (staticPose) {
      phase.value = 1;
      return;
    }
    phase.value = 0;
    phase.value = withTiming(1, { duration: 2700, easing: Easing.linear });
  }, [phase, playKey, staticPose]);

  const greenStyle = useAnimatedStyle(() => ({
    opacity: interpolate(phase.value, [0, 0.1, 0.48, 0.64], [0, 0.95, 0.9, 0]),
    transform: [
      { scaleY: interpolate(phase.value, [0, 0.14, 0.5], [0.04, 1.08, 1]) },
      {
        translateY: interpolate(phase.value, [0.38, 0.58], [0, 20], "clamp"),
      },
    ],
  }));

  const whiteStyle = useAnimatedStyle(() => ({
    opacity: interpolate(phase.value, [0.52, 0.7, 1], [0, 1, 1]),
    transform: [
      {
        translateY: interpolate(phase.value, [0.52, 0.74, 1], [24, -3, 0]),
      },
    ],
  }));

  const scanStyle = useAnimatedStyle(() => ({
    opacity: interpolate(phase.value, [0, 0.08, 0.9, 1], [0, 0.55, 0.4, 0.1]),
  }));

  return (
    <>
      <Animated.View style={[styles.scanlines, scanStyle]} pointerEvents="none">
        {Array.from({ length: 28 }, (_, i) => (
          <View key={i} style={styles.scanLine} />
        ))}
      </Animated.View>
      <Animated.View style={greenStyle}>
        <LogoSvg width={logoW} height={logoH} fill={UNITERZ_LOGO_SPLASH_PHOSPHOR} />
      </Animated.View>
      <Animated.View style={[styles.layer, whiteStyle]}>
        <LogoSvg width={logoW} height={logoH} fill="#ffffff" />
      </Animated.View>
    </>
  );
}

/** Warp — 点から回転ズームイン */
function VariantWarp({ playKey, staticPose, logoW, logoH }: Common) {
  const p = useSharedValue(staticPose ? 1 : 0);

  useEffect(() => {
    if (staticPose) {
      p.value = 1;
      return;
    }
    p.value = 0;
    p.value = withTiming(1, { duration: 1350, easing: SNAP });
  }, [p, playKey, staticPose]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0, 0.1, 1], [0, 1, 1]),
    transform: [
      { scale: interpolate(p.value, [0, 0.72, 1], [0.03, 1.14, 1]) },
      { rotate: `${interpolate(p.value, [0, 1], [-52, 0])}deg` },
    ],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0, 0.18, 0.65, 1], [0, 0.85, 0.3, 0]),
    transform: [
      { scale: interpolate(p.value, [0, 1], [0.15, 1.7]) },
      { rotate: `${interpolate(p.value, [0, 1], [0, 140])}deg` },
    ],
  }));

  return (
    <>
      <Animated.View
        style={[
          styles.warpRing,
          { width: logoW * 1.2, height: logoW * 1.2 },
          ringStyle,
        ]}
        pointerEvents="none"
      />
      <Animated.View style={style}>
        <LogoSvg
          width={logoW}
          height={logoH}
          fill="#ffffff"
          stroke={UNITERZ_LOGO_SPLASH_ACCENT}
          strokeWidth={1.6}
          strokeOpacity={0.55}
        />
      </Animated.View>
    </>
  );
}

/** Slice — 横帯が左右交互に突入 */
function SliceBand({
  index,
  playKey,
  staticPose,
  logoW,
  logoH,
  bandH,
}: Common & { index: number; bandH: number }) {
  const p = useSharedValue(staticPose ? 1 : 0);
  const fromX = index % 2 === 0 ? -logoW * 1.2 : logoW * 1.2;

  useEffect(() => {
    if (staticPose) {
      p.value = 1;
      return;
    }
    p.value = 0;
    p.value = withDelay(
      60 + index * 100,
      withTiming(1, { duration: 480, easing: SNAP })
    );
  }, [index, p, playKey, staticPose]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0, 0.12, 1], [0, 1, 1]),
    transform: [{ translateX: interpolate(p.value, [0, 1], [fromX, 0]) }],
  }));

  return (
    <View
      style={[
        styles.sliceWindow,
        { width: logoW, height: bandH + 1, top: index * bandH },
      ]}
    >
      <Animated.View style={[{ marginTop: -index * bandH }, style]}>
        <LogoSvg width={logoW} height={logoH} fill="#ffffff" />
      </Animated.View>
    </View>
  );
}

function VariantSlice({ playKey, staticPose, logoW, logoH }: Common) {
  const bandH = logoH / SLICE_COUNT;
  return (
    <View style={{ width: logoW, height: logoH, overflow: "hidden" }}>
      {Array.from({ length: SLICE_COUNT }, (_, i) => (
        <SliceBand
          key={`slice-${playKey}-${i}`}
          index={i}
          playKey={playKey}
          staticPose={staticPose}
          logoW={logoW}
          logoH={logoH}
          bandH={bandH}
        />
      ))}
    </View>
  );
}

export default function CyberLogoSplashScreenNative({
  playKey = 0,
  forceStatic = false,
  variant = "pass",
}: Props) {
  const reduceMotion = useReducedMotion();
  const staticPose = forceStatic || reduceMotion === true;
  const { width: winW } = useWindowDimensions();
  const logoW = Math.min(winW * 0.86, 420);
  const logoH = logoW * LOGO_ASPECT;
  const common: Common = { playKey, staticPose, logoW, logoH };

  if (variant === "letters") {
    return (
      <LettersSplashScreenNative
        playKey={playKey}
        forceStatic={forceStatic}
      />
    );
  }

  if (variant === "form") {
    return (
      <LineFormSplashScreenNative
        playKey={playKey}
        forceStatic={forceStatic}
      />
    );
  }

  if (variant === "space") {
    return (
      <SplashScreenNative
        playKey={playKey}
        forceStatic={forceStatic}
      />
    );
  }

  if (variant === "lightning") {
    return (
      <LightningSplashScreenNative
        playKey={playKey}
        forceStatic={forceStatic}
      />
    );
  }

  let body: ReactNode;
  switch (variant) {
    case "pass":
      body = <VariantPass {...common} />;
      break;
    case "glitch":
      body = <VariantGlitch {...common} />;
      break;
    case "rise":
      body = <VariantRise {...common} />;
      break;
    case "boot":
      body = <VariantBoot {...common} />;
      break;
    case "warp":
      body = <VariantWarp {...common} />;
      break;
    case "slice":
      body = <VariantSlice {...common} />;
      break;
    case "flash":
      body = <VariantFlash {...common} />;
      break;
    default:
      body = <VariantPass {...common} />;
      break;
  }

  return (
    <View style={styles.root} accessibilityLabel="読み込み中">
      <View
        style={[
          styles.vignette,
          variant === "boot" && styles.vignetteBoot,
          variant === "flash" && styles.vignetteFlash,
          variant === "pass" && styles.vignettePass,
        ]}
        pointerEvents="none"
      />
      <View style={styles.centerWrap} pointerEvents="none">
        <View style={[styles.stage, { width: logoW, height: logoH }]}>{body}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#03070b",
    overflow: "hidden",
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 245, 255, 0.02)",
  },
  vignetteBoot: {
    backgroundColor: "rgba(10, 30, 8, 0.55)",
  },
  vignetteFlash: {
    backgroundColor: "#000000",
  },
  vignettePass: {
    backgroundColor: "#000000",
  },
  centerWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  stage: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  layer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  wakeScrim: {
    position: "absolute",
    width: 4000,
    height: 4000,
    left: -1800,
    top: -1800,
    backgroundColor: "#000000",
    zIndex: 30,
  },
  /** 奥の空間を示す薄い面（ほぼ黒、白は極薄） */
  passVolume: {
    position: "absolute",
    height: 260,
    backgroundColor: "rgba(255, 255, 255, 0.035)",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  passContactShadow: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
  },
  screenFlash: {
    position: "absolute",
    width: 4000,
    height: 4000,
    left: -1800,
    top: -1800,
    backgroundColor: "#ffffff",
    zIndex: 20,
  },
  meniscus: {
    position: "absolute",
    height: 2,
    left: 0,
    backgroundColor: UNITERZ_LOGO_SPLASH_ACCENT,
    shadowColor: UNITERZ_LOGO_SPLASH_ACCENT,
    shadowOpacity: 1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  scanlines: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-evenly",
    zIndex: 3,
  },
  scanLine: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(57, 255, 20, 0.22)",
  },
  warpRing: {
    position: "absolute",
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "rgba(0, 245, 255, 0.6)",
    borderStyle: "dashed",
  },
  sliceWindow: {
    position: "absolute",
    left: 0,
    overflow: "hidden",
  },
});
