/**
 * 欠場込みの Matchup Difficulty。
 * 欠場の影響（点）は `nbaPlayerOutImpact`（試合単位の回帰、scripts/nba-injury-impact-fit.ts）。
 * 期待点差に足して Difficulty を取り直す。
 */
import { MATCHUP_DIFFICULTY_COEFFICIENTS } from "@/lib/nba/matchupDifficulty/fittedCoefficients";
import {
  difficultyFromMargin,
  marginFromDifficulty,
  tierFromDifficulty,
  type MatchupDifficultyCoefficients,
  type MatchupDifficultyTier,
} from "@/lib/nba/matchupDifficulty/model";

export type NbaInjuryOutImpact = {
  teamId: string;
  playerName: string;
  status: "out" | "questionable";
  /** 今夜効く分（点、0 以下）。厳しさに織り込み済みの分は除いた値 */
  netDelta: number;
  /** 影響値そのもの（点、0 以下）。netDelta と違うときだけ根拠に出す */
  fullDelta: number;
  /** 長期離脱・シーズンアウト */
  longTerm?: boolean;
  /** 影響値を出したシーズンの欠場試合 */
  gamesOut: number;
  seasonKey: string;
  /** ace-out の欠場時 W–L（あれば根拠に添える） */
  whenOutWl?: string;
};

/** 回帰は欠場を足し算で当てはめているので、同じチームの複数欠場もそのまま足す */
export function combinedTeamNetDelta(deltas: number[]): number {
  return deltas.reduce((sum, d) => sum + d, 0);
}

export type InjuryAdjustedDifficulty = {
  before: number;
  after: number;
  tierBefore: MatchupDifficultyTier;
  tierAfter: MatchupDifficultyTier;
};

/**
 * own = 自チーム欠場の得失点差変化（負なら弱くなる → 厳しく）、
 * opp = 相手欠場の変化（負なら相手が弱くなる → 楽に）。
 * 影響値は試合の点差で直接当てはめた値なので ratingScale は掛けない。
 */
export function injuryAdjustedDifficulty(
  difficulty: number,
  ownNetDelta: number,
  oppNetDelta: number,
  coeffs: MatchupDifficultyCoefficients = MATCHUP_DIFFICULTY_COEFFICIENTS
): InjuryAdjustedDifficulty {
  const margin = marginFromDifficulty(difficulty, coeffs.sigma);
  const adjusted = margin + ownNetDelta - oppNetDelta;
  const after = Math.round(difficultyFromMargin(adjusted, coeffs.sigma));
  return {
    before: difficulty,
    after,
    tierBefore: tierFromDifficulty(difficulty, coeffs),
    tierAfter: tierFromDifficulty(after, coeffs),
  };
}
