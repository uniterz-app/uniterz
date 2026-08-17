"use client";

/**
 * Native `ResultDetailScoreDonutNative` 相当 — 得点内訳ドーナツ（SVG）。
 */
import { matchScoreClass, nameOxanium } from "@/lib/fonts";

export type ScoreDonutSegment = {
  value: number;
  color: string;
};

type Props = {
  segments: ScoreDonutSegment[];
  total: number;
  totalLabel: string;
  size?: number;
  thickness?: number;
  gapDeg?: number;
};

function polar(cx: number, cy: number, r: number, deg: number) {
  const a = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function arcPath(
  cx: number,
  cy: number,
  r: number,
  start: number,
  end: number
) {
  if (end - start >= 359.99) {
    return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r}`;
  }
  const s = polar(cx, cy, r, end);
  const e = polar(cx, cy, r, start);
  const large = end - start > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 0 ${e.x} ${e.y}`;
}

export default function ResultDetailScoreDonut({
  segments,
  total,
  totalLabel,
  size = 116,
  thickness = 16,
  gapDeg = 2.2,
}: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - thickness) / 2;
  const sum = segments.reduce((a, s) => a + Math.max(0, s.value), 0);
  const active = segments.filter((s) => s.value > 1e-6);
  let cursor = 0;

  const arcs = active.map((seg) => {
    const sweep = sum > 0 ? (seg.value / sum) * 360 : 0;
    const gap = active.length > 1 ? gapDeg : 0;
    const start = cursor + gap / 2;
    const end = cursor + sweep - gap / 2;
    cursor += sweep;
    return {
      color: seg.color,
      d: arcPath(cx, cy, r, start, Math.max(start + 0.5, end)),
    };
  });

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {arcs.map((a, i) => (
          <path
            key={i}
            d={a.d}
            fill="none"
            stroke={a.color}
            strokeWidth={thickness}
            strokeLinecap="butt"
          />
        ))}
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-0.5">
        <span
          className={`${matchScoreClass} text-[22px] font-black leading-[26px] tracking-tight text-slate-50 tabular-nums`}
        >
          {total.toFixed(1)}
        </span>
        <span
          className={`${nameOxanium.className} text-[8px] font-bold uppercase tracking-[0.11em] text-slate-200/45`}
        >
          {totalLabel}
        </span>
      </div>
    </div>
  );
}
