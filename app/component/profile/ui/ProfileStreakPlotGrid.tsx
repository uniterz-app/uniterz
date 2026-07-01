"use client";

import { PROFILE_CHART_CYBER } from "@/lib/profile/profileOverviewChartCyberTheme";

function valueToPlotY(value: number, plotH: number, maxAbs: number): number {
  const half = plotH / 2;
  return half * (1 - value / maxAbs);
}

type Props = {
  plotWidth: number;
  plotHeight: number;
  ticks: number[];
  maxAbs: number;
  columnCount: number;
  colW?: number;
  colGap?: number;
  evenColumns?: boolean;
  className?: string;
};

/** Last20 — Y 目盛・各列に揃えた方眼 */
export default function ProfileStreakPlotGrid({
  plotWidth,
  plotHeight,
  ticks,
  maxAbs,
  columnCount,
  colW = 12,
  colGap = 2,
  evenColumns = false,
  className = "",
}: Props) {
  if (columnCount <= 0 || plotWidth <= 0 || plotHeight <= 0) return null;

  const gridStroke = PROFILE_CHART_CYBER.cyanGridStrong;
  const zeroStroke = PROFILE_CHART_CYBER.cyan;

  const horizontalLines = ticks.map((tick) => ({
    y: valueToPlotY(tick, plotHeight, maxAbs),
    isZero: tick === 0,
  }));

  const verticalXs: number[] = [];
  if (evenColumns) {
    for (let i = 0; i <= columnCount; i++) {
      verticalXs.push((i / columnCount) * plotWidth);
    }
  } else {
    const chartTotalW = columnCount * colW + Math.max(0, columnCount - 1) * colGap;
    for (let i = 0; i < columnCount; i++) {
      verticalXs.push(i * (colW + colGap));
    }
    verticalXs.push(chartTotalW);
  }

  return (
    <svg
      className={`pointer-events-none absolute inset-0 z-1 h-full w-full ${className}`}
      viewBox={`0 0 ${plotWidth} ${plotHeight}`}
      preserveAspectRatio="none"
      aria-hidden
    >
      {horizontalLines.map(({ y, isZero }) => (
        <line
          key={`h-${y}`}
          x1={0}
          y1={y}
          x2={plotWidth}
          y2={y}
          stroke={isZero ? zeroStroke : gridStroke}
          strokeWidth={isZero ? 1.5 : 1}
          opacity={isZero ? 0.72 : 0.5}
          vectorEffect="non-scaling-stroke"
        />
      ))}
      {verticalXs.map((x, idx) => (
        <line
          key={`v-${idx}-${x}`}
          x1={x}
          y1={0}
          x2={x}
          y2={plotHeight}
          stroke={gridStroke}
          strokeWidth={1}
          opacity={0.42}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}
