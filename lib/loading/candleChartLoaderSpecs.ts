/** Web `app/globals.css` `.candle:nth-child(n)` と同じローソク足比率 */
export type CandleChartSpec = {
  bodyBottomPct: number;
  bodyHeightPct: number;
  wickBottomPct: number;
  wickHeightPct: number;
  /** CSS animation-delay（秒） */
  delaySec: number;
};

export const CANDLE_CHART_LOADER_COUNT = 18;

export const CANDLE_CHART_LOADER_SPECS: readonly CandleChartSpec[] = [
  { bodyBottomPct: 7.1, bodyHeightPct: 18.93, wickBottomPct: 0, wickHeightPct: 31.95, delaySec: 0 },
  { bodyBottomPct: 26.04, bodyHeightPct: 2.37, wickBottomPct: 19.41, wickHeightPct: 14.91, delaySec: 0.065 },
  { bodyBottomPct: 28.64, bodyHeightPct: 4.5, wickBottomPct: 16.92, wickHeightPct: 21.66, delaySec: 0.13 },
  { bodyBottomPct: 31.42, bodyHeightPct: 3.43, wickBottomPct: 19.76, wickHeightPct: 27.93, delaySec: 0.195 },
  { bodyBottomPct: 31.42, bodyHeightPct: 15.44, wickBottomPct: 27.43, wickHeightPct: 28.07, delaySec: 0.26 },
  { bodyBottomPct: 46.54, bodyHeightPct: 0.28, wickBottomPct: 43.43, wickHeightPct: 24.38, delaySec: 0.325 },
  { bodyBottomPct: 35.86, bodyHeightPct: 8.7, wickBottomPct: 29.7, wickHeightPct: 24.5, delaySec: 0.39 },
  { bodyBottomPct: 11.67, bodyHeightPct: 24.19, wickBottomPct: 5.33, wickHeightPct: 31.83, delaySec: 0.455 },
  { bodyBottomPct: 11.83, bodyHeightPct: 15.1, wickBottomPct: 7.93, wickHeightPct: 24.97, delaySec: 0.52 },
  { bodyBottomPct: 27.81, bodyHeightPct: 12.04, wickBottomPct: 27.69, wickHeightPct: 28.17, delaySec: 0.585 },
  { bodyBottomPct: 39.85, bodyHeightPct: 28.25, wickBottomPct: 39.53, wickHeightPct: 28.58, delaySec: 0.65 },
  { bodyBottomPct: 70.8, bodyHeightPct: 6.27, wickBottomPct: 60.96, wickHeightPct: 24.84, delaySec: 0.715 },
  { bodyBottomPct: 75.8, bodyHeightPct: 2.71, wickBottomPct: 68.38, wickHeightPct: 31.62, delaySec: 0.78 },
  { bodyBottomPct: 67.23, bodyHeightPct: 8.71, wickBottomPct: 64.8, wickHeightPct: 24.97, delaySec: 0.845 },
  { bodyBottomPct: 67.81, bodyHeightPct: 7.85, wickBottomPct: 57.54, wickHeightPct: 27.55, delaySec: 0.91 },
  { bodyBottomPct: 70.08, bodyHeightPct: 6.14, wickBottomPct: 55.68, wickHeightPct: 21.83, delaySec: 0.975 },
  { bodyBottomPct: 66.39, bodyHeightPct: 3.69, wickBottomPct: 58.11, wickHeightPct: 26.11, delaySec: 1.04 },
  { bodyBottomPct: 64.8, bodyHeightPct: 9.78, wickBottomPct: 45.47, wickHeightPct: 29.61, delaySec: 1.105 },
] as const;

export const CANDLE_CHART_LOADER_DURATION_MS = 2600;
