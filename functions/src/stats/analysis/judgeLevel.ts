// functions/src/stats/analysis/judgeLevel.ts

import { toLevel, toUpsetLevel, Level } from "./thresholds";

/**
 * radar10 の型
 * ※ rebuildUserMonthlyStatsV2.ts の radar10 と一致させる
 */
export type Radar10 = {
  winRate: number;
  precision: number;
  upset: number;
  volume: number;
  streak: number;   // 追加
  market: number;   // 追加
};

export type RadarLevels = {
  winRate: Level;
  precision: Level;
  upset: Level;
  volume: Level;
  streak: Level;    // 追加
  market: Level;    // 追加
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
  precision: toLevel(radar10.precision),
  upset: toUpsetLevel(radar10.upset / 10),
  volume: toLevel(radar10.volume),
  streak: toLevel(radar10.streak),
  market: toLevel(radar10.market),
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
