/**
 * MatchCard（予想オーバーレイ内・非 dense）と同じガラス枠。
 * リザルト詳細オーバーレイで見た目を揃えるために使用。
 */
export const MATCH_OVERLAY_GLASS_PANEL =
  "rounded-2xl border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.03)_42%,rgba(255,255,255,0.018)_100%),linear-gradient(180deg,rgba(5,8,20,0.80)_0%,rgba(5,8,20,0.80)_100%)] backdrop-blur-xl shadow-[0_18px_44px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.20),inset_0_-1px_0_rgba(255,255,255,0.05)]";

/** プレイオフブラケット外枠（スケジュールの予想オーバーレイ背後に近い透明＋ブラー） */
export const PLAYOFF_BRACKET_PANEL =
  "rounded-[24px] border border-white/12 bg-black/35 backdrop-blur-md shadow-[0_14px_34px_rgba(0,0,0,0.42)]";
