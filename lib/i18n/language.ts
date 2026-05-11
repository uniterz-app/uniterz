export type Language = "ja" | "en" | "zh" | "ko" | "es" | "de" | "fr" | "ar" | "pt";

export const ALL_LANGUAGES: readonly Language[] = [
  "ja", "en", "zh", "ko", "es", "de", "fr", "ar", "pt",
] as const;

export const LANGUAGE_NATIVE_NAMES: Record<Language, string> = {
  ja: "日本語",
  en: "English",
  zh: "中文",
  ko: "한국어",
  es: "Español",
  de: "Deutsch",
  fr: "Français",
  ar: "العربية",
  pt: "Português",
};

export const RTL_LANGUAGES: ReadonlySet<Language> = new Set<Language>(["ar"]);

export function isRtl(lang: Language): boolean {
  return RTL_LANGUAGES.has(lang);
}

export function normalizeLanguage(v: unknown): Language | null {
  if (
    v === "ja" || v === "en" || v === "zh" || v === "ko" ||
    v === "es" || v === "de" || v === "fr" || v === "ar" || v === "pt"
  ) {
    return v;
  }
  return null;
}

export const DATE_LOCALE: Record<Language, string> = {
  ja: "ja-JP",
  en: "en-US",
  zh: "zh-CN",
  ko: "ko-KR",
  es: "es-ES",
  de: "de-DE",
  fr: "fr-FR",
  ar: "ar-SA",
  pt: "pt-BR",
};

export function guessLanguageFromNavigator(): Language {
  if (typeof navigator === "undefined") return "en";
  const low = navigator.language?.toLowerCase() ?? "";
  if (low.startsWith("ja")) return "ja";
  if (low.startsWith("zh")) return "zh";
  if (low.startsWith("ko")) return "ko";
  if (low.startsWith("es")) return "es";
  if (low.startsWith("de")) return "de";
  if (low.startsWith("fr")) return "fr";
  if (low.startsWith("ar")) return "ar";
  if (low.startsWith("pt")) return "pt";
  return "en";
}
