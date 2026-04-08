// app/component/pro/analysis/types.ts

import type { RadarAxisLevels } from "./radarLevelUtils";

export type RadarMetric = {
  winRate: number; // 0–10（当月・10投稿以上ユーザー内の相対）
  precision: number;
  upset: number;
  volume: number;
  streak: number;
  upsetValid?: boolean;
  /** false のときレーダー母集団に含まれない（例: 当月10投稿未満） */
  radarEligible?: boolean;
};

export type RadarChartProps = {
  value: RadarMetric;
  /** 未指定時は右側の評価パネルを出さない（プレビュー互換） */
  axisLevels?: RadarAxisLevels | null;
  isSample?: boolean;
  language?: "ja" | "en";
};