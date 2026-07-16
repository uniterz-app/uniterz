/**
 * 予想フォーム Pro「タイミング」— 共有型
 */

/** v1 確定 ID（doc 柱 3）。L2 同帯偏りは偏りバーで表示するためテキストからは除外。 */
export type PredictTimingAdviceV1Id =
  | "teamStrong"
  | "teamWeak"
  | "teamUpsetContext"
  | "awayWeak"
  | "underdogStrong";

/** 旧ドラフト ID（本番移行まで残す） */
export type PredictTimingAdviceLegacyId =
  | "shadowExact"
  | "knockoutFocus";

export type PredictTimingAdviceId =
  | PredictTimingAdviceV1Id
  | PredictTimingAdviceLegacyId;

export type PredictTimingAdvice = {
  id: PredictTimingAdviceId;
  params: Record<string, string | number>;
};

export type TimingRuleEval = {
  id: PredictTimingAdviceV1Id | "silent";
  priority: number;
  labelJa: string;
  labelEn: string;
  hit: boolean;
  reason: string;
  advice: PredictTimingAdvice | null;
};
