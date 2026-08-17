/**
 * Web `MonthlyReportView` 能力チャート（Recharts Radar）相当。
 * 5軸・0–100 パーセンタイル、多角形グリッド + cyan 塗り。
 */
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, G, Line, Polygon, Text as SvgText } from "react-native-svg";
import type { MonthlyReportRadar, MonthlyReportRadarAxisKey } from "../../../../../../lib/reports/monthlyReportTypes";

export const MONTHLY_RADAR_ORDER: MonthlyReportRadarAxisKey[] = [
  "win",
  "scorer",
  "upset",
  "activity",
  "consistency",
];

const RADAR_ACCENT = "#22d3ee";
const GRID = "rgba(148,163,184,0.28)";

type Props = {
  radar: MonthlyReportRadar;
  labels: Record<MonthlyReportRadarAxisKey, string>;
  size?: number;
};

function clamp100(v: unknown): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

function pointAt(
  cx: number,
  cy: number,
  radius: number,
  index: number,
  total: number
): { x: number; y: number } {
  const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  };
}

function polygonPoints(
  cx: number,
  cy: number,
  radius: number,
  total: number
): string {
  return Array.from({ length: total }, (_, i) => {
    const p = pointAt(cx, cy, radius, i, total);
    return `${p.x},${p.y}`;
  }).join(" ");
}

export default function MonthlyReportRadarChartNative({
  radar,
  labels,
  size = 280,
}: Props) {
  const n = MONTHLY_RADAR_ORDER.length;
  const cx = size / 2;
  const cy = size * 0.52;
  const outerR = size * 0.32;
  const labelR = outerR + size * 0.11;

  const dataPoints = useMemo(() => {
    return MONTHLY_RADAR_ORDER.map((key, i) => {
      const v = clamp100(radar[key]);
      const p = pointAt(cx, cy, (v / 100) * outerR, i, n);
      const labelPt = pointAt(cx, cy, labelR, i, n);
      return { key, value: v, x: p.x, y: p.y, lx: labelPt.x, ly: labelPt.y };
    });
  }, [radar, cx, cy, outerR, labelR, n]);

  const dataPolygon = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {[0.25, 0.5, 0.75, 1].map((t) => (
          <Polygon
            key={t}
            points={polygonPoints(cx, cy, outerR * t, n)}
            stroke={GRID}
            strokeWidth={1}
            strokeDasharray="1 5"
            fill="none"
          />
        ))}
        {MONTHLY_RADAR_ORDER.map((key, i) => {
          const tip = pointAt(cx, cy, outerR, i, n);
          return (
            <Line
              key={`spoke-${key}`}
              x1={cx}
              y1={cy}
              x2={tip.x}
              y2={tip.y}
              stroke={GRID}
              strokeWidth={1}
              strokeDasharray="1 5"
            />
          );
        })}
        <Polygon
          points={dataPolygon}
          fill={RADAR_ACCENT}
          fillOpacity={0.16}
          stroke={RADAR_ACCENT}
          strokeWidth={2.5}
        />
        {dataPoints.map((p) => (
          <Circle
            key={`dot-${p.key}`}
            cx={p.x}
            cy={p.y}
            r={3.5}
            fill="#f8fafc"
            stroke={RADAR_ACCENT}
            strokeWidth={1.5}
          />
        ))}
        <G>
          {dataPoints.map((p) => (
            <SvgText
              key={`label-${p.key}`}
              x={p.lx}
              y={p.ly}
              fill="rgba(224,242,254,0.92)"
              fontSize={9}
              fontWeight="800"
              letterSpacing={0.6}
              textAnchor="middle"
              alignmentBaseline="central"
            >
              {labels[p.key]}
            </SvgText>
          ))}
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: "center",
  },
});

export const MONTHLY_RADAR_ACCENT = RADAR_ACCENT;
export const MONTHLY_RADAR_STRENGTH = "#fb923c";
export const MONTHLY_RADAR_MUTED = "rgba(255,255,255,0.92)";
