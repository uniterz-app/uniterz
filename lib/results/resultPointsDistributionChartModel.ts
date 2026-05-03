/**
 * Web `ResultPointsDistributionCard` と同一の得点分布チャート用ロジック（SVG / Skia 共通）。
 */
import type { GamePointsDistributionV1 } from "./gamePointsDistribution";

/** チャート縦軸の表示上限（pointsV3 が 10 超でも図上は頭打ち） */
export const SCORE_CHART_MAX = 10;
export const SCORE_HIT_FLOOR = 4;
export const PLOT_HEIGHT_SHARE_0_TO_4 = 0.07;

export const CHART_W = 320;
export const CHART_H = 200;
export const PAD_L = 36;
export const PAD_R = 12;
export const PAD_T = 8;
export const PAD_B = 28;

export const PLOT_W = CHART_W - PAD_L - PAD_R;
export const PLOT_H = CHART_H - PAD_T - PAD_B;
export const PLOT_BOTTOM = CHART_H - PAD_B;

export const PEER_DOT_FILL = "rgba(196, 181, 253, 0.52)";
export const YOU_HALO_FILL = "rgba(251, 191, 36, 0.22)";
export const YOU_CORE_FILL = "#fbbf24";
export const YOU_CORE_STROKE = "rgba(255, 252, 241, 0.9)";
export const MEDIAN_LINE_STROKE = "rgba(34, 211, 238, 0.88)";
export const MEAN_LINE_STROKE = "rgba(251, 113, 133, 0.88)";

export const GRID_YS = [0, 4, 5, 6, 7, 8, 9, 10] as const;

export function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

/** 決定的ジッター（インデックスのみ、同データで同配置） */
export function jitter01(i: number, salt: number) {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export function clampChartScore(raw: number): number {
  return clamp(raw, 0, SCORE_CHART_MAX);
}

export function scoreToY(score: number): number {
  const H = CHART_H - PAD_T - PAD_B;
  const yBottom = PAD_T + H;
  const yTop = PAD_T;
  const band04 = PLOT_HEIGHT_SHARE_0_TO_4 * H;
  const yAt4 = yBottom - band04;

  if (score <= SCORE_HIT_FLOOR) {
    const t = score / SCORE_HIT_FLOOR;
    return yBottom - t * band04;
  }
  const t = (score - SCORE_HIT_FLOOR) / (SCORE_CHART_MAX - SCORE_HIT_FLOOR);
  return yAt4 - t * (yAt4 - yTop);
}

export type DistChartDot = { x: number; y: number; kind: "peer" | "you" };

export function buildDotsFromDistribution(
  dist: GamePointsDistributionV1,
  myScore: number | null,
  maxDots: number
): DistChartDot[] {
  const dots: DistChartDot[] = [];
  let idx = 0;
  const totalPeers = dist.bins.reduce((s, b) => s + b.count, 0);
  const scale = totalPeers > maxDots ? maxDots / totalPeers : 1;

  for (const bin of dist.bins) {
    const take = Math.max(0, Math.round(bin.count * scale));
    const span = bin.hi - bin.lo;
    for (let k = 0; k < take; k++) {
      const t = jitter01(idx, 1);
      const u = jitter01(idx, 2);
      const score =
        span <= 0
          ? clampChartScore(bin.lo)
          : clampChartScore(bin.lo + span * (0.08 + t * 0.84));
      const nx = PAD_L + u * (CHART_W - PAD_L - PAD_R);
      dots.push({ x: nx, y: scoreToY(score), kind: "peer" });
      idx += 1;
    }
  }

  if (myScore != null && Number.isFinite(myScore)) {
    const s = clampChartScore(myScore);
    dots.push({
      x: PAD_L + (CHART_W - PAD_L - PAD_R) * 0.52,
      y: scoreToY(s),
      kind: "you",
    });
  }

  return dots;
}
