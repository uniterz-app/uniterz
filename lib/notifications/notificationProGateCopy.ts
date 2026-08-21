/**
 * 通知設定で Free が Pro 行を触ったときのゲート文面
 */

export type NotificationProGateBullet = {
  title: string;
  detail: string;
};

export type NotificationProGateCopy = {
  eyebrow: string;
  title: string;
  body: string;
  priceLabel: string;
  price: string;
  period: string;
  trial: string;
  bullets: readonly NotificationProGateBullet[];
  cta: string;
  dismiss: string;
};

const JA: NotificationProGateCopy = {
  eyebrow: "PRO ONLY",
  title: "この通知は Pro 限定です",
  body: "欠場・先発・Insight など、予想を見直す材料だけが届きます。",
  priceLabel: "Monthly",
  price: "¥780",
  period: "/ 月",
  trial: "初回 7 日無料",
  bullets: [
    {
      title: "試合直前アラート",
      detail: "欠場・先発変更。締切は 60 / 10 分前も選べる",
    },
    {
      title: "Pro Insight",
      detail: "試合前の読み。結論が変わったときだけ通知",
    },
    {
      title: "PRO LEAGUE",
      detail: "全試合対象の Pro 限定ランキング",
    },
    {
      title: "My Rank Pro",
      detail: "TOP%、次の帯までの点数、進捗グラフ",
    },
    {
      title: "月次レポート",
      detail: "レーダー・クセ・相性のまとめが届く",
    },
  ],
  cta: "Pro を見る",
  dismiss: "とじる",
};

const EN: NotificationProGateCopy = {
  eyebrow: "PRO ONLY",
  title: "This alert is Pro-only",
  body: "Injury, lineup, and Insight — only when you should recheck a pick.",
  priceLabel: "Monthly",
  price: "¥780",
  period: "/ month",
  trial: "7-day free trial",
  bullets: [
    {
      title: "Pre-tipoff alerts",
      detail: "Injury / lineup. Deadline also unlocks 60 / 10 min",
    },
    {
      title: "Pro Insight",
      detail: "Match reads. Notify only when the conclusion changes",
    },
    {
      title: "PRO LEAGUE",
      detail: "Pro-only rankings across every game",
    },
    {
      title: "My Rank Pro",
      detail: "TOP%, points to the next band, longer graph",
    },
    {
      title: "Monthly report",
      detail: "Radar, habits, affinity — your monthly recap",
    },
  ],
  cta: "See Pro",
  dismiss: "Close",
};

export function notificationProGateCopy(
  language: "ja" | "en"
): NotificationProGateCopy {
  return language === "en" ? EN : JA;
}
