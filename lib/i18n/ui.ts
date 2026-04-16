import type { Language } from "@/lib/i18n/language";

/** 日本語・英語の UI 文言ペア */
export type UiStrings = {
  ja: string;
  en: string;
};

/**
 * 現在の表示言語に応じて ja / en のどちらかを返す。
 */
export function ui(lang: Language, m: UiStrings): string {
  return lang === "en" ? m.en : m.ja;
}
