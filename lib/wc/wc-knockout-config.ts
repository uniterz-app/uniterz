/**
 * WC ブラケット予想 — シーズン設定
 */

import type { Language } from "@/lib/i18n/language";

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

/** 提出 UI・Firestore 書き込みが許可されているか */
export function isWcKnockoutBracketSubmissionOpen(
  season: string,
  nowMs = Date.now()
): boolean {
  return !isWcKnockoutBracketSubmissionPastDeadline(season, nowMs);
}

/** ノックアウトステージ開始（R32 第1試合キックオフ以降） */
export function isWcKnockoutStageStarted(
  season: string,
  nowMs = Date.now()
): boolean {
  return isWcKnockoutBracketSubmissionPastDeadline(season, nowMs);
}

/** モーダル・告知用 — 提出締切の表示ラベル（JST / ET） */
export function formatWcBracketSubmissionDeadline(
  season: string,
  language: Language
): string | null {
  const iso = getWcKnockoutBracketConfig(season).submissionClosesAtIso;
  if (!iso) return null;
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return null;

  const isJa = language === "ja";
  const timeZone = isJa ? "Asia/Tokyo" : "America/New_York";
  const formatted = d.toLocaleString(isJa ? "ja-JP" : "en-US", {
    timeZone,
    year: "numeric",
    month: isJa ? "long" : "short",
    day: "numeric",
    weekday: isJa ? "short" : undefined,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return isJa ? `${formatted}（JST）` : `${formatted} ET`;
}
