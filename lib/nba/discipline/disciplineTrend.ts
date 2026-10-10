/**
 * DISCIPLINE シーズン推移の線グラフ（Web SVG / react-native-svg 共通のジオメトリ）。
 * 曲線は単調 3 次補間（0 を下回るオーバーシュートなし）。
 */
import type {
  NbaDisciplineCounts,
  NbaDisciplineHistoryPoint,
  NbaDisciplineSeasonType,
} from "@/lib/nba/discipline/disciplineTypes";
import { formatDisciplineFineUsd } from "@/lib/nba/discipline/formatDisciplineFineUsd";

export type NbaDisciplineTrendMetric = keyof NbaDisciplineCounts;

export const NBA_DISCIPLINE_TREND_METRICS: ReadonlyArray<{
  key: NbaDisciplineTrendMetric;
  label: string;
}> = [
  { key: "tech", label: "TECH" },
  { key: "flag", label: "FLAG" },
  { key: "eject", label: "EJECT" },
  { key: "susp", label: "SUSP" },
  { key: "fines", label: "FINES" },
];

export type NbaDisciplineTrendDot = {
  season: string;
  /** "24-25" */
  label: string;
  x: number;
  y: number;
  value: number;
  display: string;
};

export type NbaDisciplineTrend = {
  line: string;
  area: string;
  baselineY: number;
  dots: NbaDisciplineTrendDot[];
  total: string;
};

export type NbaDisciplineTrendFrame = {
  width: number;
  height: number;
  padX: number;
  /** 値ラベル分の上余白 */
  padTop: number;
  /** シーズンラベル分の下余白 */
  padBottom: number;
};

function formatValue(metric: NbaDisciplineTrendMetric, v: number): string {
  return metric === "fines" ? formatDisciplineFineUsd(v) : String(Math.round(v));
}

function monotonePath(pts: ReadonlyArray<{ x: number; y: number }>): string {
  const n = pts.length;
  if (n === 0) return "";
  if (n === 1) return `M ${pts[0]!.x} ${pts[0]!.y}`;
  const dx: number[] = [];
  const slope: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx.push(pts[i + 1]!.x - pts[i]!.x);
    slope.push((pts[i + 1]!.y - pts[i]!.y) / dx[i]!);
  }
  const t: number[] = [slope[0]!];
  for (let i = 1; i < n - 1; i++) {
    const a = slope[i - 1]!;
    const b = slope[i]!;
    t.push(a * b <= 0 ? 0 : (3 * (dx[i - 1]! + dx[i]!)) /
      ((2 * dx[i]! + dx[i - 1]!) / a + (dx[i]! + 2 * dx[i - 1]!) / b));
  }
  t.push(slope[n - 2]!);
  let d = `M ${pts[0]!.x.toFixed(1)} ${pts[0]!.y.toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[i]!;
    const p1 = pts[i + 1]!;
    const h = dx[i]! / 3;
    d += ` C ${(p0.x + h).toFixed(1)} ${(p0.y + t[i]! * h).toFixed(1)}, ${(p1.x - h).toFixed(1)} ${(p1.y - t[i + 1]! * h).toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
  }
  return d;
}

export function buildDisciplineTrend(
  points: readonly NbaDisciplineHistoryPoint[],
  phase: NbaDisciplineSeasonType,
  metric: NbaDisciplineTrendMetric,
  frame: NbaDisciplineTrendFrame
): NbaDisciplineTrend {
  const { width, height, padX, padTop, padBottom } = frame;
  const values = points.map((p) => Math.max(0, p[phase][metric]));
  const max = Math.max(1, ...values);
  const baselineY = height - padBottom;
  const plotH = baselineY - padTop;
  const step = points.length > 1 ? (width - padX * 2) / (points.length - 1) : 0;
  const dots: NbaDisciplineTrendDot[] = points.map((p, i) => ({
    season: p.season,
    label: `${p.season.slice(2, 4)}-${p.season.slice(5, 7)}`,
    x: points.length > 1 ? padX + step * i : width / 2,
    y: baselineY - (values[i]! / max) * plotH,
    value: values[i]!,
    display: formatValue(metric, values[i]!),
  }));
  const line = monotonePath(dots);
  const area =
    dots.length > 1
      ? `${line} L ${dots.at(-1)!.x.toFixed(1)} ${baselineY} L ${dots[0]!.x.toFixed(1)} ${baselineY} Z`
      : "";
  const sum = values.reduce((a, b) => a + b, 0);
  return { line, area, baselineY, dots, total: formatValue(metric, sum) };
}
