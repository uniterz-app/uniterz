export type Language = "ja" | "en";

/** 言語ごとの既定タイムゾーン（プロフィール保存・表示用） */
export const TIMEZONE_BY_LANGUAGE: Record<Language, string> = {
  ja: "Asia/Tokyo",
  en: "America/New_York",
};

export function normalizeLanguage(v: unknown): Language | null {
  if (v === "ja" || v === "en") return v;
  // 中国語 UI を外したあとも、旧データの zh は英語扱いに寄せる
  if (v === "zh") return "en";
  return null;
}

export function guessLanguageFromNavigator(): Language {
  if (
    typeof navigator !== "undefined" &&
    navigator.language?.toLowerCase().startsWith("ja")
  ) {
    return "ja";
  }
  return "en";
}

