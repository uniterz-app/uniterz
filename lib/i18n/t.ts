import type { Language } from "./language";
import type { Messages } from "@/messages/ja";
import ja from "@/messages/ja";
import en from "@/messages/en";
import zh from "@/messages/zh";
import ko from "@/messages/ko";
import es from "@/messages/es";
import de from "@/messages/de";
import fr from "@/messages/fr";
import ar from "@/messages/ar";
import pt from "@/messages/pt";

const ALL_MESSAGES: Record<Language, Messages> = {
  ja, en, zh, ko, es, de, fr, ar, pt,
};

/**
 * 指定言語のメッセージ辞書全体を返す。
 * 存在しない言語の場合は英語にフォールバック。
 *
 * 使い方: `t(language).common.loading`
 */
export function t(lang: Language): Messages {
  return ALL_MESSAGES[lang] ?? ALL_MESSAGES.en;
}

/**
 * 国コードから翻訳された国名を返す。
 * 辞書にない国コードの場合はコードをそのまま返す。
 */
export function countryName(lang: Language, code: string): string {
  const msgs = t(lang);
  const name = (msgs.countries as Record<string, string>)[code];
  return name ?? code;
}
