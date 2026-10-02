/**
 * Get Started 背景 — 黒地に、粒子の乗った一本のうねる帯。
 * 見た目は維持しつつ GPU 負荷を抑える:
 * - 0.72 解像度キャンバスを拡大表示
 * - 粒はフル論理解像度でサンプル（低解像拡大で粗く見えないように）
 * - u_time を ~24fps に間引き
 * - fbm は 2 octave
 * - App inactive / paused（同意モーダル・フォーム着地）で時刻凍結
 */
import { useEffect, useMemo } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import {
  BlurMask,
  Canvas,
  Fill,
  FractalNoise,
  Group,
  LinearGradient,
  Oval,
  Shader,
  Skia,
  vec,
} from "@shopify/react-native-skia";
import {
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
} from "react-native-reanimated";
import { AUTH_LANDING } from "./authLandingPalette";
import { useAppActiveNative } from "../../hooks/useAppActiveNative";

const FROZEN_MS = 22000;
/** 描画解像度（帯の形状用）。0.72 ≈ 画素 ~1/2、拡大ボケを抑えつつフルより軽い */
const RENDER_SCALE = 0.72;
/** シェーダ時刻の更新間隔（約 24fps） */
const CLOCK_INTERVAL_MS = Math.round(1000 / 24);
const FOG_PEAK = AUTH_LANDING.fogPeak;
const FOG_PEAK_BYTE = Math.round(FOG_PEAK * 255);

/**
 * 帯の形状・明るさは従来どおり。
 * fbm は 2 octave のまま。粒は u_grain_res（フル論理解像度）でサンプルし、
 * 低解像度拡大で粒が粗く見えないようにする。
 */
const WAVE_SKSL = `
uniform float u_time;
uniform float2 u_res;
uniform float2 u_grain_res;
uniform float u_peak;

float hash(float2 p) {
  return fract(sin(dot(p, float2(127.1, 311.7))) * 43758.5453123);
}

float vnoise(float2 p) {
  float2 i = floor(p);
  float2 f = fract(p);
  float2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + float2(1.0, 0.0));
  float c = hash(i + float2(0.0, 1.0));
  float d = hash(i + float2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(float2 p) {
  float s = 0.0;
  float a = 0.55;
  s += a * vnoise(p);
  p *= 2.02;
  a *= 0.5;
  s += a * vnoise(p);
  return s * 1.12;
}

half4 main(float2 xy) {
  float2 uv = xy / u_res;
  float t = u_time * 0.001;
  // 粒密度はフル解像度相当（低解像キャンバスの xy 直叩きだと拡大で荒くなる）
  float2 gx = uv * u_grain_res;

  float n1 = fbm(uv * float2(1.35, 2.4) + float2(t * 0.042, t * 0.033));
  float n2 = fbm(uv * float2(1.7, 2.8) + float2(4.2, 1.6) + float2(-t * 0.036, t * 0.047));
  float2 wuv = uv + float2((n1 - 0.5) * 0.07, (n2 - 0.5) * 0.16);

  float phase = t * 0.13;
  float spine = 0.47
    + 0.18 * sin(wuv.x * 2.85 + phase)
    + 0.06 * sin(wuv.x * 5.2 - phase * 0.65);
  spine += (fbm(float2(wuv.x * 2.8, t * 0.07 + 2.4)) - 0.5) * 0.08;

  float d = abs(wuv.y - spine);
  float thick = 0.105
    + 0.042 * sin(wuv.x * 3.1 + phase * 0.4)
    + 0.034 * fbm(float2(wuv.x * 2.2 + t * 0.048, 8.0));

  float veil = exp(-pow(d / max(thick * 1.08, 0.035), 2.15));
  float mist = exp(-pow(d / max(thick * 0.82, 0.028), 2.45));
  float core = exp(-pow(d / max(thick * 0.32, 0.01), 2.55));
  float lum = (veil * 0.04 + mist * 0.26 + core * 0.62) * u_peak;

  float g =
    hash(gx) * 0.18
    + hash(gx * 1.85 + 11.0) * 0.18
    + hash(gx * 3.4 + 23.0) * 0.16
    + hash(gx * 6.1 + 41.0) * 0.16
    + hash(gx * 10.7 + 59.0) * 0.14
    + hash(gx * 17.3 + 73.0) * 0.10
    + hash(gx * 27.0 + 97.0) * 0.08;
  float speckle = step(0.52, hash(gx * 1.28 + 5.0));
  lum += (g - 0.5) * (0.18 + lum * 0.62);
  lum += speckle * lum * 0.18;
  lum += (hash(gx * 2.6 + 8.0) - 0.5) * veil * 0.1;
  lum = clamp(lum, 0.0, 1.0);

  return half4(lum, lum, lum, 1.0);
}
`;

function makeWaveEffect() {
  try {
    return Skia.RuntimeEffect.Make(WAVE_SKSL);
  } catch {
    return null;
  }
}

function WaveFallback({ width, height }: { width: number; height: number }) {
  const y = height * 0.32;
  const h = height * 0.38;
  return (
    <>
      <Fill color="#000000" />
      <Oval x={-width * 0.12} y={y} width={width * 1.24} height={h}>
        <LinearGradient
          start={vec(0, y + h * 0.5)}
          end={vec(width, y + h * 0.5)}
          colors={[
            `rgba(${FOG_PEAK_BYTE},${FOG_PEAK_BYTE},${FOG_PEAK_BYTE},0.18)`,
            `rgba(${FOG_PEAK_BYTE},${FOG_PEAK_BYTE},${FOG_PEAK_BYTE},0.78)`,
            `rgba(${FOG_PEAK_BYTE},${FOG_PEAK_BYTE},${FOG_PEAK_BYTE},0.22)`,
          ]}
          positions={[0, 0.48, 1]}
        />
        <BlurMask blur={28} style="normal" />
      </Oval>
      <Group blendMode="overlay" opacity={0.48}>
        <Fill>
          <FractalNoise freqX={2.4} freqY={2.4} octaves={3} seed={9} />
        </Fill>
      </Group>
    </>
  );
}

type Props = {
  /** 同意ゲートやフォーム着地など、表に出ないときの凍結 */
  paused?: boolean;
};

export default function AuthLandingAmoebaFieldNative({ paused = false }: Props) {
  const { width, height } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const appActive = useAppActiveNative();
  const effect = useMemo(() => makeWaveEffect(), []);
  const timeMs = useSharedValue(FROZEN_MS);

  const animate = !reduceMotion && appActive && !paused;

  const renderW = Math.max(1, Math.round(width * RENDER_SCALE));
  const renderH = Math.max(1, Math.round(height * RENDER_SCALE));
  const upscale = 1 / RENDER_SCALE;
  // RN の transform 原点は中心のため、拡大後に左上合わせする
  const originFixX = (renderW * (upscale - 1)) / 2;
  const originFixY = (renderH * (upscale - 1)) / 2;

  useEffect(() => {
    if (!animate) {
      timeMs.value = FROZEN_MS;
      return;
    }
    const startedAt = performance.now();
    timeMs.value = FROZEN_MS;
    const id = setInterval(() => {
      timeMs.value = FROZEN_MS + (performance.now() - startedAt);
    }, CLOCK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [animate, timeMs]);

  const uniforms = useDerivedValue(() => ({
    u_time: timeMs.value,
    u_res: [renderW, renderH],
    u_grain_res: [width, height],
    u_peak: FOG_PEAK,
  }));

  if (width <= 0 || height <= 0) {
    return <View pointerEvents="none" style={styles.root} />;
  }

  const canvasStyle = {
    width: renderW,
    height: renderH,
    transform: [
      { translateX: originFixX },
      { translateY: originFixY },
      { scale: upscale },
    ],
  } as const;

  // 非アクティブ / paused: 静的フレーム（interval なし）
  if (!animate) {
    return (
      <View pointerEvents="none" style={styles.root} collapsable={false}>
        <Canvas style={canvasStyle} pointerEvents="none">
          {effect ? (
            <Fill>
              <Shader
                source={effect}
                uniforms={{
                  u_time: FROZEN_MS,
                  u_res: [renderW, renderH],
                  u_grain_res: [width, height],
                  u_peak: FOG_PEAK,
                }}
              />
            </Fill>
          ) : (
            <WaveFallback width={renderW} height={renderH} />
          )}
        </Canvas>
      </View>
    );
  }

  return (
    <View pointerEvents="none" style={styles.root} collapsable={false}>
      <Canvas style={canvasStyle} pointerEvents="none">
        {effect ? (
          <Fill>
            <Shader source={effect} uniforms={uniforms} />
          </Fill>
        ) : (
          <WaveFallback width={renderW} height={renderH} />
        )}
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000000",
    overflow: "hidden",
    zIndex: 0,
  },
});
