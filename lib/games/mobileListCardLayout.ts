/**
 * モバイルの試合一覧（dense）とリザルト一覧でカード横幅を揃える（MatchCard と同一値）。
 */
export const MOBILE_LIST_CARD_MAX_W_CLASS = "max-w-[min(100%,20.5rem)]";

export const MOBILE_LIST_CARD_OUTER_CLASS =
  `mx-auto w-full ${MOBILE_LIST_CARD_MAX_W_CLASS}`;

/** リザルト一覧のカードのみやや広い（試合一覧の 20.5rem とは切り離し） */
export const MOBILE_RESULT_CARD_MAX_W_CLASS = "max-w-[min(100%,21.5rem)]";
export const MOBILE_RESULT_CARD_OUTER_CLASS =
  `mx-auto w-full ${MOBILE_RESULT_CARD_MAX_W_CLASS}`;

/** MatchCard dense 時の外枠（リザルト一覧 scheduleDense と共有） */
export const MOBILE_LIST_CARD_PANEL_DENSE =
  "rounded-2xl border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.07)_0%,rgba(255,255,255,0.025)_42%,rgba(255,255,255,0.015)_100%),linear-gradient(180deg,rgba(5,8,20,0.80)_0%,rgba(5,8,20,0.80)_100%)] backdrop-blur-xl shadow-[0_14px_34px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.18),inset_0_-1px_0_rgba(255,255,255,0.04)]";
