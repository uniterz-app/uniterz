import type { Language } from "@/lib/i18n/language";

/**
 * 各言語の文字列を直接渡す形式。
 * ja と en は必須、その他はオプション（未指定時は en にフォールバック）。
 */
export type UiStrings = {
  ja: string;
  en: string;
  zh?: string;
  ko?: string;
  es?: string;
  de?: string;
  fr?: string;
  ar?: string;
  pt?: string;
};

/**
 * 現在の表示言語に応じて文字列を返す。
 * 指定言語の翻訳がない場合は英語にフォールバック。
 *
 * 新規コードでは `t(lang).section.key` を推奨。
 * 既存の `ui(lang, { ja, en })` 呼び出しとの後方互換のために残す。
 */
export function ui(lang: Language, m: UiStrings): string {
  const val = m[lang];
  if (val != null && val !== "") return val;
  return m.en;
}
