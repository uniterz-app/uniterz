// synced from lib/i18n/localize.ts — run npm run sync:monthly-report-builders
import { normalizeLanguage, type Language } from "./language";
import { ui, type UiStrings } from "./ui";

/** UI コピー対象言語（ja + 追加5言語 + en） */
export type LocalizedLang = Extract<
  Language,
  "ja" | "en" | "ko" | "zh" | "es" | "pt" | "fr"
>;

export const LOCALIZED_UI_LANGUAGES: readonly LocalizedLang[] = [
  "ja",
  "en",
  "ko",
  "zh",
  "es",
  "pt",
  "fr",
] as const;

export function resolveLocalizedLang(
  language: string | null | undefined
): LocalizedLang {
  const resolved = normalizeLanguage(language);
  if (
    resolved === "ja" ||
    resolved === "ko" ||
    resolved === "zh" ||
    resolved === "es" ||
    resolved === "pt" ||
    resolved === "fr"
  ) {
    return resolved;
  }
  return "en";
}

/** 7言語文字列から現在言語の文言を返す（未訳は en にフォールバック） */
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
