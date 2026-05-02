/**
 * Web `DonutChart`（`app/component/predict/DonutChart.tsx`）および試合ページ `PredictToolTabContent` の Market ドーナツに寄せる。
 * セグメントは Path ではなく Circle + strokeDasharray（グラデ stroke が Path で壊れる端末があるため）。
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { AccessibilityInfo, Platform, StyleSheet, UIManager, View } from "react-native";
import { BlurView } from "expo-blur";
import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient as SvgLinearGradient,
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

type RGB = { r: number; g: number; b: number };

function parseCssColorToRgb(input: string): RGB | null {
  const s = input.trim();
  const rgba = s.match(
    /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*[\d.]+\s*)?\)/i
  );
  if (rgba) {
    let r = Number(rgba[1]);
    let g = Number(rgba[2]);
    let b = Number(rgba[3]);
    if (![r, g, b].every((n) => Number.isFinite(n))) return null;
    if (r <= 1 && g <= 1 && b <= 1 && r >= 0 && g >= 0 && b >= 0) {
      r = Math.round(r * 255);
      g = Math.round(g * 255);
      b = Math.round(b * 255);
    } else {
      r = Math.max(0, Math.min(255, Math.round(r)));
      g = Math.max(0, Math.min(255, Math.round(g)));
      b = Math.max(0, Math.min(255, Math.round(b)));
    }
    return { r, g, b };
  }
  const hex = s.replace(/^#/, "").trim();
  const expand3 = hex.length === 3 && /^[0-9a-fA-F]{3}$/.test(hex);
  const h6 = expand3 ? hex.split("").map((c) => c + c).join("") : hex;
  if (h6.length === 6 && /^[0-9a-fA-F]{6}$/.test(h6)) {
    return {
      r: parseInt(h6.slice(0, 2), 16),
      g: parseInt(h6.slice(2, 4), 16),
      b: parseInt(h6.slice(4, 6), 16),
    };
  }
  if (hex.length === 8 && /^[0-9a-fA-F]{8}$/.test(hex)) {
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    };
  }
  return null;
}

function mixRgbToward(from: RGB, to: RGB, t: number): RGB {
  return {
    r: Math.round(from.r + (to.r - from.r) * t),
    g: Math.round(from.g + (to.g - from.g) * t),
    b: Math.round(from.b + (to.b - from.b) * t),
  };
}

function rgbToHex(c: RGB): string {
  return `#${[c.r, c.g, c.b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}

/** Web `DonutChart.buildSegmentGradientStops` と同趣旨（対角線形グラデ用） */
function buildSegmentGradientStops(baseColor: string) {
  const baseRgb = parseCssColorToRgb(baseColor) ?? { r: 100, g: 116, b: 139 };
  const white: RGB = { r: 255, g: 255, b: 255 };
  const black: RGB = { r: 0, g: 0, b: 0 };
  const light = mixRgbToward(white, baseRgb, 0.75);
  const dark = mixRgbToward(black, baseRgb, 0.55);
  return {
    light: rgbToHex(light),
    base: rgbToHex(baseRgb),
    dark: rgbToHex(dark),
  };
}

const hasNativeBlurView =
  Platform.OS !== "web" &&
  Boolean(
    UIManager.getViewManagerConfig?.("ExpoBlurView") ??
      UIManager.getViewManagerConfig?.("ViewManagerAdapter_ExpoBlur_ExpoBlurView")
  );

/** 未確定時のチャート全体の不透明度 */
const UNCONFIRMED_CHART_OPACITY = 0.38;

/** Web のセグメント drop-shadow に近い外側の淡い発光（親 View の shadow） */
const CHART_SHADOW =
  Platform.OS === "ios"
    ? {
        shadowColor: "#ffffff",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.14,
        shadowRadius: 14,
      }
    : Platform.OS === "android"
      ? { elevation: 10 }
      : {};

type Props = {
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
  rotationDeg?: number;
  drawDelayMs?: number;
  marketRatesConfirmed?: boolean;
};

export default function ResultMarketDonutSvg({
  segments,
  size = 132,
  thickness = 42,
  rotationDeg = 0,
  drawDelayMs = 0,
  marketRatesConfirmed = true,
}: Props) {
  const gidRef = useRef(`d${Math.random().toString(36).slice(2, 12)}`);
  const gid = gidRef.current;
  const radius = size / 2;
  const R = radius - thickness / 2;
  const circ = 2 * Math.PI * R;
  /** ドーナツ内周のシミュレーション（穴まわりをわずかに暗く） */
  const innerHoleR = Math.max(0, R - thickness / 2);

  const [mounted, setMounted] = useState(false);

  const segmentsKey = useMemo(
    () => segments.map((s) => `${s.value}-${s.color}`).join("|"),
    [segments]
  );

  const hasArcData = useMemo(
    () => segments.some((s) => clamp01(s.value) > 1e-6),
    [segments]
  );

  const arcRows = useMemo(() => {
    let accPct = 0;
    const rows: Array<{
      key: string;
      gradId: string;
      segArcLen: number;
      accPctBefore: number;
    }> = [];
    segments.forEach((seg, i) => {
      const ratio = clamp01(seg.value);
      if (ratio <= 1e-6) return;
      const segArcLen = circ * ratio;
      rows.push({
        key: `seg-${gid}-${i}`,
        gradId: `seg-grad-${gid}-${i}`,
        segArcLen,
        accPctBefore: accPct,
      });
      accPct += ratio;
    });
    return rows;
  }, [segments, circ, gid]);

  useEffect(() => {
    let cancelled = false;
    let t: ReturnType<typeof setTimeout> | undefined;
    const skipDashDelay = hasArcData && marketRatesConfirmed;

    void AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (cancelled) return;
      if (reduceMotion || skipDashDelay) {
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
  }, [drawDelayMs, segmentsKey, hasArcData, marketRatesConfirmed]);

  const chartOpacity = marketRatesConfirmed ? 1 : UNCONFIRMED_CHART_OPACITY;

  return (
    <View
      style={[
        styles.box,
        { width: size, height: size, opacity: chartOpacity },
        hasArcData ? CHART_SHADOW : null,
      ]}
    >
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
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: "rgba(24,32,48,0.42)",
            },
          ]}
        />
      ) : null}
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          {segments.map((seg, i) => {
            const ratio = clamp01(seg.value);
            if (ratio <= 1e-6) return null;
            const { light, base, dark } = buildSegmentGradientStops(seg.color);
            const gradId = `seg-grad-${gid}-${i}`;
            return (
              <SvgLinearGradient
                key={gradId}
                id={gradId}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <Stop offset="0%" stopColor={light} stopOpacity={0.95} />
                <Stop offset="55%" stopColor={base} stopOpacity={0.95} />
                <Stop offset="100%" stopColor={dark} stopOpacity={0.95} />
              </SvgLinearGradient>
            );
          })}
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

        {hasArcData ? (
          <G transform={`rotate(${-90 + rotationDeg} ${radius} ${radius})`}>
            {arcRows.map((a) => {
              const drawn = mounted ? a.segArcLen : 0;
              const dash = `${drawn} ${circ}`;
              const offset = -circ * a.accPctBefore;
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
                  strokeDashoffset={offset}
                />
              );
            })}
          </G>
        ) : null}

        {/* radial url は端末によって白塗りになるため、Web のハイライトは単色の薄いストロークで近似 */}
        {hasArcData ? (
          <Circle
            cx={radius}
            cy={radius}
            r={R}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={thickness}
          />
        ) : null}

        {/* 穴の内側をわずかに落として立体感 */}
        {hasArcData && innerHoleR > 0 ? (
          <Circle
            cx={radius}
            cy={radius}
            r={innerHoleR}
            fill="none"
            stroke="rgba(0,0,0,0.28)"
            strokeWidth={1.5}
          />
        ) : null}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { position: "relative", overflow: "visible", borderRadius: 9999 },
  donutGlassBlur: {
    position: "absolute",
    left: 0,
    top: 0,
    overflow: "hidden",
  },
});
