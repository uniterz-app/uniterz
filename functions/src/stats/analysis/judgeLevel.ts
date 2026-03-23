// functions/src/stats/analysis/judgeLevel.ts

import { toLevel, Level } from "./thresholds";

export type Radar10 = {
  winRate: number;
  precision: number;
  upset: number;
  volume: number;
  streak: number;
  pointsV3: number;
};

export type RadarLevels = {
  winRate: Level;
  precision: Level;
  upset: Level;
  volume: Level;
  streak: Level;
  pointsV3: Level;
};

export type LevelSummary = {
  levels: RadarLevels;
  counts: {
    S: number;
    M: number;
    W: number;
  };
};

export function judgeLevels(radar10: Radar10): LevelSummary {
  const levels: RadarLevels = {
    winRate: toLevel(radar10.winRate),
    precision: toLevel(radar10.precision),
    upset: toLevel(radar10.upset),
    volume: toLevel(radar10.volume),
    streak: toLevel(radar10.streak),
    pointsV3: toLevel(radar10.pointsV3),
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