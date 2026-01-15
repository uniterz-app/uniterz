// app/component/pro/analysis/types.ts
export type RadarMetric = {
  winRate: number;
  accuracy: number;
  precision: number;
  upset: number;
  volume: number;
  upsetValid: boolean;
};

export type RadarChartProps = {
  value: RadarMetric;
  prevValue?: RadarMetric;
  isSample?: boolean;
};
