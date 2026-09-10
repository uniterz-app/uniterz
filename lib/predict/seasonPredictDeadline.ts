/**
 * シーズン予想（順位 / アワード）提出締切。
 */
import { L, resolveLocalizedLang, type LocalizedLang } from "@/lib/i18n/localize";
import { NBA_OPENING_NIGHT_DATE_KEY } from "@/lib/games/nbaOpeningNightPreviewGames";

export const SEASON_PREDICT_SUBMIT_DEADLINE_AT_MS = Date.parse(
  "2026-10-21T08:00:00+09:00"
);

export const SEASON_PREDICT_SUBMIT_DEADLINE_WHEN = `${NBA_OPENING_NIGHT_DATE_KEY} 08:00 JST`;

export const SEASON_PREDICT_SUBMIT_DEADLINE_LABEL_JA =
  `開幕戦キックオフ前（${NBA_OPENING_NIGHT_DATE_KEY} 08:00 JST）`;

export const SEASON_PREDICT_SUBMIT_DEADLINE_LABEL_EN =
  `Before opening tip-off (${NBA_OPENING_NIGHT_DATE_KEY} 08:00 JST)`;

export function seasonPredictSubmitDeadlineLabel(
  lang: LocalizedLang = "ja"
): string {
  return L(lang, {
    ja: SEASON_PREDICT_SUBMIT_DEADLINE_LABEL_JA,
    en: SEASON_PREDICT_SUBMIT_DEADLINE_LABEL_EN,
    ko: `개막전 킥오프 전 (${NBA_OPENING_NIGHT_DATE_KEY} 08:00 JST)`,
    zh: `开幕战开球前（${NBA_OPENING_NIGHT_DATE_KEY} 08:00 JST）`,
    es: `Antes del salto inicial (${NBA_OPENING_NIGHT_DATE_KEY} 08:00 JST)`,
    pt: `Antes do tip-off de abertura (${NBA_OPENING_NIGHT_DATE_KEY} 08:00 JST)`,
    fr: `Avant le tip-off d’ouverture (${NBA_OPENING_NIGHT_DATE_KEY} 08:00 JST)`,
  });
}

export function isSeasonPredictSubmitOpen(
  nowMs: number = Date.now()
): boolean {
  return nowMs < SEASON_PREDICT_SUBMIT_DEADLINE_AT_MS;
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
