/**
 * シーズン予想（順位 / アワード）提出締切。
 */
import { L, resolveLocalizedLang, type LocalizedLang } from "@/lib/i18n/localize";
import { NBA_OPENING_NIGHT_DATE_KEY } from "@/lib/games/nbaOpeningNightPreviewGames";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";

/**
 * シーズンごとの提出締切（開幕戦 BOS@DET ティップオフ前）。
 * 新シーズンはここに 1 行足す。足し忘れた季は提出を受け付けない（安全側）。
 * functions の `notifyEveningPredictNudgesCron.ts` も同じ値を持つ（`scripts/check-season-predict-deadlines.mjs` で一致を確認）。
 */
export const SEASON_PREDICT_SUBMIT_DEADLINE_BY_SEASON: Readonly<Record<string, number>> = {
  /** 開幕戦 BOS@DET ティップオフ（10/20 15:00 ET） */
  "2026-27": Date.parse("2026-10-21T04:00:00+09:00"),
};

/** 今季の締切（既存の参照を壊さないため残す） */
export const SEASON_PREDICT_SUBMIT_DEADLINE_AT_MS =
  SEASON_PREDICT_SUBMIT_DEADLINE_BY_SEASON[CURRENT_NBA_SEASON_KEY] ?? 0;

/** 指定シーズンの締切（ms）。未登録なら null */
export function seasonPredictSubmitDeadlineMs(season: string): number | null {
  return SEASON_PREDICT_SUBMIT_DEADLINE_BY_SEASON[season] ?? null;
}

/**
 * 他人から見て、そのシーズンの予想がもう公開対象になっているか。
 * 過去シーズンは締切を過ぎている扱い。未来シーズンと締切未登録は閉じていない扱い（＝非公開）。
 */
export function seasonPredictSubmitClosedForSeason(
  season: string,
  nowMs: number = Date.now()
): boolean {
  if (season < CURRENT_NBA_SEASON_KEY) return true;
  if (season > CURRENT_NBA_SEASON_KEY) return false;
  const deadline = seasonPredictSubmitDeadlineMs(season);
  return deadline != null && nowMs >= deadline;
}

export const SEASON_PREDICT_SUBMIT_DEADLINE_WHEN = `${NBA_OPENING_NIGHT_DATE_KEY} 04:00 JST`;

export const SEASON_PREDICT_SUBMIT_DEADLINE_LABEL_JA =
  `開幕戦ティップオフ前（${NBA_OPENING_NIGHT_DATE_KEY} 04:00 JST）`;

export const SEASON_PREDICT_SUBMIT_DEADLINE_LABEL_EN =
  `Before opening tip-off (${NBA_OPENING_NIGHT_DATE_KEY} 04:00 JST)`;

export function seasonPredictSubmitDeadlineLabel(
  lang: LocalizedLang = "ja"
): string {
  return L(lang, {
    ja: SEASON_PREDICT_SUBMIT_DEADLINE_LABEL_JA,
    en: SEASON_PREDICT_SUBMIT_DEADLINE_LABEL_EN,
    ko: `개막전 팁오프 전 (${NBA_OPENING_NIGHT_DATE_KEY} 04:00 JST)`,
    zh: `开幕战跳球前（${NBA_OPENING_NIGHT_DATE_KEY} 04:00 JST）`,
    es: `Antes del salto inicial (${NBA_OPENING_NIGHT_DATE_KEY} 04:00 JST)`,
    pt: `Antes do tip-off de abertura (${NBA_OPENING_NIGHT_DATE_KEY} 04:00 JST)`,
    fr: `Avant le tip-off d’ouverture (${NBA_OPENING_NIGHT_DATE_KEY} 04:00 JST)`,
  });
}

export function isSeasonPredictSubmitOpen(
  nowMs: number = Date.now()
): boolean {
  const deadline = seasonPredictSubmitDeadlineMs(CURRENT_NBA_SEASON_KEY);
  return deadline != null && nowMs < deadline;
}

export function seasonPredictSubmitLockedMessage(
  lang: LocalizedLang = "ja"
): string {
  return L(lang, {
    ja: "提出期限を過ぎたため、編集・再提出はできません。",
    en: "The submission deadline has passed. Editing is locked.",
    ko: "제출 기한이 지나 편집 및 재제출할 수 없습니다.",
    zh: "提交期限已过，无法编辑或重新提交。",
    es: "El plazo de envío ha terminado. La edición está bloqueada.",
    pt: "O prazo de envio passou. A edição está bloqueada.",
    fr: "La date limite est passée. La modification est verrouillée.",
  });
}

export { resolveLocalizedLang as resolveSeasonPredictDeadlineLang };
