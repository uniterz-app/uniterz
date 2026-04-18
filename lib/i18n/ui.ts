import type { Language } from "@/lib/i18n/language";

/** UI 文言（日本語・英語） */
export type UiStrings = {
  ja: string;
  en: string;
};

/**
 * 現在の表示言語に応じて文字列を返す。
 */
export function ui(lang: Language, m: UiStrings): string {
  if (lang === "en") return m.en;
  return m.ja;
}
