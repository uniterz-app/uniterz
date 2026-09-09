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
  /** ゲート下に出す実画面サンプルの見出し */
  exampleLabel: string;
};

const JA: ProInsightGateCopy = {
  eyebrow: "PRO INSIGHT",
  title: "試合の読み解きは PRO INSIGHT",
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
      title: "プレイヤー",
      detail: "型×相手穴・直近フォームの選手読み",
    },
  ],
  cta: "Explore Pro",
  exampleLabel: "表示イメージ（例）",
};

const EN: ProInsightGateCopy = {
  eyebrow: "PRO INSIGHT",
  title: "Match reads unlock with PRO INSIGHT",
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
      title: "Players",
      detail: "Fit vs opponent holes · last-10 form",
    },
  ],
  cta: "Explore Pro",
  exampleLabel: "What it looks like (example)",
};

export function proInsightGateCopy(language: "ja" | "en"): ProInsightGateCopy {
  return language === "ja" ? JA : EN;
}
