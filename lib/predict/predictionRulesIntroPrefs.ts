/** 初回予想前のルール説明モーダルを表示済みか（localStorage） */
export const PREDICTION_RULES_INTRO_SEEN_KEY =
  "prediction_rules_intro_seen_v1";

export function readPredictionRulesIntroSeen(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(PREDICTION_RULES_INTRO_SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

export function writePredictionRulesIntroSeen(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PREDICTION_RULES_INTRO_SEEN_KEY, "1");
  } catch {
    /* ignore */
  }
}
