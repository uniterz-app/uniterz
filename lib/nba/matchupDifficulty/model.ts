/**
 * Matchup Difficulty v1 — 期待点差 M を作り、P = Phi(M / sigma) から
 * Difficulty = 100 x (1 - P) に一度だけ変換する。自チームの強さは含めない。
 * 係数は scripts/nba-matchup-difficulty-fit.ts の実測値（fittedCoefficients.ts）。
 */
import type { RestCategory } from "@/lib/nba/matchupDifficulty/features";

export type MatchupDifficultyCoefficients = {
  /** レーティング差 1 点あたりの期待点差 */
  ratingScale: number;
  /** ホームチームの期待点差（中立地比） */
  homeCourt: number;
  /** 自チーム休養区分の期待点差（基準 "1" = 0） */
  ownRest: Record<RestCategory, number>;
  /** 相手休養区分の期待点差（自チーム視点、基準 "1" = 0） */
  oppRest: Record<RestCategory, number>;
  /** 期待点差の残差 SD */
  sigma: number;
  /** rating = w*season + (1-w)*last10 */
  seasonWeight: number;
  /** 序盤の縮小: (n*current + k*prior) / (n + k) */
  shrinkGames: number;
  /** prior = 前季レーティング x この値（平均へ回帰） */
  priorCarryover: number;
  /** n 未満は「サンプル少」 */
  lowSampleGames: number;
  /** 表示 tier 境目（Difficulty 分布の 25 / 75 パーセンタイル） */
  tierSoftMax: number;
  tierToughMin: number;
  /** 連続 10 試合平均の tier 境目（UPCOMING サマリー用、25 / 75 パーセンタイル） */
  scheduleTierSoftMax: number;
  scheduleTierToughMin: number;
};

export type TeamRatingInput = {
  /** 今季の消化試合数 */
  gamesPlayed: number;
  /** 今季 1 試合あたり得失点差 */
  seasonMargin: number;
  /** 直近 10 試合（10 未満ならその数）の 1 試合あたり得失点差 */
  last10Margin: number;
  /** 前季 1 試合あたり得失点差（無ければ 0） */
  priorSeasonMargin: number;
};

export function blendTeamRating(
  input: TeamRatingInput,
  params: Pick<
    MatchupDifficultyCoefficients,
    "seasonWeight" | "shrinkGames" | "priorCarryover"
  >
): number {
  const n = Math.max(0, input.gamesPlayed);
  const prior = params.priorCarryover * input.priorSeasonMargin;
  if (n === 0) return prior;
  const current =
    params.seasonWeight * input.seasonMargin +
    (1 - params.seasonWeight) * input.last10Margin;
  return (n * current + params.shrinkGames * prior) / (n + params.shrinkGames);
}

/** 標準正規 CDF（Abramowitz-Stegun 7.1.26、誤差 < 1.5e-7） */
export function normCdf(x: number): number {
  const z = Math.abs(x) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * z);
  const poly =
    t *
    (0.254829592 +
      t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
  const erf = 1 - poly * Math.exp(-z * z);
  return x >= 0 ? 0.5 * (1 + erf) : 0.5 * (1 - erf);
}

export function difficultyFromMargin(margin: number, sigma: number): number {
  return 100 * (1 - normCdf(margin / sigma));
}

export type MatchupDifficultyInput = {
  oppRating: number;
  isHome: boolean;
  ownRest: RestCategory;
  oppRest: RestCategory;
  oppGamesPlayed: number;
};

export type MatchupDifficultyStep = {
  key: "base" | "venue" | "rest";
  /** 期待点差への寄与（自チーム視点） */
  marginDelta: number;
  /** この段階までの Difficulty */
  difficulty: number;
};

export type MatchupDifficultyTier = "soft" | "balanced" | "tough";

export type MatchupDifficultyResult = {
  difficulty: number;
  base: number;
  expectedMargin: number;
  steps: MatchupDifficultyStep[];
  tier: MatchupDifficultyTier;
  lowSample: boolean;
};

export function tierFromDifficulty(
  difficulty: number,
  coeffs: Pick<MatchupDifficultyCoefficients, "tierSoftMax" | "tierToughMin">
): MatchupDifficultyTier {
  if (difficulty >= coeffs.tierToughMin) return "tough";
  if (difficulty <= coeffs.tierSoftMax) return "soft";
  return "balanced";
}

export function computeMatchupDifficulty(
  input: MatchupDifficultyInput,
  coeffs: MatchupDifficultyCoefficients
): MatchupDifficultyResult {
  const baseMargin = -coeffs.ratingScale * input.oppRating;
  const venueMargin = input.isHome ? coeffs.homeCourt : -coeffs.homeCourt;
  const restMargin =
    (coeffs.ownRest[input.ownRest] ?? 0) + (coeffs.oppRest[input.oppRest] ?? 0);

  const steps: MatchupDifficultyStep[] = [];
  let margin = 0;
  for (const [key, delta] of [
    ["base", baseMargin],
    ["venue", venueMargin],
    ["rest", restMargin],
  ] as const) {
    margin += delta;
    steps.push({
      key,
      marginDelta: delta,
      difficulty: difficultyFromMargin(margin, coeffs.sigma),
    });
  }

  const difficulty = difficultyFromMargin(margin, coeffs.sigma);
  return {
    difficulty,
    base: steps[0]!.difficulty,
    expectedMargin: margin,
    steps,
    tier: tierFromDifficulty(difficulty, coeffs),
    lowSample: input.oppGamesPlayed < coeffs.lowSampleGames,
  };
}