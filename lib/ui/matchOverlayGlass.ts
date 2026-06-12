/** ガラス面の塗り＋ブラー（枠線・角丸は呼び出し側） */
export const CYBER_GLASS_FILL =
  "bg-[linear-gradient(180deg,rgba(255,255,255,0.07)_0%,rgba(255,255,255,0.03)_42%,rgba(255,255,255,0.018)_100%),linear-gradient(180deg,rgba(8,8,8,0.12)_0%,rgba(8,8,8,0.16)_100%)] backdrop-blur-md";

export const CYBER_GLASS_SHADOW =
  "shadow-[0_14px_36px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.14),inset_0_-1px_0_rgba(255,255,255,0.05)]";

/** プロフィール・ブラケットマーケット等のカード共通ガラス面 */
export const CYBER_GLASS_SURFACE = [
  "border border-white/10",
  CYBER_GLASS_FILL,
  CYBER_GLASS_SHADOW,
].join(" ");

export const CYBER_GLASS_PANEL = `relative overflow-hidden rounded-2xl ${CYBER_GLASS_SURFACE}`;

export const CYBER_GLASS_PANEL_XL = `relative overflow-hidden rounded-xl ${CYBER_GLASS_SURFACE}`;

export const CYBER_GLASS_PANEL_SM = `relative overflow-hidden rounded-lg ${CYBER_GLASS_SURFACE} md:rounded-xl`;

/**
 * MatchCard（予想オーバーレイ内・非 dense）と同じガラス枠。
 * リザルト詳細オーバーレイで見た目を揃えるために使用。
 */
export const MATCH_OVERLAY_GLASS_PANEL = CYBER_GLASS_PANEL;

/** 予想オーバーレイ背面（一覧の上に重ねる暗転＋ぼかし） */
export const PREDICT_OVERLAY_BACKDROP =
  "bg-black/40 backdrop-blur-md backdrop-saturate-150";

/** 予想オーバーレイ：方眼なし・backdrop-blur で背面をぼかすガラス面 */
export const PREDICT_OVERLAY_BLUR_GLASS = `rounded-2xl ${CYBER_GLASS_SURFACE}`;

/** 予想オーバーレイ MatchCard（旧）：半透明面のみ（背面は暗転済みのため blur なし） */
export const PREDICT_OVERLAY_MATCH_CARD_GLASS = [
  "rounded-2xl",
  "border border-white/14",
  "bg-[linear-gradient(172deg,rgba(18,24,32,0.72)_0%,rgba(12,16,22,0.58)_42%,rgba(8,10,14,0.48)_100%)]",
  "shadow-[0_14px_40px_rgba(0,0,0,0.44),inset_0_1px_0_rgba(255,255,255,0.18),inset_0_-1px_0_rgba(255,255,255,0.05)]",
].join(" ");

/**
 * 予想オーバーレイ内フォーム（タブパネル・スコア入力）。
 * 背面は暗転済みのため backdrop-blur を使わず、一覧の方眼がチラつかない不透明寄りの面にする。
 */
export const PREDICT_OVERLAY_FORM_PANEL = [
  "rounded-xl border border-white/12",
  "bg-[linear-gradient(172deg,rgba(14,18,26,0.92)_0%,rgba(10,14,20,0.88)_45%,rgba(8,10,16,0.85)_100%)]",
  "shadow-[0_8px_22px_rgba(0,0,0,0.38),inset_0_1px_0_rgba(255,255,255,0.10)]",
].join(" ");

/** プレイオフブラケット外枠（スケジュールの予想オーバーレイ背後に近い透明＋ブラー） */
export const PLAYOFF_BRACKET_PANEL =
  "rounded-[24px] border border-white/12 bg-black/35 backdrop-blur-md shadow-[0_14px_34px_rgba(0,0,0,0.42)]";
