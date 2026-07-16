/** PRO 総合 1 位バッジ — デザイン案 */

export type ProfilePlanProApexRankVariant =
  | "hud-corner"
  | "slant-chip"
  | "hud-frame"
  | "readout"
  | "slash"
  | "glass-pill"
  | "crest"
  | "underline";

export type ProfilePlanProApexRankVariantMeta = {
  id: ProfilePlanProApexRankVariant;
  label: string;
  tag: string;
  description: string;
};

export const PROFILE_PLAN_PRO_APEX_RANK_VARIANTS: ProfilePlanProApexRankVariantMeta[] =
  [
    {
      id: "readout",
      label: "Readout",
      tag: "本番",
      description: "RANK·01 の計器読み。ミニマルでプロ感。",
    },
    {
      id: "hud-corner",
      label: "HUD Corner",
      tag: "旧",
      description: "隅ブラケット案（不採用）。",
    },
    {
      id: "slant-chip",
      label: "Slant Chip",
      tag: "斜め",
      description: "ランキングタブ系のスラントチップ。塗りで主張。",
    },
    {
      id: "hud-frame",
      label: "HUD Frame",
      tag: "枠",
      description: "閉じた細枠＋微ガラス。コーナーが浮かない。",
    },
    {
      id: "slash",
      label: "Slash",
      tag: "TRON",
      description: "/ 01 / スラッシュ装飾。シアン発光。",
    },
    {
      id: "glass-pill",
      label: "Glass Pill",
      tag: "ガラス",
      description: "左アクセントバー付きガラスピル。",
    },
    {
      id: "crest",
      label: "Crest",
      tag: "紋章",
      description: "シェブロンで挟んだ紋章風。",
    },
    {
      id: "underline",
      label: "Underline",
      tag: "タイポ",
      description: "枠なし。大きい数字＋グロー下線のみ。",
    },
  ];
