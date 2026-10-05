/** 自動生成: scripts/nba-matchup-difficulty-fit.ts（手で編集しない） */
import type { MatchupDifficultyCoefficients } from "@/lib/nba/matchupDifficulty/model";

export const MATCHUP_DIFFICULTY_FIT_SEASONS = ["2021-22","2022-23","2023-24","2024-25"] as const;

export const MATCHUP_DIFFICULTY_COEFFICIENTS: MatchupDifficultyCoefficients = {
  "ratingScale": 1.147,
  "homeCourt": 1.939,
  "ownRest": {
    "0": -2.693,
    "1": 0,
    "2": 0.218,
    "3+": 1.191
  },
  "oppRest": {
    "0": 2.693,
    "1": 0,
    "2": -0.218,
    "3+": -1.191
  },
  "sigma": 13.797,
  "seasonWeight": 0.8,
  "shrinkGames": 20,
  "priorCarryover": 0.4,
  "lowSampleGames": 10,
  "tierSoftMax": 40.62,
  "tierToughMin": 59.918,
  "scheduleTierSoftMax": 47.329,
  "scheduleTierToughMin": 52.878
};
