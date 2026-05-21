import type { MobileMetric } from "../../../../../app/component/rankings/_data/mockRows";

export type RankingsLanguage = "ja" | "en";

export function metricLabel(metric: MobileMetric, language: RankingsLanguage): string {
  const ja = language === "ja";
  if (metric === "totalScore") return ja ? "総合スコア" : "Total";
  if (metric === "winRate") return ja ? "勝率" : "Win Rate";
  if (metric === "marginPrecision") return ja ? "スコア精度" : "Precision";
  if (metric === "upsetScore") return ja ? "アップセット" : "Upset";
  return ja ? "連勝" : "Streak";
}

export function rankingsTexts(language: RankingsLanguage) {
  const ja = language === "ja";
  return {
    title: "RANKINGS",
    scheduleInfoToggle: ja
      ? "更新スケジュールの説明を表示"
      : "Show ranking update schedule",
    playoffs: "PLAYOFFS",
    bracket: "BRACKET",
    bracketSoon: ja
      ? "ブラケットランキングは Web 版と同様に順次対応します。"
      : "Bracket rankings will match the web app in a future update.",
    yourRank: "YOUR RANK",
    pts: "pts",
    /** Web `streakShortLabel` に相当（点数横の短い単位） */
    streakShort: ja ? "連勝" : "W",
    loading: ja ? "読み込み中…" : "Loading…",
    noData: "NO DATA",
    winRateMin: (n: number) =>
      ja ? `勝率ランキングは${n}投稿以上が対象です。` : `Win rate requires at least ${n} posts.`,
    winRateNoMin: ja
      ? "このラウンドは投稿数の足切りはありません。"
      : "No minimum posts requirement for this round.",
    roundTotal: "TOTAL",
    roundFirst: "1ST",
    roundSecond: "2ND",
    roundCF: "CF",
    roundFinals: "FINALS",
    posts: ja ? "投稿" : "Posts",
  };
}
