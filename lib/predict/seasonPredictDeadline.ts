/**
 * シーズン予想（順位 / アワード）提出締切。
 * 方針: 開幕戦キックオフ前まで編集・提出可。開始後ロック。
 * 日時の正は開幕夜アンカー（`nbaOpeningNightPreviewGames`）と揃える。
 */
import { NBA_OPENING_NIGHT_DATE_KEY } from "@/lib/games/nbaOpeningNightPreviewGames";

/**
 * 2026-27 開幕戦キックオフ（JST）。
 * Games 既定の開幕アンカーと同じ瞬間。公式 tip が確定したらここを更新する。
 */
export const SEASON_PREDICT_SUBMIT_DEADLINE_AT_MS = Date.parse(
  "2026-10-21T08:00:00+09:00"
);

export const SEASON_PREDICT_SUBMIT_DEADLINE_LABEL_JA =
  `開幕戦キックオフ前（${NBA_OPENING_NIGHT_DATE_KEY} 08:00 JST）`;

export const SEASON_PREDICT_SUBMIT_DEADLINE_LABEL_EN =
  `Before opening tip-off (${NBA_OPENING_NIGHT_DATE_KEY} 08:00 JST)`;

export function isSeasonPredictSubmitOpen(
  nowMs: number = Date.now()
): boolean {
  return nowMs < SEASON_PREDICT_SUBMIT_DEADLINE_AT_MS;
}

export function seasonPredictSubmitLockedMessage(
  lang: "ja" | "en" = "ja"
): string {
  return lang === "ja"
    ? "提出期限を過ぎたため、編集・再提出はできません。"
    : "The submission deadline has passed. Editing is locked.";
}
