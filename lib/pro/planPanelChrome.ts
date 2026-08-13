/**
 * プラン状況・変更パネル用の角切り（chamfer）トークン
 * 丸角でも直角パネルでもなく、左上＋右下をカットしたサイバー枠。
 */

/** パネル本体 — 左上・右下 12px カット */
export const PLAN_PANEL_CHAMFER_CLIP =
  "polygon(12px 0%, 100% 0%, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0% 100%, 0% 12px)";

/** 内側セクション — やや浅め */
export const PLAN_SECTION_CHAMFER_CLIP =
  "polygon(8px 0%, 100% 0%, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0% 100%, 0% 8px)";

/** CTA — 斜めカット（サブスク購入ボタンとは別系統の角） */
export const PLAN_CTA_SLANT_CLIP =
  "polygon(14px 0%, 100% 0%, calc(100% - 14px) 100%, 0% 100%)";

export const PLAN_PANEL_CUT_PX = 12;
export const PLAN_CTA_SLANT_PX = 14;
