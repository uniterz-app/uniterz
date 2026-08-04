/**
 * Free 向け Pro Insight ゲート文面（ReportGate の Insight 版）
 */

export type ProInsightGateBulletIcon =
  | "matchup"
  | "schedule"
  | "context"
  | "edge"
  | "comment";

export type ProInsightGateBullet = {
  icon: ProInsightGateBulletIcon;
  title: string;
  detail: string;
};

export type ProInsightGateCopy = {
  eyebrow: string;
  title: string;
  body: string;
  bullets: readonly ProInsightGateBullet[];
  cta: string;
};

const JA: ProInsightGateCopy = {
  eyebrow: "PRO INSIGHT",
  title: "試合の読み解きは Pro から",
  body: "マッチアップ・日程・文脈を左右比較で把握できます。",
  bullets: [
    {
      icon: "matchup",
      title: "マッチアップ",
      detail: "相性とエッジをホーム／アウェイで比較",
    },
    {
      icon: "schedule",
      title: "スケジュール",
      detail: "連戦・休養・移動の負荷が一目でわかる",
    },
    {
      icon: "context",
      title: "コンテキスト",
      detail: "直近フォームと試合の文脈",
    },
    {
      icon: "edge",
      title: "有利不利",
      detail: "どちらが相手の弱点を突けるか",
    },
    {
      icon: "comment",
      title: "根拠つき解説",
      detail: "数字つきの短い読みポイント",
    },
  ],
  cta: "Pro を見る",
};

const EN: ProInsightGateCopy = {
  eyebrow: "PRO INSIGHT",
  title: "Match reads unlock with Pro",
  body: "Compare matchup, schedule, and context side by side.",
  bullets: [
    {
      icon: "matchup",
      title: "Matchup",
      detail: "Edges and fit for home vs away",
    },
    {
      icon: "schedule",
      title: "Schedule",
      detail: "Back-to-backs, rest, and travel load",
    },
    {
      icon: "context",
      title: "Context",
      detail: "Recent form and game situation",
    },
    {
      icon: "edge",
      title: "Who has the edge",
      detail: "Who can exploit the other’s weak spots",
    },
    {
      icon: "comment",
      title: "Evidence notes",
      detail: "Short reads backed by numbers",
    },
  ],
  cta: "Explore Pro",
};

export function proInsightGateCopy(language: "ja" | "en"): ProInsightGateCopy {
  return language === "ja" ? JA : EN;
}
