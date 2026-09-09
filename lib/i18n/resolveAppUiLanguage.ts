/**
 * 未ログイン時の UI 言語（ja | en）。
 * 端末 / ブラウザが日本語なら ja、それ以外は en。
 */
export type AppUiLanguage = "ja" | "en";

function localeCandidates(): string[] {
  const out: string[] = [];
  try {
    if (typeof navigator !== "undefined" && navigator.language) {
      out.push(navigator.language);
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
    const tag = String(raw || "").trim().toLowerCase().replace(/_/g, "-");
    if (tag === "ja" || tag.startsWith("ja-")) return "ja";
  }
  return "en";
}
