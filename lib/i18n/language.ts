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
  if (isTraditionalChineseTag(v)) return "zh";
  return null;
}

/**
 * 中国語の字体。文言は `zh`（簡体字）で持ち、`hant` のときだけ表示時に繁体字へ変換する。
 * Firestore は `users.language = "zh"` + `users.chineseScript = "hant"`（簡体字は欠落）。
 */
export type ChineseScript = "hans" | "hant";

/** 言語メニューの選択肢（繁体字は言語ではなく `zh` の字体違い） */
export type LanguageChoice = Language | "zh-Hant";

export const LANGUAGE_CHOICES: readonly LanguageChoice[] = [
  "ja", "en", "zh", "zh-Hant", "ko", "es", "de", "fr", "ar", "pt",
] as const;

/** 先頭の U+2060 は Native の字体変換を止める印（「简体中文」を繁体字にしない） */
export const NO_CHINESE_SCRIPT_CONVERT = "\u2060";

export const LANGUAGE_CHOICE_NATIVE_NAMES: Record<LanguageChoice, string> = {
  ...LANGUAGE_NATIVE_NAMES,
  zh: `${NO_CHINESE_SCRIPT_CONVERT}简体中文`,
  "zh-Hant": "繁體中文",
};

export function isTraditionalChineseTag(v: unknown): boolean {
  if (typeof v !== "string") return false;
  const tag = v.trim().toLowerCase().replace(/_/g, "-");
  return (
    tag === "zh-hant" ||
    tag.startsWith("zh-hant-") ||
    tag === "zh-tw" ||
    tag === "zh-hk" ||
    tag === "zh-mo"
  );
}

export function normalizeChineseScript(v: unknown): ChineseScript {
  return v === "hant" ? "hant" : "hans";
}

export function normalizeLanguageChoice(v: unknown): LanguageChoice | null {
  if (isTraditionalChineseTag(v)) return "zh-Hant";
  return normalizeLanguage(v);
}

export function languageChoiceOf(
  language: Language,
  script: ChineseScript
): LanguageChoice {
  return language === "zh" && script === "hant" ? "zh-Hant" : language;
}

export function languageFromChoice(choice: LanguageChoice): Language {
  return choice === "zh-Hant" ? "zh" : choice;
}

export function chineseScriptFromChoice(choice: LanguageChoice): ChineseScript {
  return choice === "zh-Hant" ? "hant" : "hans";
}

/** 端末ロケールが繁体字圏（zh-Hant / zh-TW / zh-HK / zh-MO）なら hant */
export function guessChineseScriptFromDevice(): ChineseScript {
  const tags: string[] = [];
  try {
    if (typeof navigator !== "undefined" && navigator.language) tags.push(navigator.language);
  } catch {
    // ignore
  }
  try {
    if (typeof Intl !== "undefined") tags.push(Intl.DateTimeFormat().resolvedOptions().locale);
  } catch {
    // ignore
  }
  for (const raw of tags) {
    const tag = String(raw || "").trim().toLowerCase().replace(/_/g, "-");
    if (!tag.startsWith("zh")) continue;
    if (tag.includes("hant") || /-(tw|hk|mo)(-|$)/.test(tag)) return "hant";
    return "hans";
  }
  return "hans";
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
