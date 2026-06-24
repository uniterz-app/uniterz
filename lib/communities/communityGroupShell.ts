/** グループ詳細カードシェル — 一覧へヘッダー＋ヒーロー共通レイアウト */

import type { Language } from "@/lib/i18n/language";

/** 詳細カード外枠の角丸（Native px / Web は tailwind rounded-2xl 相当） */
export const COMMUNITY_GROUP_DETAIL_CARD_RADIUS = 16;

/** グループ詳細パネル内の水平パディング（TITLE / RANKING 揃え） */
export const COMMUNITY_GROUP_PANEL_PADDING_X = 14;

/** 一覧へ戻るラベル */
export function communityGroupListBackLabel(language: Language): string {
  return language === "en" ? "Back to list" : "一覧へ";
}

/** iOS Modal 内で insets.top が 0 のときのフォールバック */
export const COMMUNITY_GROUP_OVERLAY_TOP_INSET_IOS = 47;

/** Android ステータスバー高さのフォールバック */
export const COMMUNITY_GROUP_OVERLAY_TOP_INSET_ANDROID = 24;
