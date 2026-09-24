// synced from lib/i18n/localize.ts — run npm run sync:monthly-report-builders
import { normalizeLanguage, type Language } from "./language";
import { ui, type UiStrings } from "./ui";

/** UI コピー対象言語（アプリ全言語 = Language と同じ 9） */
export type LocalizedLang = Language;

export const LOCALIZED_UI_LANGUAGES: readonly LocalizedLang[] = [
  "ja",
  "en",
  "zh",
  "ko",
  "es",
  "de",
  "fr",
  "ar",
  "pt",
] as const;

export function resolveLocalizedLang(
  language: string | null | undefined
): LocalizedLang {
  return normalizeLanguage(language) ?? "en";
}

/** 9言語文字列から現在言語の文言を返す（未訳は en にフォールバック） */
export function L(lang: LocalizedLang, strings: UiStrings): string {
  return ui(lang, strings);
}

/** 配列コピー用 */
export function Ls(
  lang: LocalizedLang,
  rows: readonly UiStrings[]
): readonly string[] {
  return rows.map((row) => L(lang, row));
}
