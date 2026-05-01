/**
 * Web `DonutChart`（`app/component/predict/DonutChart.tsx`）相当のドーナツ。`react-native-svg` 実装。
 */
import { useEffect, useId, useMemo, useState } from "react";
import { AccessibilityInfo, Platform, StyleSheet, UIManager, View } from "react-native";
import { BlurView } from "expo-blur";
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  Path,
  RadialGradient as SvgRadialGradient,
  Stop,
} from "react-native-svg";

export type DonutSegment = {
  label: string;
  value: number;
  color: string;
};

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function hexToRgb(hex: string) {
  const h = hex.replace("#", "").trim();
  const v = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(v, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function mixHex(a: string, b: string, t: number) {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  const r = Math.round(A.r + (B.r - A.r) * t);
  const g = Math.round(A.g + (B.g - A.g) * t);
  const bl = Math.round(A.b + (B.b - A.b) * t);
  return `rgb(${r},${g},${bl})`;
}

function buildSegmentGradientStops(baseHex: string) {
  const light = mixHex("#ffffff", baseHex, 0.75);
  const dark = mixHex("#000000", baseHex, 0.55);
  return { light, base: baseHex, dark };
}

const FULL_RING_THRESHOLD_DEG = 359.5;

const hasNativeBlurView =
  Platform.OS !== "web" &&
  Boolean(
    UIManager.getViewManagerConfig?.("ExpoBlurView") ??
      UIManager.getViewManagerConfig?.("ViewManagerAdapter_ExpoBlur_ExpoBlurView")
  );

type Props = {
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
  rotationDeg?: number;
  drawDelayMs?: number;
};

export default function ResultMarketDonutSvg({
  segments,
  size = 132,
  thickness = 42,
  rotationDeg = 0,
  drawDelayMs = 0,
}: Props) {
  const gid = useId().replace(/:/g, "");
  const radius = size / 2;
  const R = radius - thickness / 2;
  const circ = 2 * Math.PI * R;

  const [mounted, setMounted] = useState(false);

  const segmentsKey = useMemo(
    () => segments.map((s) => `${s.value}-${s.color}`).join("|"),
    [segments]
  );

  /** Web `DonutChart`：`prefers-reduced-motion` なら即フル表示、それ以外は dash を遅延で伸ばす */
  useEffect(() => {
    let cancelled = false;
    let t: ReturnType<typeof setTimeout> | undefined;

    void AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (cancelled) return;
      if (reduceMotion) {
        setMounted(true);
        return;
      }
      setMounted(false);
      t = setTimeout(() => {
        if (!cancelled) setMounted(true);
      }, 10 + Math.max(0, drawDelayMs));
    });

    return () => {
      cancelled = true;
      if (t) clearTimeout(t);
    };
  }, [drawDelayMs, segmentsKey]);

  const arcs = useMemo(() => {
    const polarToCartesian = (cx: number, cy: number, r: number, angle: number) => {
      const a = (angle - 90 + rotationDeg) * (Math.PI / 180);
      return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
    };
    const describeArc = (cx: number, cy: number, r: number, start: number, end: number) => {
      const s = polarToCartesian(cx, cy, r, end);
      const e = polarToCartesian(cx, cy, r, start);
      const largeArcFlag = end - start <= 180 ? "0" : "1";
      return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${e.x} ${e.y}`;
    };

    let acc = 0;
    const out: Array<{
      key: string;
      type: "circle" | "path";
      d?: string;
      ratio: number;
      gradId: string;
    }> = [];
    segments.forEach((seg, i) => {
      const ratio = clamp01(seg.value);
      const deg = ratio * 360;
      const start = acc;
      const end = acc + deg;
      acc = end;
      if (ratio <= 0) return;
      const gradId = `seg-${gid}-${i}`;
      if (deg >= FULL_RING_THRESHOLD_DEG) {
        out.push({ key: `c-${i}`, type: "circle", ratio, gradId });
      } else {
        out.push({
          key: `p-${i}`,
          type: "path",
          d: describeArc(radius, radius, R, start, end),
          ratio,
          gradId,
        });
      }
    });
    return out;
  }, [segments, radius, R, rotationDeg, gid]);

  const hasArcData = useMemo(
    () => segments.some((s) => clamp01(s.value) > 1e-6),
    [segments]
  );

  return (
    <View style={[styles.box, { width: size, height: size }]}>
      {/* データなし時：中央の穴から背後が透けるようブラー（ガラス感） */}
      {!hasArcData && hasNativeBlurView ? (
        Platform.OS === "ios" ? (
          <BlurView
            pointerEvents="none"
            intensity={22}
            tint="dark"
            style={[styles.donutGlassBlur, { width: size, height: size, borderRadius: size / 2 }]}
          />
        ) : (
          <BlurView
            pointerEvents="none"
            intensity={18}
            tint="dark"
            experimentalBlurMethod="dimezisBlurView"
            style={[styles.donutGlassBlur, { width: size, height: size, borderRadius: size / 2 }]}
          />
        )
      ) : !hasArcData ? (
        <View
          pointerEvents="none"
          style={[
            styles.donutGlassBlur,
            { width: size, height: size, borderRadius: size / 2, backgroundColor: "rgba(24,32,48,0.42)" },
          ]}
        />
      ) : null}
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          {segments.map((seg, i) => {
            const { light, base, dark } = buildSegmentGradientStops(seg.color);
            return (
              <SvgLinearGradient key={`g-${i}`} id={`seg-${gid}-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={light} stopOpacity={0.95} />
                <Stop offset="55%" stopColor={base} stopOpacity={0.95} />
                <Stop offset="100%" stopColor={dark} stopOpacity={0.95} />
              </SvgLinearGradient>
            );
          })}
          {/* Web `DonutChart` の `radialGradient#donut-highlight` と同一パラメータ */}
          <SvgRadialGradient id={`donut-highlight-${gid}`} cx="35%" cy="25%" r="75%">
            <Stop offset="0%" stopColor="rgba(255,255,255,0.22)" />
            <Stop offset="35%" stopColor="rgba(255,255,255,0.10)" />
            <Stop offset="70%" stopColor="rgba(255,255,255,0.03)" />
            <Stop offset="100%" stopColor="rgba(255,255,255,0.00)" />
          </SvgRadialGradient>
          {/* データなし時のトラック：半透明グラデで下のブラーが透けるガラス風 */}
          <SvgLinearGradient id={`donut-glass-track-${gid}`} x1="18%" y1="10%" x2="82%" y2="92%">
            <Stop offset="0%" stopColor="rgba(248,250,252,0.42)" />
            <Stop offset="38%" stopColor="rgba(226,232,240,0.22)" />
            <Stop offset="68%" stopColor="rgba(148,163,184,0.2)" />
            <Stop offset="100%" stopColor="rgba(100,116,139,0.26)" />
          </SvgLinearGradient>
        </Defs>

        <Circle
          cx={radius}
          cy={radius}
          r={R}
          fill="none"
          stroke={hasArcData ? "rgba(255,255,255,0.12)" : `url(#donut-glass-track-${gid})`}
          strokeWidth={thickness}
        />

        {arcs.map((a) => {
          const dash = mounted ? `${a.ratio * circ} ${circ}` : `0 ${circ}`;
          if (a.type === "circle") {
            return (
              <Circle
                key={a.key}
                cx={radius}
                cy={radius}
                r={R}
                fill="none"
                stroke={`url(#${a.gradId})`}
                strokeWidth={thickness}
                strokeLinecap="butt"
                strokeDasharray={dash}
                transform={`rotate(${-90 + rotationDeg} ${radius} ${radius})`}
              />
            );
          }
          return (
            <Path
              key={a.key}
              d={a.d!}
              fill="none"
              stroke={`url(#${a.gradId})`}
              strokeWidth={thickness}
              strokeLinecap="butt"
              strokeDasharray={dash}
            />
          );
        })}

        {/* ガラス風ハイライト：Web 同様、データの有無に関わらず常に重ねる */}
        <Circle
          cx={radius}
          cy={radius}
          r={R}
          fill="none"
          stroke={`url(#donut-highlight-${gid})`}
          strokeWidth={thickness}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { position: "relative", overflow: "hidden", borderRadius: 9999 },
  donutGlassBlur: {
    position: "absolute",
    left: 0,
    top: 0,
    overflow: "hidden",
  },
});
