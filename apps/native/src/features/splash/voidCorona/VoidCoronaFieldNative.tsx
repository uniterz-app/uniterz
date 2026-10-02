/**
 * Void Corona フィールド — 粒子は個別軌道（一塊の Group 回転はしない）。
 */
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import {
  Canvas,
  Circle,
  Group,
  Paint,
  Points,
  RadialGradient,
  Rect,
  vec,
} from "@shopify/react-native-skia";
import {
  interpolate,
  type SharedValue,
  useDerivedValue,
} from "react-native-reanimated";
import { VOID_CORONA_COLORS } from "../../../../../../lib/splash/voidCoronaConcepts";
import {
  attachVoidCoronaUTargets,
  buildVoidCoronaParticleLayers,
  type VoidCoronaFormUExit,
  type VoidCoronaMotionMode,
  type VoidCoronaParticlePack,
} from "./voidCoronaParticles";

export type VoidCoronaFieldMode = VoidCoronaMotionMode;

type Props = {
  width: number;
  height: number;
  progress: SharedValue<number>;
  mode: VoidCoronaFieldMode;
  pulse?: SharedValue<number>;
  staticPose?: boolean;
  /** formU: U マーク描画サイズ（px） */
  markSize?: number;
  formUExit?: VoidCoronaFormUExit;
  /** 粒子パレット。chrome = リキッドメタル / obsidian = 黒液・微粒子 */
  palette?: "void" | "chrome" | "obsidian";
};

/** worklet 内で完結（別ファイル import 依存を避ける） */
function writePackPositions(
  pack: VoidCoronaParticlePack,
  mode: VoidCoronaFieldMode,
  t: number,
  breath: number,
  cx: number,
  cy: number,
  voidR: number,
  span: number,
  markSize: number,
  formExit: VoidCoronaFormUExit
) {
  "worklet";
  const {
    count,
    angle0,
    radiusNorm,
    spin,
    phase,
    targetOffX,
    targetOffY,
    buffer,
  } = pack;
  for (let i = 0; i < count; i++) {
    const a0 = angle0[i];
    const rn0 = radiusNorm[i];
    const sp = spin[i];
    const ph = phase[i];
    let rn = rn0;
    let ang = a0;

    if (mode === "converge") {
      const local = Math.min(1, Math.max(0, (t - ph * 0.38) / 0.72));
      const ease = local * local * (3 - 2 * local);
      ang = a0 + sp * (0.35 + t * 2.1) + ease * sp * 2.4;
      rn = rn0 * (1 - ease * 0.97) + 0.012 * ease;
    } else if (mode === "materialize") {
      const local = Math.min(1, Math.max(0, (t - ph * 0.3) / 0.68));
      const ease = local * local * (3 - 2 * local);
      ang = a0 + sp * t * 2.6 + (1 - ease) * (ph - 0.5) * 1.4;
      const target = 0.035 + ph * 0.09;
      rn = rn0 * (1 - ease) + target * ease;
    } else if (mode === "portal") {
      const kick = Math.max(0, t - 0.32 - ph * 0.22);
      ang = a0 + sp * (0.25 + t * 1.0) + kick * sp * 1.8;
      rn = rn0 * (1 + kick * kick * (2.6 + Math.abs(sp) * 1.2));
    } else if (mode === "pulse") {
      const wobble = Math.sin((t * 2.4 + ph) * Math.PI * 2) * 0.5 + 0.5;
      ang = a0 + sp * (0.4 + t * 0.65) + breath * sp * 0.35;
      rn =
        rn0 *
        (1 +
          breath * 0.06 * (1 - rn0) +
          wobble * 0.025 * (sp >= 0 ? 1 : -1));
    } else if (mode === "formU") {
      const shrinkLocal = Math.min(1, Math.max(0, (t - ph * 0.18) / 0.42));
      const shrink = shrinkLocal * shrinkLocal * (3 - 2 * shrinkLocal);
      ang = a0 + sp * (0.3 + t * 1.6) + shrink * sp * 1.2;
      rn = rn0 * (1 - shrink * 0.88) + 0.04 * (1 - shrink);
      const sx = cx + Math.cos(ang) * (voidR + Math.max(0, rn) * span);
      const sy = cy + Math.sin(ang) * (voidR + Math.max(0, rn) * span);
      const tx = cx + targetOffX[i] * markSize;
      const ty = cy + targetOffY[i] * markSize;
      const formLocal = Math.min(
        1,
        Math.max(0, (t - 0.28 - ph * 0.22) / 0.48)
      );
      const form = formLocal * formLocal * (3 - 2 * formLocal);
      let x = sx + (tx - sx) * form;
      let y = sy + (ty - sy) * form;
      if (formExit === "scatter" && t > 0.78) {
        const kick = Math.min(1, Math.max(0, (t - 0.78) / 0.22));
        const ease = kick * kick;
        x += Math.cos(ang + sp) * ease * span * (0.35 + Math.abs(sp));
        y += Math.sin(ang + sp) * ease * span * (0.35 + Math.abs(sp));
      }
      buffer[i].x = x;
      buffer[i].y = y;
      continue;
    } else {
      const local = Math.min(1, Math.max(0, (t - ph * 0.22) / 0.82));
      const ease = local * local;
      ang = a0 + sp * (0.2 + t * 1.25) + ease * (sp >= 0 ? 0.85 : -0.85);
      rn = rn0 * (0.82 + ease * (1.55 + Math.abs(sp)));
    }

    const r = voidR + Math.max(0, rn) * span;
    buffer[i].x = cx + Math.cos(ang) * r;
    buffer[i].y = cy + Math.sin(ang) * r;
  }
  return buffer;
}

function useAnimatedPackPoints(
  pack: VoidCoronaParticlePack,
  progress: SharedValue<number>,
  mode: VoidCoronaFieldMode,
  pulse: SharedValue<number> | undefined,
  staticPose: boolean,
  cx: number,
  cy: number,
  voidR: number,
  span: number,
  markSize: number,
  formExit: VoidCoronaFormUExit
) {
  return useDerivedValue(() => {
    const t = staticPose
      ? mode === "formU"
        ? formExit === "scatter"
          ? 0.72
          : 0.88
        : 0.45
      : progress.value;
    const breath = pulse ? pulse.value : 0;
    return writePackPositions(
      pack,
      mode,
      t,
      breath,
      cx,
      cy,
      voidR,
      span,
      markSize,
      formExit
    );
  });
}

export default function VoidCoronaFieldNative({
  width,
  height,
  progress,
  mode,
  pulse,
  staticPose = false,
  markSize: markSizeProp,
  formUExit = "lock",
  palette = "void",
}: Props) {
  const cx = width * 0.5;
  const cy = height * 0.5;
  const voidRadius = Math.min(width, height) * 0.168;
  const maxR = Math.hypot(width, height) * 0.72;
  const chrome = palette === "chrome";
  const obsidian = palette === "obsidian";
  const span = Math.max(8, maxR - voidRadius);
  const markSize =
    markSizeProp ?? Math.min(width, height) * 0.42;

  const layers = useMemo(() => {
    const base = buildVoidCoronaParticleLayers(width, height);
    if (mode === "formU") return attachVoidCoronaUTargets(base);
    return base;
  }, [width, height, mode]);

  const common = [
    progress,
    mode,
    pulse,
    staticPose,
    cx,
    cy,
    voidRadius,
    span,
    markSize,
    formUExit,
  ] as const;

  const rimWhitePts = useAnimatedPackPoints(layers.rimWhite, ...common);
  const pinCyanPts = useAnimatedPackPoints(layers.pinCyan, ...common);
  const pinGoldPts = useAnimatedPackPoints(layers.pinGold, ...common);
  const pinPinkPts = useAnimatedPackPoints(layers.pinPink, ...common);
  const pinVioletPts = useAnimatedPackPoints(layers.pinViolet, ...common);
  const pinSkyPts = useAnimatedPackPoints(layers.pinSky, ...common);
  const pinMintPts = useAnimatedPackPoints(layers.pinMint, ...common);
  const pinPeachPts = useAnimatedPackPoints(layers.pinPeach, ...common);
  const grainCoolPts = useAnimatedPackPoints(layers.grainCool, ...common);
  const grainWarmPts = useAnimatedPackPoints(layers.grainWarm, ...common);
  const bokehCyanPts = useAnimatedPackPoints(layers.bokehCyan, ...common);
  const bokehPinkPts = useAnimatedPackPoints(layers.bokehPink, ...common);
  const bokehGoldPts = useAnimatedPackPoints(layers.bokehGold, ...common);

  const fieldOpacity = useDerivedValue(() => {
    const t = staticPose ? 0.42 : progress.value;
    const breath = pulse ? pulse.value : 0;
    if (mode === "converge")
      return interpolate(t, [0.6, 0.95], [1, 0.4], "clamp");
    if (mode === "materialize")
      return interpolate(t, [0.55, 0.95], [1, 0.32], "clamp");
    if (mode === "portal")
      return interpolate(t, [0.5, 0.85], [1, 0], "clamp");
    if (mode === "pulse") return 0.92 + breath * 0.08;
    if (mode === "formU") {
      if (formUExit === "scatter")
        return interpolate(t, [0.72, 0.95], [1, 0.05], "clamp");
      if (formUExit === "hold") return 1;
      // lock: 集まったら粒子は完全に消えてソリッド U だけ残す
      return interpolate(t, [0.52, 0.68], [1, 0], "clamp");
    }
    return interpolate(t, [0.45, 0.9], [1, 0.15], "clamp");
  });

  const voidExpand = useDerivedValue(() => {
    if (mode !== "portal") return voidRadius;
    const t = staticPose ? 0.3 : progress.value;
    return interpolate(
      t,
      [0.45, 0.72, 1],
      [voidRadius, voidRadius * 2.4, Math.max(width, height) * 1.25],
      "clamp"
    );
  });

  const coronaGlowOpacity = useDerivedValue(() => {
    const t = staticPose ? 0.5 : progress.value;
    const breath = pulse ? pulse.value : 0;
    if (mode === "pulse") return 0.55 + breath * 0.4;
    if (mode === "converge")
      return interpolate(t, [0, 0.4, 0.85], [0.55, 0.9, 0.3], "clamp");
    if (mode === "materialize")
      return interpolate(t, [0, 0.35, 0.8], [0.5, 1, 0.35], "clamp");
    if (mode === "portal")
      return interpolate(t, [0.25, 0.5, 0.85], [0.6, 0.9, 0], "clamp");
    if (mode === "formU") {
      if (formUExit === "lock")
        return interpolate(
          t,
          [0, 0.28, 0.52, 0.7],
          [0.55, 0.95, 0.4, 0.12],
          "clamp"
        );
      return interpolate(
        t,
        [0, 0.3, 0.55, 0.9],
        [0.55, 0.95, 0.45, 0.2],
        "clamp"
      );
    }
    return interpolate(t, [0.08, 0.35, 0.8], [0.45, 0.75, 0.15], "clamp");
  });

  /** formU では黒円を徐々に薄め、粒子 U が読めるようにする */
  const voidOpacity = useDerivedValue(() => {
    if (mode !== "formU") return 1;
    const t = staticPose ? 0.88 : progress.value;
    return interpolate(t, [0.35, 0.62], [1, 0.08], "clamp");
  });

  if (width <= 0 || height <= 0) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Canvas style={{ width, height }}>
        <Rect
          x={0}
          y={0}
          width={width}
          height={height}
          color={VOID_CORONA_COLORS.bg}
        />

        <Circle cx={cx} cy={cy} r={maxR}>
          <RadialGradient
            c={vec(cx, cy)}
            r={maxR}
            colors={[
              "rgba(48, 22, 38, 0.42)",
              "rgba(18, 10, 22, 0.22)",
              "rgba(0,0,0,0)",
            ]}
            positions={[0.12, 0.4, 1]}
          />
        </Circle>

        <Group opacity={coronaGlowOpacity}>
          <Circle cx={cx} cy={cy} r={voidRadius * 2.6}>
            <RadialGradient
              c={vec(cx, cy)}
              r={voidRadius * 2.6}
              colors={[
                "rgba(70, 28, 55, 0.5)",
                "rgba(40, 16, 48, 0.32)",
                "rgba(16, 10, 14, 0.14)",
                "rgba(0,0,0,0)",
              ]}
              positions={[0.15, 0.35, 0.55, 1]}
            />
          </Circle>
          <Circle cx={cx} cy={cy} r={voidRadius * 1.28}>
            <RadialGradient
              c={vec(cx, cy)}
              r={voidRadius * 1.28}
              colors={[
                "rgba(0,0,0,0)",
                "rgba(160, 28, 42, 0.62)",
                "rgba(72, 32, 98, 0.48)",
                "rgba(55, 55, 60, 0.3)",
                "rgba(0,0,0,0)",
              ]}
              positions={[0.55, 0.7, 0.8, 0.9, 1]}
            />
          </Circle>
        </Group>

        <Group opacity={fieldOpacity}>
          {/* ダーク色は screen だと消えるので通常合成 */}
          <Group>
            {chrome ? (
              <>
                {/* リキッドメタル: 水銀〜スチール〜ハイライト */}
                <Points
                  points={grainCoolPts}
                  mode="points"
                  color="rgba(140, 148, 160, 0.55)"
                  strokeWidth={0.75}
                />
                <Points
                  points={grainWarmPts}
                  mode="points"
                  color="rgba(70, 74, 82, 0.7)"
                  strokeWidth={0.85}
                />
                <Points
                  points={pinSkyPts}
                  mode="points"
                  color="rgba(190, 198, 210, 0.88)"
                  strokeWidth={1.4}
                />
                <Points
                  points={pinPeachPts}
                  mode="points"
                  color="rgba(100, 104, 112, 0.9)"
                  strokeWidth={1.45}
                />
                <Points
                  points={pinVioletPts}
                  mode="points"
                  color="rgba(168, 176, 188, 0.92)"
                  strokeWidth={1.25}
                />
                <Points
                  points={pinMintPts}
                  mode="points"
                  color="rgba(88, 92, 100, 0.92)"
                  strokeWidth={1.2}
                />
                <Points
                  points={pinGoldPts}
                  mode="points"
                  color="rgba(230, 234, 240, 0.95)"
                  strokeWidth={1.25}
                />
                <Points
                  points={pinPinkPts}
                  mode="points"
                  color="rgba(150, 156, 168, 0.9)"
                  strokeWidth={1.2}
                />
                <Points
                  points={pinCyanPts}
                  mode="points"
                  color="rgba(210, 216, 224, 0.92)"
                  strokeWidth={1.15}
                />
                <Points
                  points={rimWhitePts}
                  mode="points"
                  color="rgba(255, 255, 255, 0.98)"
                  strokeWidth={1.2}
                />
                <Points
                  points={bokehCyanPts}
                  mode="points"
                  color="rgba(180, 190, 205, 0.22)"
                  strokeWidth={9}
                />
                <Points
                  points={bokehPinkPts}
                  mode="points"
                  color="rgba(120, 128, 140, 0.2)"
                  strokeWidth={14}
                />
                <Points
                  points={bokehGoldPts}
                  mode="points"
                  color="rgba(240, 244, 250, 0.12)"
                  strokeWidth={22}
                />
              </>
            ) : obsidian ? (
              <>
                {/* 黒液・微粒子: ほぼ無彩色、ハイライトはごく弱い */}
                <Points
                  points={grainCoolPts}
                  mode="points"
                  color="rgba(48, 48, 52, 0.7)"
                  strokeWidth={0.55}
                />
                <Points
                  points={grainWarmPts}
                  mode="points"
                  color="rgba(18, 18, 20, 0.85)"
                  strokeWidth={0.65}
                />
                <Points
                  points={pinSkyPts}
                  mode="points"
                  color="rgba(72, 72, 78, 0.8)"
                  strokeWidth={1.05}
                />
                <Points
                  points={pinPeachPts}
                  mode="points"
                  color="rgba(28, 28, 32, 0.9)"
                  strokeWidth={1.15}
                />
                <Points
                  points={pinVioletPts}
                  mode="points"
                  color="rgba(58, 58, 64, 0.85)"
                  strokeWidth={1.0}
                />
                <Points
                  points={pinMintPts}
                  mode="points"
                  color="rgba(36, 36, 40, 0.88)"
                  strokeWidth={0.95}
                />
                <Points
                  points={pinGoldPts}
                  mode="points"
                  color="rgba(96, 96, 104, 0.75)"
                  strokeWidth={1.05}
                />
                <Points
                  points={pinPinkPts}
                  mode="points"
                  color="rgba(42, 42, 46, 0.9)"
                  strokeWidth={1.0}
                />
                <Points
                  points={pinCyanPts}
                  mode="points"
                  color="rgba(64, 64, 70, 0.82)"
                  strokeWidth={0.95}
                />
                <Points
                  points={rimWhitePts}
                  mode="points"
                  color="rgba(120, 120, 128, 0.55)"
                  strokeWidth={0.9}
                />
                <Points
                  points={bokehCyanPts}
                  mode="points"
                  color="rgba(40, 40, 44, 0.25)"
                  strokeWidth={8}
                />
                <Points
                  points={bokehPinkPts}
                  mode="points"
                  color="rgba(24, 24, 28, 0.3)"
                  strokeWidth={12}
                />
                <Points
                  points={bokehGoldPts}
                  mode="points"
                  color="rgba(12, 12, 14, 0.4)"
                  strokeWidth={18}
                />
              </>
            ) : (
              <>
                {/* グレー */}
                <Points
                  points={grainCoolPts}
                  mode="points"
                  color="rgba(92, 92, 98, 0.8)"
                  strokeWidth={0.7}
                />
                <Points
                  points={pinSkyPts}
                  mode="points"
                  color="rgba(128, 128, 136, 0.94)"
                  strokeWidth={1.35}
                />
                <Points
                  points={rimWhitePts}
                  mode="points"
                  color="rgba(158, 158, 166, 0.9)"
                  strokeWidth={1.1}
                />
                {/* 黒〜チャコール */}
                <Points
                  points={grainWarmPts}
                  mode="points"
                  color="rgba(22, 22, 26, 0.92)"
                  strokeWidth={0.8}
                />
                <Points
                  points={pinPeachPts}
                  mode="points"
                  color="rgba(38, 38, 44, 0.96)"
                  strokeWidth={1.4}
                />
                <Points
                  points={bokehGoldPts}
                  mode="points"
                  color="rgba(14, 14, 18, 0.35)"
                  strokeWidth={20}
                />
                {/* 紫 */}
                <Points
                  points={pinVioletPts}
                  mode="points"
                  color="rgba(92, 38, 128, 0.96)"
                  strokeWidth={1.25}
                />
                <Points
                  points={pinMintPts}
                  mode="points"
                  color="rgba(48, 22, 72, 0.96)"
                  strokeWidth={1.2}
                />
                <Points
                  points={pinCyanPts}
                  mode="points"
                  color="rgba(68, 24, 102, 0.95)"
                  strokeWidth={1.15}
                />
                <Points
                  points={bokehPinkPts}
                  mode="points"
                  color="rgba(48, 18, 70, 0.28)"
                  strokeWidth={12}
                />
                {/* 赤 */}
                <Points
                  points={pinGoldPts}
                  mode="points"
                  color="rgba(168, 28, 42, 0.97)"
                  strokeWidth={1.25}
                />
                <Points
                  points={pinPinkPts}
                  mode="points"
                  color="rgba(118, 16, 30, 0.97)"
                  strokeWidth={1.2}
                />
                <Points
                  points={bokehCyanPts}
                  mode="points"
                  color="rgba(100, 22, 36, 0.28)"
                  strokeWidth={8}
                />
              </>
            )}
          </Group>
        </Group>

        <Group opacity={voidOpacity}>
          <Circle
            cx={cx}
            cy={cy}
            r={voidExpand}
            color={VOID_CORONA_COLORS.void}
          />
        </Group>

        <Rect x={0} y={0} width={width} height={height}>
          <RadialGradient
            c={vec(cx, cy)}
            r={Math.max(width, height) * 0.82}
            colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.58)"]}
            positions={[0.48, 1]}
          />
        </Rect>
      </Canvas>
    </View>
  );
}
