/**
 * プラン状況・変更パネル用枠トークン
 * 直角の四角パネル（角切りなし）。
 */

/** パネル本体 — 直角矩形 */
export const PLAN_PANEL_CHAMFER_CLIP = "none";

/** 内側セクション — 直角矩形 */
export const PLAN_SECTION_CHAMFER_CLIP = "none";

/** CTA — 斜めカット（サブスク購入ボタンとは別系統の角） */
export const PLAN_CTA_SLANT_CLIP =
  "polygon(14px 0%, 100% 0%, calc(100% - 14px) 100%, 0% 100%)";

export const PLAN_PANEL_CUT_PX = 0;
export const PLAN_CTA_SLANT_PX = 14;
