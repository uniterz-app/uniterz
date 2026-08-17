/**
 * Web `WebFuturisticBackground`（Eclipse 本番 / Data Stream 互換）と同一構図の Native 版。
 */
import { memo } from "react";
import { StyleSheet, View } from "react-native";
import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient as SvgLinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";
import {
  FUTURISTIC_BG_PREVIEW_CARD,
  FUTURISTIC_BG_THEME as T,
  type FuturisticBgVariantId,
} from "../../../../../../lib/profile/futuristicBgTheme";

const VW = FUTURISTIC_BG_PREVIEW_CARD.width;
const VH = FUTURISTIC_BG_PREVIEW_CARD.height;

function arcPath(cx: number, cy: number, r: number, a0: number, a1: number) {
  const x0 = cx + r * Math.cos(a0);
  const y0 = cy + r * Math.sin(a0);
  const x1 = cx + r * Math.cos(a1);
  const y1 = cy + r * Math.sin(a1);
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
}

function CornerHud() {
  return (
    <G opacity={0.28} strokeWidth={0.8} fill="none">
      <Path d="M 10 10 H 26 M 10 10 V 26" stroke={T.cyan} />
      <Path d={`M ${VW - 10} 10 H ${VW - 26} M ${VW - 10} 10 V 26`} stroke={T.cyan} />
      <Path d={`M 10 ${VH - 10} H 26 M 10 ${VH - 10} V ${VH - 26}`} stroke={T.purple} />
      <Path
        d={`M ${VW - 10} ${VH - 10} H ${VW - 26} M ${VW - 10} ${VH - 10} V ${VH - 26}`}
        stroke={T.purple}
      />
    </G>
  );
}

function EclipseArt() {
  const cx = VW * 1.08;
  const cy = VH * 1.05;
  const r = Math.min(VW, VH) * 0.92;
  const stars: [number, number][] = [
    [0.12, 0.1],
    [0.28, 0.06],
    [0.72, 0.08],
    [0.88, 0.18],
    [0.08, 0.88],
  ];

  return (
    <>
      <Defs>
        <RadialGradient id="eclBody" cx="38%" cy="35%" r="65%">
          <Stop offset="0%" stopColor="#0a1220" stopOpacity={0.55} />
          <Stop offset="100%" stopColor={T.background} stopOpacity={0.95} />
        </RadialGradient>
      </Defs>
      {stars.map(([x, y], i) => (
        <Circle
          key={i}
          cx={VW * x!}
          cy={VH * y!}
          r={0.9}
          fill={T.white.soft}
          opacity={0.35}
        />
      ))}
      <Path
        d={arcPath(VW * 0.35, VH * 0.55, Math.min(VW, VH) * 0.85, -2.6, -0.4)}
        fill="none"
        stroke={T.purple}
        strokeWidth={0.6}
        opacity={0.12}
      />
      <Circle cx={cx} cy={cy} r={r} fill="url(#eclBody)" />
      <Path
        d={arcPath(cx, cy, r, -Math.PI * 0.98, -Math.PI * 0.22)}
        fill="none"
        stroke={T.cyan}
        strokeWidth={2}
        opacity={0.55}
        strokeLinecap="round"
      />
      <Path
        d={arcPath(cx, cy, r + 2.5, -Math.PI * 0.94, -Math.PI * 0.26)}
        fill="none"
        stroke={T.purple}
        strokeWidth={1.1}
        opacity={0.35}
        strokeLinecap="round"
      />
      <CornerHud />
    </>
  );
}

function buildDataStreamBands() {
  const colors = [T.purple, T.magenta, T.cyan, T.blue];
  return Array.from({ length: 6 }, (_, i) => {
    const t = i / 5;
    const baseY = VH * (0.46 + t * 0.38);
    const amp = VH * 0.025;
    const freq = 1.1 + (i % 3) * 0.35;
    const phase = i * 0.17;
    let d = "";
    for (let s = 0; s <= 48; s++) {
      const x = (s / 48) * VW;
      const u = x / VW;
      const y =
        baseY + Math.sin((u * Math.PI * 2 * freq + phase) * Math.PI * 2) * amp;
      d += s === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
    }
    return {
      d,
      color: colors[i % 4]!,
      opacity: 0.22 + t * 0.35,
      stroke: 0.7 + (i % 3) * 0.25,
    };
  });
}

const DATA_STREAM_BANDS = buildDataStreamBands();

function DataStreamArt() {
  return (
    <>
      <Defs>
        <SvgLinearGradient id="dsVeil" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={T.background} stopOpacity={0.55} />
          <Stop offset="1" stopColor={T.background} stopOpacity={0} />
        </SvgLinearGradient>
      </Defs>
      {DATA_STREAM_BANDS.map((b, i) => (
        <Path
          key={`g${i}`}
          d={b.d}
          fill="none"
          stroke={b.color}
          strokeWidth={b.stroke * 5}
          opacity={b.opacity * 0.22}
          strokeLinecap="round"
        />
      ))}
      {DATA_STREAM_BANDS.map((b, i) => (
        <Path
          key={`m${i}`}
          d={b.d}
          fill="none"
          stroke={b.color}
          strokeWidth={b.stroke}
          opacity={b.opacity}
          strokeLinecap="round"
        />
      ))}
      <Rect x={0} y={0} width={VW} height={VH * 0.42} fill="url(#dsVeil)" />
    </>
  );
}

function WebParityFuturisticBackgroundNative({
  id,
  width,
  height,
}: {
  id: FuturisticBgVariantId;
  width: number;
  height: number;
}) {
  if (width <= 0 || height <= 0) return null;

  return (
    <View style={[styles.root, { width, height }]} pointerEvents="none">
      <View
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: T.background,
          },
        ]}
      />
      <View
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: T.navy,
            opacity: 0.55,
          },
        ]}
      />
      <Svg
        width={width}
        height={height}
        viewBox={`0 0 ${VW} ${VH}`}
        preserveAspectRatio="none"
        style={StyleSheet.absoluteFillObject}
      >
        {id === "data-stream" ? <DataStreamArt /> : <EclipseArt />}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    overflow: "hidden",
  },
});

export default memo(WebParityFuturisticBackgroundNative);
