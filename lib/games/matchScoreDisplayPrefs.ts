/**
 * 試合カードのスコア表示設定（users/{uid}/private/displayPrefs の `prefs`）。
 * ライブ中・試合終了スコアとも既定で非表示（ネタバレ防止）。
 */
export type MatchScoreDisplayPrefs = {
  showLiveScore: boolean;
  showFinalScore: boolean;
};

export type MatchScoreDisplayPrefKey = keyof MatchScoreDisplayPrefs;

export const DEFAULT_MATCH_SCORE_DISPLAY_PREFS: MatchScoreDisplayPrefs = {
  showLiveScore: false,
  showFinalScore: false,
};

export function parseMatchScoreDisplayPrefs(raw: unknown): MatchScoreDisplayPrefs {
  const o =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const boolOr = (key: MatchScoreDisplayPrefKey) =>
    typeof o[key] === "boolean"
      ? (o[key] as boolean)
      : DEFAULT_MATCH_SCORE_DISPLAY_PREFS[key];
  return {
    showLiveScore: boolOr("showLiveScore"),
    showFinalScore: boolOr("showFinalScore"),
  };
}

export const MATCH_SCORE_DISPLAY_COPY = {
  ja: {
    pageTitle: "表示設定",
    pageDescription: "アプリの表示を自分好みに切り替えます",
    section: "スコア表示",
    hint: "試合カードに表示するスコアを選べます",
    liveTitle: "ライブ中のスコア",
    liveDesc: "試合中のカードに途中経過のスコアと試合時間を表示します",
    finalTitle: "試合終了スコア",
    finalDesc: "終了した試合のカードに最終スコアを表示します",
  },
  en: {
    pageTitle: "Display",
    pageDescription: "Customize how the app shows information",
    section: "SCORE DISPLAY",
    hint: "Choose which scores appear on match cards",
    liveTitle: "Live score",
    liveDesc: "Show the in-progress score and game clock on live match cards",
    finalTitle: "Final score",
    finalDesc: "Show the final score on finished match cards",
  },
} as const;

export function matchScoreDisplayCopy(language: string | null | undefined) {
  return language === "ja" ? MATCH_SCORE_DISPLAY_COPY.ja : MATCH_SCORE_DISPLAY_COPY.en;
}
