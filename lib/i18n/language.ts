export type Language = "ja" | "en";

/** 言語ごとの既定タイムゾーン（プロフィール保存・表示用） */
export const TIMEZONE_BY_LANGUAGE: Record<Language, string> = {
  ja: "Asia/Tokyo",
  en: "America/New_York",
};

export function normalizeLanguage(v: unknown): Language | null {
  if (v === "ja" || v === "en") return v;
  // 旧バージョンの中国語コードは英語 UI に寄せる
  if (v === "zh") return "en";
  return null;
}

export function guessLanguageFromNavigator(): Language {
  if (typeof navigator === "undefined") return "en";
  const low = navigator.language?.toLowerCase() ?? "";
  if (low.startsWith("ja")) return "ja";
  if (low.startsWith("zh")) return "en";
  return "en";
}
