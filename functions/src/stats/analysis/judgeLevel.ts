// functions/src/stats/analysis/judgeLevel.ts

import { toLevel, Level } from "./thresholds";

export type Radar10 = {
  winRate: number;
  accuracy: number;
  precision: number;
  upset: number;
  volume: number;
  streak: number;
};

export type RadarLevels = {
  winRate: Level;
  accuracy: Level;
  precision: Level;
  upset: Level;
  volume: Level;
  streak: Level;
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
    accuracy: toLevel(radar10.accuracy),
    precision: toLevel(radar10.precision),
    upset: toLevel(radar10.upset),
    volume: toLevel(radar10.volume),
    streak: toLevel(radar10.streak),
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