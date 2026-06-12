import type { EventNoticeContent } from "./eventNoticeTypes";

export const LEADERBOARDS_GROUPS_INTRO_EVENT: EventNoticeContent = {
  id: "leaderboards-groups-intro-2026",
  tag: "新機能",
  tagEn: "NEW",
  title: "グループで友達と競おう",
  titleEn: "Compete with friends in groups",
  description:
    "リーダーボードにグループ機能が追加されました。\nグループを作って友達を招待し、仲間内でランキングを競い合おう。",
  descriptionEn:
    "Groups are now on Leaderboards.\nCreate a group, invite friends, and battle for the top spot together.",
  period: "リーダーボードからいつでも",
  periodEn: "Anytime from Leaderboards",
  target: "グループを作成するか、招待コードで参加",
  targetEn: "Create a group or join with an invite code",
  listInAnnouncements: false,
  showModal: false,
  pinned: false,
  postedAtMs: Date.UTC(2026, 5, 12),
  heroImageURL: "/event/eventheader.png",
};
