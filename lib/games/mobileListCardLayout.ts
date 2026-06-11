import { CYBER_GLASS_SURFACE } from "@/lib/ui/matchOverlayGlass";

/**
 * モバイルの試合一覧（dense）とリザルト一覧でカード横幅を揃える（MatchCard と同一値）。
 */
export const MOBILE_LIST_CARD_MAX_W_CLASS = "max-w-[min(100%,20.5rem)]";

export const MOBILE_LIST_CARD_OUTER_CLASS =
  `mx-auto w-full ${MOBILE_LIST_CARD_MAX_W_CLASS}`;

/** 試合予想オーバーレイ内の MatchCard：一覧用 max-w を外し、下のフォームと同じ横幅にする */
export const MOBILE_PREDICT_OVERLAY_CARD_OUTER_CLASS =
  "mx-auto w-full max-w-none";

/** リザルト一覧のカードのみやや広い（試合一覧の 20.5rem とは切り離し） */
export const MOBILE_RESULT_CARD_MAX_W_CLASS = "max-w-[min(100%,21.5rem)]";
export const MOBILE_RESULT_CARD_OUTER_CLASS =
  `mx-auto w-full ${MOBILE_RESULT_CARD_MAX_W_CLASS}`;

/** モバイルリザルト日付帯：カード（21.5rem）より少し広め */
export const MOBILE_RESULT_DAY_STRIP_MAX_W_CLASS =
  "max-w-[min(100%,23.75rem)]";
export const MOBILE_RESULT_DAY_STRIP_OUTER_CLASS =
  `mx-auto w-full ${MOBILE_RESULT_DAY_STRIP_MAX_W_CLASS}`;

/** MatchCard dense 時の外枠（リザルト一覧 scheduleDense と共有） */
export const MOBILE_LIST_CARD_PANEL_DENSE = `rounded-2xl ${CYBER_GLASS_SURFACE}`;

/**
 * Web 試合一覧カードのガラス枠（MatchCard 非 dense）。
 * 共通 CYBER_GLASS より枠線・ブラー・影を強めにして背景との分離を保つ。
 */
export const WEB_LIST_CARD_PANEL =
  "rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.02)_42%,rgba(255,255,255,0.012)_100%),linear-gradient(180deg,rgba(8,8,8,0.18)_0%,rgba(8,8,8,0.18)_100%)] backdrop-blur-xl shadow-[0_14px_36px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.12),inset_0_-1px_0_rgba(255,255,255,0.04)]";

/** カード内グリッド模様の不透明度（試合・リザルト一覧で共通） */
export const LIST_CARD_GRID_OVERLAY_OPACITY_CLASS = "opacity-[0.32]";

/** 一覧カードのガラス面（scheduleDense=true でモバイル dense パネル） */
export function listCardPanelClass(scheduleDense: boolean): string {
  return scheduleDense ? MOBILE_LIST_CARD_PANEL_DENSE : WEB_LIST_CARD_PANEL;
}
