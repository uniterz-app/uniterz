import type { EventNoticeContent } from "./eventNoticeTypes";

export const PLAYOFF_COMPETITION_EVENT: EventNoticeContent = {
  id: "playoff-competition-2026",
  tag: "イベント",
  title: "Playoff Competition",
  description:
    "Playoff Bracket と Playoff期間の総合得点でアプリ内1位のユーザーには今年のFMVPのユニフォームをプレゼント",
  period: "2026/03/23 〜 Playoff終了予定",
  target: "参加条件：ブラケットの提出と毎試合の予想",
  reward: "今年のFMVPのユニフォーム",
  listInAnnouncements: true,
  showModal: true,
  pinned: true,
  postedAtMs: Date.UTC(2026, 2, 23, 0, 0, 0),
  heroImageURL: "/event/eventheader.png",
};
