import type { EventNoticeContent } from "./eventNoticeTypes";

/** FIFA WC 2026 グループステージ — ユニフォームチャレンジ（一覧合成） */
export const WC_UNIFORM_CHALLENGE_NOTICE: EventNoticeContent = {
  id: "wc-uniform-challenge-2026",
  i18nKey: "wcUniformChallenge",
  tag: "イベント",
  title: "ワールドカップ/ユニフォームチャレンジ",
  description:
    "対象：ワールドカップ グループステージ\n\nグループステージの総合得点1位のユーザーにワールドカップ優勝国のジャージをプレゼント\n\n1位のユーザーにはこちらからメールを送ります",
  period: "2026 FIFA World Cup グループステージ",
  target: "ワールドカップ グループステージ",
  reward: "ワールドカップ優勝国のジャージ",
  listInAnnouncements: true,
  showModal: true,
  pinned: true,
  postedAtMs: Date.UTC(2026, 5, 13, 0, 0, 0),
  heroImageURL: "/world cup/r1630843_1296x729_16-9.jpg",
};
