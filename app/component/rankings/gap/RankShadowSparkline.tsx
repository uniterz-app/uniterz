"use client";

import { useMemo } from "react";
import type { MyRankProgressPoint } from "@/lib/rankings/myRankRankingProgress";
import { PROFILE_CHART_CYBER } from "@/lib/profile/profileOverviewChartCyberTheme";

type Props = {
  points: MyRankProgressPoint[];
  rankDelta: number;
  width?: number;
  height?: number;
};

export default function RankShadowSparkline({
  points,
  rankDelta,
  width = 88,
  height = 28,
}: Props) {
  const { path, stroke, glow } = useMemo(() => {
    if (points.length < 2) {
      return { path: "", stroke: PROFILE_CHART_CYBER.statNeutral, glow: "none" };
    }

    let minR = Infinity;
    let maxR = -Infinity;
    for (const p of points) {
      minR = Math.min(minR, p.rank);
      maxR = Math.max(maxR, p.rank);
    }
    const span = Math.max(1, maxR - minR);
    const padY = Math.max(2, span * 0.15);

    const coords = points.map((p, i) => {
      const x = (i / Math.max(1, points.length - 1)) * (width - 4) + 2;
      // 順位は小さいほど上（良い）— Ranking Progress と同じ
      const y =
        2 +
        ((maxR + padY - p.rank) / (span + padY * 2)) * (height - 4);
      return { x, y };
    });

    const path = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x},${c.y}`).join(" ");

    const stroke =
      rankDelta > 0
        ? PROFILE_CHART_CYBER.cyan
        : rankDelta < 0
          ? PROFILE_CHART_CYBER.magenta
          : PROFILE_CHART_CYBER.statNeutral;
    const glow =
      rankDelta > 0
        ? PROFILE_CHART_CYBER.cyanSoft
        : rankDelta < 0
          ? PROFILE_CHART_CYBER.magentaGlow
          : "rgba(0,245,255,0.2)";

    return { path, stroke, glow };
  }, [points, rankDelta, width, height]);

  if (!path) return null;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="shrink-0 overflow-visible"
      aria-hidden
    >
      <path
        d={path}
        fill="none"
        stroke={glow}
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.45}
      />
      <path
        d={path}
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
