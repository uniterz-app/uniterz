export type Language = "ja" | "en";

export function normalizeLanguage(v: unknown): Language | null {
  if (v === "ja" || v === "en") return v;
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

