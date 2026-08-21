/**
 * Get Started 背景 — 黒地に、粒子の乗った一本のうねる帯。
 * 金銀枠とは別バリアント。塊（メタボール）は使わない。
 */
import { useMemo } from "react";
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
  useClock,
  vec,
} from "@shopify/react-native-skia";
import {
  useDerivedValue,
  useReducedMotion,
} from "react-native-reanimated";
import { AUTH_LANDING } from "./authLandingPalette";

const FROZEN_MS = 22000;
const FOG_PEAK = AUTH_LANDING.fogPeak;
const FOG_PEAK_BYTE = Math.round(FOG_PEAK * 255);

const WAVE_SKSL = `
uniform float u_time;
uniform float2 u_res;
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
  float a = 0.5;
  s += a * vnoise(p);
  p *= 2.02;
  a *= 0.5;
  s += a * vnoise(p);
  p *= 2.03;
  a *= 0.5;
  s += a * vnoise(p);
  return s;
}

half4 main(float2 xy) {
  float2 uv = xy / u_res;
  float t = u_time * 0.001;

  float n1 = fbm(uv * float2(1.35, 2.4) + float2(t * 0.042, t * 0.033));
  float n2 = fbm(uv * float2(1.7, 2.8) + float2(4.2, 1.6) + float2(-t * 0.036, t * 0.047));
  float2 wuv = uv + float2((n1 - 0.5) * 0.07, (n2 - 0.5) * 0.16);

  float phase = t * 0.13;
  float spine = 0.47
    + 0.18 * sin(wuv.x * 2.85 + phase)
    + 0.06 * sin(wuv.x * 5.2 - phase * 0.65);
  spine += (fbm(float2(wuv.x * 2.8, t * 0.07 + 2.4)) - 0.5) * 0.08;

  float d = abs(wuv.y - spine);
  float thick = 0.12
    + 0.05 * sin(wuv.x * 3.1 + phase * 0.4)
    + 0.04 * fbm(float2(wuv.x * 2.2 + t * 0.048, 8.0));

  float veil = exp(-pow(d / max(thick * 1.55, 0.04), 1.55));
  float mist = exp(-pow(d / max(thick, 0.03), 2.05));
  float core = exp(-pow(d / max(thick * 0.40, 0.012), 2.35));
  float lum = (veil * 0.14 + mist * 0.42 + core * 0.52) * u_peak;

  float g =
    hash(xy) * 0.18
    + hash(xy * 1.85 + 11.0) * 0.18
    + hash(xy * 3.4 + 23.0) * 0.16
    + hash(xy * 6.1 + 41.0) * 0.16
    + hash(xy * 10.7 + 59.0) * 0.14
    + hash(xy * 17.3 + 73.0) * 0.10
    + hash(xy * 27.0 + 97.0) * 0.08;
  float speckle = step(0.52, hash(xy * 1.28 + 5.0));
  lum += (g - 0.5) * (0.24 + lum * 0.72);
  lum += speckle * lum * 0.22;
  lum += (hash(xy * 2.6 + 8.0) - 0.5) * veil * 0.28;
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
          <FractalNoise freqX={2.4} freqY={2.4} octaves={5} seed={9} />
        </Fill>
      </Group>
    </>
  );
}

export default function AuthLandingAmoebaFieldNative() {
  const { width, height } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const clock = useClock();
  const effect = useMemo(() => makeWaveEffect(), []);
  const uniforms = useDerivedValue(() => ({
    u_time: reduceMotion ? FROZEN_MS : clock.value,
    u_res: [width, height],
    u_peak: FOG_PEAK,
  }));

  if (width <= 0 || height <= 0) {
    return <View pointerEvents="none" style={styles.root} />;
  }

  return (
    <View pointerEvents="none" style={styles.root} collapsable={false}>
      <Canvas style={{ width, height }} pointerEvents="none">
        {effect ? (
          <Fill>
            <Shader source={effect} uniforms={uniforms} />
          </Fill>
        ) : (
          <WaveFallback width={width} height={height} />
        )}
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000000",
    zIndex: 0,
  },
});
