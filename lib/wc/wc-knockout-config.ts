/**
 * WC ブラケット予想 — シーズン設定
 */

export type WcKnockoutBracketConfig = {
  season: string;
  /** 提出締切（ノックアウト第 1 試合キックオフ）。確定後に更新する */
  submissionClosesAtIso?: string;
  /** シード未確定・一時停止 */
  allowSubmission?: boolean;
};

export const WC_KNOCKOUT_BRACKET_CONFIGS: Record<string, WcKnockoutBracketConfig> =
  {
    "2025-26": {
      season: "2025-26",
      /**
       * R32 第 1 試合 M73（2A vs 2B）キックオフ。
       * TODO: ノックアウト試合 seed 確定後に startAtJst と同期させる。
       */
      submissionClosesAtIso: "2026-06-28T12:00:00-07:00",
      allowSubmission: true,
    },
  };

export function getWcKnockoutBracketConfig(
  season: string
): WcKnockoutBracketConfig {
  const config = WC_KNOCKOUT_BRACKET_CONFIGS[season];
  if (!config) {
    throw new Error(`WC knockout bracket config not found for season: ${season}`);
  }
  return config;
}

export function isWcKnockoutBracketSubmissionPastDeadline(
  season: string,
  nowMs = Date.now()
): boolean {
  const config = getWcKnockoutBracketConfig(season);
  if (config.allowSubmission === false) return true;
  const iso = config.submissionClosesAtIso;
  if (!iso) return false;
  const closes = Date.parse(iso);
  if (!Number.isFinite(closes)) return false;
  return nowMs >= closes;
}
