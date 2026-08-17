/**
 * Free が PRO LEAGUE を開いたときのゲート文言（Report ゲートと同型）
 */

export type ProLeagueGateBullet = {
  icon: "swords" | "trophy" | "grid" | "users" | "sparkles";
  title: string;
  detail: string;
};

export type ProLeagueGateCopy = {
  eyebrow: string;
  title: string;
  body: string;
  bullets: readonly ProLeagueGateBullet[];
  cta: string;
  dismiss: string;
  backToPickUp: string;
};

export function proLeagueGateCopy(language: "ja" | "en"): ProLeagueGateCopy {
  if (language === "en") {
    return {
      eyebrow: "PRO LEAGUE",
      title: "PRO LEAGUE is Pro-only",
      body: "Compete across every game. View and join require a Pro plan.",
      bullets: [
        {
          icon: "swords",
          title: "All games",
          detail: "Regular-season rankings on every ranking-eligible game",
        },
        {
          icon: "trophy",
          title: "Weekly / Monthly / Season",
          detail: "Same periods as Pick Up, Pro competitors only",
        },
        {
          icon: "grid",
          title: "Score / Win% / Scorer / Upset",
          detail: "Full metric tabs, Pro board atmosphere",
        },
        {
          icon: "users",
          title: "Pro-only standings",
          detail: "Free users are not listed or shown the real board",
        },
        {
          icon: "sparkles",
          title: "Your history still counts",
          detail: "Stats accrue while Free; after Pro you join with that history",
        },
      ],
      cta: "See Pro",
      dismiss: "Close",
      backToPickUp: "Back to Pick Up",
    };
  }
  return {
    eyebrow: "PRO LEAGUE",
    title: "PRO LEAGUE は Pro 限定です",
    body: "全試合の成績で競うリーグです。閲覧・参加には Pro プランが必要です。",
    bullets: [
      {
        icon: "swords",
        title: "全試合対象",
        detail: "ランキング対象の試合すべてで順位を競います",
      },
      {
        icon: "trophy",
        title: "週間 / 月間 / シーズン",
        detail: "Pick Up と同じ期間構成。対戦相手は Pro のみ",
      },
      {
        icon: "grid",
        title: "総合 / 勝率 / SCORER / UPSET",
        detail: "指標タブ一式。PRO LEAGUE 専用の雰囲気",
      },
      {
        icon: "users",
        title: "掲載・閲覧は Pro のみ",
        detail: "Free ユーザーは実ランキングを見られません",
      },
      {
        icon: "sparkles",
        title: "Free 中の成績も残る",
        detail: "Pro 加入後は、それまでの集計を引き継いで参加できます",
      },
    ],
    cta: "Pro を見る",
    dismiss: "とじる",
    backToPickUp: "Pick Up に戻る",
  };
}

export const PRO_LEAGUE_GATE_CTA_HREF = "/mobile/pro/subscribe";
