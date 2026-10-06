/** 自動生成: scripts/nba-injury-impact-fit.ts（手で編集しない） */

export const OUT_IMPACT_FIT_SEASONS = ["2021-22","2022-23","2023-24","2024-25","2025-26"] as const;

/** 個人差の寄せ（ridge λ）。大きいほどスタッツの目安に寄る */
export const OUT_IMPACT_LAMBDA = 40;

/** スタッツの目安 = Σ γ × 1 試合平均（OUT_IMPACT_FEATURES 順） */
export const OUT_IMPACT_GAMMA = [0.1093,-0.1987,-0.0912,-0.5846,-0.8306,1.5832] as const;
