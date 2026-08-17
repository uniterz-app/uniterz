/**
 * Web 相当の雷スプラッシュ — 暗闇に落雷し UNITERZ ロゴが浮かび上がる。
 * Path は開始時に一度だけ生成。動画 / GIF / Lottie 不使用。
 */
import { useEffect, useMemo } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { Canvas, Skia } from "@shopify/react-native-skia";
import {
  Easing,
  runOnJS,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import {
  createSeededRng,
  generateLightningBolt,
  type LightningPoint,
} from "../../../../../lib/splash/generateLightningBolt";
import {
  UNITERZ_LOGO_SPLASH_VB_H,
  UNITERZ_LOGO_SPLASH_VB_W,
} from "../../../../../lib/units/uniterzLogoSplash";
import CyberBackgroundLightningNative from "./lightning/CyberBackgroundLightningNative";
import LightningAmbientNative from "./lightning/LightningAmbientNative";
import LightningBoltNative, {
  type BoltLayerSpec,
} from "./lightning/LightningBoltNative";
import LightningFlashNative from "./lightning/LightningFlashNative";
import LightningResidualNative from "./lightning/LightningResidualNative";
import LogoRevealNative from "./lightning/LogoRevealNative";
import {
  LIGHTNING_SPLASH,
  MAIN_BOLT_FLICKER,
} from "./lightning/lightningTiming";

const LOGO_ASPECT = UNITERZ_LOGO_SPLASH_VB_H / UNITERZ_LOGO_SPLASH_VB_W;
const TOTAL_MS = LIGHTNING_SPLASH.totalMs;

type Props = {
  playKey?: number;
  forceStatic?: boolean;
  onComplete?: () => void;
};

function pointsToSkPath(points: LightningPoint[]) {
  const path = Skia.Path.Make();
  if (points.length === 0) return path;
  const first = points[0]!;
  path.moveTo(first.x, first.y);
  for (let i = 1; i < points.length; i++) {
    const p = points[i]!;
    path.lineTo(p.x, p.y);
  }
  return path;
}

function buildBoltSpecs(
  width: number,
  height: number,
  seed: number
): {
  pre: BoltLayerSpec[];
  main: BoltLayerSpec[];
  strikeCx: number;
  strikeCy: number;
} {
  const rng = createSeededRng(seed * 9973 + 13);
  const rng2 = createSeededRng(seed * 7919 + 41);

  const midX = width * (0.42 + rng() * 0.16);
  const endY = height * (0.48 + rng() * 0.1);
  const startX = midX + (rng() * 2 - 1) * width * 0.08;

  // プレストライク（短い細雷・ロゴ背後）
  const preBolt = generateLightningBolt({
    startX: width * 0.48 + (rng() * 2 - 1) * 20,
    startY: height * 0.28,
    endX: width * 0.52 + (rng() * 2 - 1) * 16,
    endY: height * 0.48,
    segments: 7,
    jitter: Math.min(22, width * 0.04),
    branchProbability: 0.28,
    maxDepth: 1,
    rng,
  });

  // メイン落雷（上部 → 中央）
  const mainBolt = generateLightningBolt({
    startX,
    startY: -height * 0.02,
    endX: midX,
    endY,
    segments: 11 + Math.floor(rng2() * 4),
    jitter: Math.min(36, width * 0.065),
    branchProbability: 0.48,
    maxDepth: 2,
    rng: rng2,
  });

  // 2本目のバリエーション（切り替え用に薄く重ねる枝セット）
  const altBolt = generateLightningBolt({
    startX: startX + (rng2() * 2 - 1) * 18,
    startY: 0,
    endX: midX + (rng2() * 2 - 1) * 12,
    endY: endY + 8,
    segments: 10,
    jitter: Math.min(30, width * 0.055),
    branchProbability: 0.38,
    maxDepth: 2,
    rng: createSeededRng(seed * 1337 + 99),
  });

  const pre: BoltLayerSpec[] = [
    { path: pointsToSkPath(preBolt.main), kind: "branch" },
    ...preBolt.branches.map((b) => ({
      path: pointsToSkPath(b.points),
      kind: (b.depth >= 2 ? "twig" : "branch") as BoltLayerSpec["kind"],
    })),
  ];

  const main: BoltLayerSpec[] = [
    { path: pointsToSkPath(mainBolt.main), kind: "main" },
    ...mainBolt.branches.map((b) => ({
      path: pointsToSkPath(b.points),
      kind: (b.depth >= 2 ? "twig" : "branch") as BoltLayerSpec["kind"],
    })),
    // alt のメインは枝扱いで少し重ね、形の揺らぎを出す
    { path: pointsToSkPath(altBolt.main), kind: "branch" },
    ...altBolt.branches.slice(0, 4).map((b) => ({
      path: pointsToSkPath(b.points),
      kind: "twig" as const,
    })),
  ];

  return {
    pre,
    main,
    strikeCx: midX,
    strikeCy: endY * 0.55,
  };
}

function buildFlickerSequence(
  startDelayMs: number,
  peak: number
) {
  const steps = MAIN_BOLT_FLICKER.filter((s) => s.durationMs > 0).map((s) =>
    withTiming(s.on ? peak : 0, {
      duration: Math.max(1, s.durationMs),
      easing: Easing.linear,
    })
  );
  return withDelay(startDelayMs, withSequence(...steps, withTiming(0, { duration: 1 })));
}

export default function LightningSplashScreenNative({
  playKey = 0,
  forceStatic = false,
  onComplete,
}: Props) {
  const reduceMotion = useReducedMotion();
  const staticPose = forceStatic || reduceMotion === true;
  const { width, height } = useWindowDimensions();
  const logoW = Math.min(width * 0.78, 360);
  const logoH = logoW * LOGO_ASPECT;

  const progress = useSharedValue(staticPose ? 1 : 0);
  const preIntensity = useSharedValue(0);
  const mainIntensity = useSharedValue(0);
  const ambientIntensity = useSharedValue(0);
  const flashIntensity = useSharedValue(0);
  const strikePulse = useSharedValue(0);

  const geometry = useMemo(
    () => buildBoltSpecs(width, height, playKey + 1),
    [width, height, playKey]
  );

  useEffect(() => {
    if (staticPose) {
      progress.value = 1;
      preIntensity.value = 0;
      mainIntensity.value = 0;
      ambientIntensity.value = 0;
      flashIntensity.value = 0;
      strikePulse.value = 0;
      onComplete?.();
      return;
    }

    progress.value = 0;
    preIntensity.value = 0;
    mainIntensity.value = 0;
    ambientIntensity.value = 0;
    flashIntensity.value = 0;
    strikePulse.value = 0;

    progress.value = withTiming(
      1,
      { duration: TOTAL_MS, easing: Easing.linear },
      (finished) => {
        if (finished && onComplete) {
          runOnJS(onComplete)();
        }
      }
    );

    // プレストライク: 短い ON
    const preDur = LIGHTNING_SPLASH.preStrikeDurationMs;
    preIntensity.value = withDelay(
      LIGHTNING_SPLASH.preStrikeMs,
      withSequence(
        withTiming(0.85, { duration: 12, easing: Easing.linear }),
        withTiming(0.85, { duration: Math.max(1, preDur - 20) }),
        withTiming(0, { duration: 12, easing: Easing.linear })
      )
    );

    // メイン落雷 + 不規則点滅
    mainIntensity.value = buildFlickerSequence(
      LIGHTNING_SPLASH.mainStartMs,
      1
    );

    // 周辺照明（メイン開始直後に短く強く）
    ambientIntensity.value = withDelay(
      LIGHTNING_SPLASH.mainStartMs,
      withSequence(
        withTiming(1, { duration: 40, easing: Easing.out(Easing.quad) }),
        withTiming(0.55, { duration: 50 }),
        withTiming(0.15, { duration: 80 }),
        withTiming(0.7, { duration: 30 }),
        withTiming(0.1, { duration: 60 }),
        withTiming(0.45, { duration: 35 }),
        withTiming(0, { duration: 120 })
      )
    );

    // 画面フラッシュ
    flashIntensity.value = withDelay(
      LIGHTNING_SPLASH.mainStartMs,
      withSequence(
        withTiming(1, { duration: 30, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 90, easing: Easing.in(Easing.quad) }),
        withTiming(0.55, { duration: 25 }),
        withTiming(0, { duration: 70 })
      )
    );

    // ロゴパルス: プレストライク → メイン落雷（1本のシーケンスで上書き衝突を避ける）
    const gapToMain = Math.max(
      1,
      LIGHTNING_SPLASH.mainStartMs - LIGHTNING_SPLASH.preStrikeMs - 220
    );
    strikePulse.value = withDelay(
      LIGHTNING_SPLASH.preStrikeMs,
      withSequence(
        withTiming(1, { duration: 20 }),
        withTiming(0.35, { duration: 80 }),
        withTiming(0, { duration: 120 }),
        withTiming(0, { duration: gapToMain }),
        withTiming(1, { duration: 30 }),
        withTiming(0.5, { duration: 50 }),
        withTiming(0.9, { duration: 25 }),
        withTiming(0.35, { duration: 60 }),
        withTiming(0.75, { duration: 40 }),
        withTiming(0.2, { duration: 100 }),
        withTiming(0, { duration: 200 })
      )
    );
  }, [
    playKey,
    staticPose,
    progress,
    preIntensity,
    mainIntensity,
    ambientIntensity,
    flashIntensity,
    strikePulse,
    onComplete,
  ]);

  return (
    <View style={styles.root} accessibilityLabel="読み込み中">
      <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
        <CyberBackgroundLightningNative width={width} height={height} />
        <LightningAmbientNative
          width={width}
          height={height}
          cx={geometry.strikeCx}
          cy={geometry.strikeCy}
          intensity={ambientIntensity}
        />
        <LightningBoltNative bolts={geometry.pre} intensity={preIntensity} />
        <LightningBoltNative bolts={geometry.main} intensity={mainIntensity} />
        <LightningResidualNative
          width={width}
          height={height}
          cx={geometry.strikeCx}
          cy={geometry.strikeCy}
          progress={progress}
          staticPose={staticPose}
        />
      </Canvas>

      <View style={styles.logoCenter} pointerEvents="none">
        <LogoRevealNative
          logoW={logoW}
          logoH={logoH}
          progress={progress}
          strikePulse={strikePulse}
          staticPose={staticPose}
        />
      </View>

      <LightningFlashNative intensity={flashIntensity} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: LIGHTNING_SPLASH.bg,
  },
  logoCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
});
