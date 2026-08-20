/**
 * How They Play の「1試合あたり何点」。
 *
 * BDL 対応（本番差し替え時）:
 * - Scoring: `pts * pct_pts_*`。paint / FB は miscellaneous `points_paint` /
 *   `points_fast_break` を GP で割っても同じ単位。
 * - Playtype: PPP × (frequency × possessions)。BDL playtype は PPP + freq。
 * - Shot: shooting by_zone の FGM × 2 or 3 / GP。
 * - Track: tracking drives / catchshoot / pullupshot / painttouch の PTS。
 */

export type HowPts = {
  value: number;
  display: string;
};

export function roundHowPts(n: number): number {
  return Math.round(n * 10) / 10;
}

export function ptsFromShare(ppg: number, share: number): number {
  return roundHowPts(ppg * share);
}

export function formatHowPts(n: number): string {
  return roundHowPts(n).toFixed(1);
}

export function howPtsCell(n: number): HowPts {
  const value = roundHowPts(n);
  return { value, display: formatHowPts(value) };
}
