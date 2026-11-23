/**
 * お知らせシートの背景。
 * うねりの係数は ShaderGradient のまま、色は夜の紺にシアン。
 * Web の three.js はそのまま動かないので Skia でカード全面に描く。
 */
import { useEffect, useMemo } from "react";
import { Rect, Shader, Skia } from "@shopify/react-native-skia";
import {
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
} from "react-native-reanimated";
import { useAppActiveNative } from "../hooks/useAppActiveNative";

const CLOCK_INTERVAL_MS = Math.round(1000 / 24);
/** 展開で Canvas が作り直されても時刻を引き継ぐ */
let shaderClockSec = 0;

/** 夜の紺 / シアン / インディゴ。橙は使わない */
const COLOR_1 = [0x3e / 255, 0xe0 / 255, 0xea / 255];
const COLOR_2 = [0x07 / 255, 0x10 / 255, 0x18 / 255];
const COLOR_3 = [0x3d / 255, 0x4f / 255, 0x8a / 255];

const SKSL = `
uniform float u_time;
uniform float2 u_res;
uniform float u_speed;
uniform float u_strength;
uniform float u_density;
uniform float u_frequency;
uniform float u_amplitude;
uniform float u_brightness;
uniform float3 u_c1;
uniform float3 u_c2;
uniform float3 u_c3;

float hash(float2 p) {
  return fract(sin(dot(p, float2(127.1, 311.7))) * 43758.5453);
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

half4 main(float2 xy) {
  float2 uv = (xy / u_res) * 2.0 - 1.0;
  uv.x *= u_res.x / max(u_res.y, 1.0);
  float t = u_time * u_speed;

  float cy = cos(1.2217);
  float sy = sin(1.2217);
  float cz = cos(2.2689);
  float sz = sin(2.2689);
  float3 p = float3(uv.x, uv.y, 0.72);
  p = float3(p.x * cz - p.y * sz, p.x * sz + p.y * cz, p.z);
  p = float3(p.x * cy + p.z * sy, p.y, -p.x * sy + p.z * cy);

  float n = vnoise(p.xy * u_density * 4.0 + t);
  float wobble = sin(p.y * u_frequency + t) * (u_amplitude * 0.08);
  float3 pos = p + float3(0.0, wobble, n * u_strength);
  float glow = smoothstep(0.25, 0.92, n);
  float3 col = mix(u_c2, u_c1, glow * 0.72);
  col = mix(col, u_c3, smoothstep(-0.2, 1.05, pos.y) * 0.55);
  col *= u_brightness;
  // 文字が乗る上〜中央は紺に戻す。光は下端に残す。
  float veil = 1.0 - smoothstep(-0.65, 0.55, uv.y);
  col = mix(col, u_c2, veil * 0.78);
  float grain = hash(xy + float2(t * 40.0, t * 17.0)) - 0.5;
  col += grain * 0.04;
  return half4(half3(col), 1.0);
}
`;

type Props = {
  width: number;
  height: number;
  active: boolean;
};

export default function WhatsNewShaderFillNative({ width, height, active }: Props) {
  const reduceMotion = useReducedMotion();
  const appActive = useAppActiveNative();
  const effect = useMemo(() => Skia.RuntimeEffect.Make(SKSL), []);
  const timeSec = useSharedValue(shaderClockSec);
  const animate = active && appActive && !reduceMotion;

  useEffect(() => {
    if (!animate) return;
    const startedAt = performance.now() - shaderClockSec * 1000;
    const id = setInterval(() => {
      shaderClockSec = (performance.now() - startedAt) / 1000;
      timeSec.value = shaderClockSec;
    }, CLOCK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [animate, timeSec]);

  const uniforms = useDerivedValue(() => ({
    u_time: timeSec.value,
    u_res: [width, height],
    u_speed: 0.3,
    u_strength: 0.3,
    u_density: 0.8,
    u_frequency: 5.5,
    u_amplitude: 3.2,
    u_brightness: 0.8,
    u_c1: COLOR_1,
    u_c2: COLOR_2,
    u_c3: COLOR_3,
  }));

  if (!effect || width <= 0 || height <= 0) {
    return <Rect x={0} y={0} width={width} height={height} color="#1a2433" />;
  }

  return (
    <Rect x={0} y={0} width={width} height={height}>
      <Shader
        source={effect}
        uniforms={
          animate
            ? uniforms
            : {
                u_time: 0,
                u_res: [width, height],
                u_speed: 0.3,
                u_strength: 0.3,
                u_density: 0.8,
                u_frequency: 5.5,
                u_amplitude: 3.2,
                u_brightness: 0.8,
                u_c1: COLOR_1,
                u_c2: COLOR_2,
                u_c3: COLOR_3,
              }
        }
      />
    </Rect>
  );
}
