/**
 * 未ログイン時の UI 言語。
 * ブラウザが日本語なら ja。9 言語コピーは地域付きタグ（ja-JP など）も言語部分で判定する。
 */
import { languageFromLocaleTag } from "@/lib/i18n/language";
import type { LocalizedLang } from "@/lib/i18n/localize";

export type AppUiLanguage = "ja" | "en";

function localeCandidates(): string[] {
  const out: string[] = [];
  try {
    if (typeof navigator !== "undefined") {
      if (navigator.language) out.push(navigator.language);
      if (Array.isArray(navigator.languages)) {
        for (const item of navigator.languages) {
          if (typeof item === "string" && item) out.push(item);
        }
      }
    }
  } catch {
    // ignore
  }
  try {
    if (typeof Intl !== "undefined") {
      out.push(Intl.DateTimeFormat().resolvedOptions().locale);
    }
  } catch {
    // ignore
  }
  return out;
}

export function resolveAppUiLanguage(): AppUiLanguage {
  for (const raw of localeCandidates()) {
    if (languageFromLocaleTag(raw) === "ja") return "ja";
  }
  return "en";
}

/** 未ログイン画面でも 9 言語コピーを出したいとき（ja|en に潰さない） */
export function resolveAppUiLocalizedLang(): LocalizedLang {
  for (const raw of localeCandidates()) {
    const lang = languageFromLocaleTag(raw);
    if (lang) return lang;
  }
  return "en";
}
