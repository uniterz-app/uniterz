// functions/src/stats/analysis/judgeLevel.ts

import { toLevel, Level } from "./thresholds";

/**
 * radar10 の型
 * ※ rebuildUserMonthlyStatsV2.ts の radar10 と一致させる
 */
export type Radar10 = {
  winRate: number;    // 0–10 勝率
  accuracy: number;   // 0–10 予測精度
  precision: number;  // 0–10 スコア精度
  upset: number;      // 0–10 Upset的中率（hit / opportunity）
  volume: number;     // 0–10 投稿量
};

export type RadarLevels = {
  winRate: Level;
  accuracy: Level;
  precision: Level;
  upset: Level;
  volume: Level;
};

export type LevelSummary = {
  levels: RadarLevels;
  counts: {
    S: number;
    M: number;
    W: number;
  };
};

/**
 * radar10 → S/M/W 判定
 */
export function judgeLevels(radar10: Radar10): LevelSummary {
  const levels: RadarLevels = {
    winRate: toLevel(radar10.winRate),
    accuracy: toLevel(radar10.accuracy),
    precision: toLevel(radar10.precision),
    upset: toLevel(radar10.upset),
    volume: toLevel(radar10.volume),
  };

  const counts = {
    S: 0,
    M: 0,
    W: 0,
  };

  for (const lv of Object.values(levels)) {
    counts[lv]++;
  }

  return {
    levels,
    counts,
  };
}
