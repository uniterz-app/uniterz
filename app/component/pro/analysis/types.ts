// app/component/pro/analysis/types.ts

export type RadarMetric = {
  winRate: number;      // 勝率（0–10）
  accuracy: number;     // 予測精度（0–10）
  precision: number;    // スコア精度（0–10）
  upset: number;        // Upset（0–10）
  volume: number;       // 投稿量（0–10）
  streak: number;       // 耐性（0–10）
  upsetValid?: boolean;
};

export type RadarChartProps = {
  value: RadarMetric;
  prevValue?: RadarMetric;
  isSample?: boolean;
};