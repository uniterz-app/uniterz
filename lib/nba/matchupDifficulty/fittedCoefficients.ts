/** 自動生成: scripts/nba-matchup-difficulty-fit.ts（手で編集しない） */
import type { MatchupDifficultyCoefficients } from "@/lib/nba/matchupDifficulty/model";

export const MATCHUP_DIFFICULTY_FIT_SEASONS = ["2021-22","2022-23","2023-24","2024-25"] as const;

export const MATCHUP_DIFFICULTY_COEFFICIENTS: MatchupDifficultyCoefficients = {
  "ratingScale": 1.171,
  "homeCourt": 1.929,
  "ownRest": {
    "0": -2.675,
    "1": 0,
    "2": 0.236,
    "3+": 1.254
  },
  "oppRest": {
    "0": 2.675,
    "1": 0,
    "2": -0.236,
    "3+": -1.254
  },
  "sigma": 13.77,
  "seasonWeight": 0.8,
  "shrinkGames": 25,
  "priorCarryover": 0.4,
  "winTotalScale": 0.175,
  "winTotalPriorCarryover": 0.1,
  "lowSampleGames": 10,
  "tierSoftMax": 40.578,
  "tierToughMin": 60.117,
  "scheduleTierSoftMax": 47.271,
  "scheduleTierToughMin": 52.946
};
