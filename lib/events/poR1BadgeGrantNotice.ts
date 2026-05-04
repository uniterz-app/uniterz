import type { EventNoticeContent } from "./eventNoticeTypes";

/** プレーオフ 1st ラウンド総合得点 TOP50 バッジ付与のお知らせ（モーダル1回・一覧合成） */
export const PO_R1_BADGE_GRANT_NOTICE: EventNoticeContent = {
  id: "po-r1-badge-grant-2026",
  tag: "お知らせ",
  tagEn: "News",
  title: "プレーオフ 1stラウンド バッジを付与しました",
  titleEn: "Playoffs 1st round — badges awarded",
  description:
    "1stラウンドの総合得点上位50名にバッジを付与しました。\n\n2ndラウンドでも総合得点上位50名にバッジが付与されます。",
  descriptionEn:
    "Badges have been awarded to the top 50 users by total points in the 1st round.\n\nThe 2nd round will also award badges to the top 50 by total points.",
  period: "2025-26 NBAプレーオフ",
  periodEn: "2025-26 NBA Playoffs",
  listInAnnouncements: true,
  showModal: true,
  pinned: true,
  postedAtMs: Date.UTC(2026, 4, 4, 12, 0, 0),
  heroImageURL: "/2026-Po-1stRound/1stRound-top50.png",
};
