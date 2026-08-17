/** PRO 背景 — 色味・雰囲気バリエーション（dev / 次世代候補） */

export type ProfilePlanProMoodBgVariant =
  | "mood-sunset"
  | "mood-ember"
  | "mood-arctic"
  | "mood-toxic"
  | "mood-neon-pink"
  | "mood-deep-sea"
  | "mood-infrared"
  | "mood-lavender";

export type ProfilePlanProMoodBgMeta = {
  id: ProfilePlanProMoodBgVariant;
  label: string;
  tag: string;
  description: string;
  /** スウォッチ用ヒント色 */
  swatch: string;
};

export const PROFILE_PLAN_PRO_MOOD_BG_VARIANTS: ProfilePlanProMoodBgMeta[] = [
  {
    id: "mood-sunset",
    label: "Synth Sunset",
    tag: "夕焼けシンセ",
    description: "オレンジ・ローズ・紫。80年代サンセットドライブ。",
    swatch: "linear-gradient(135deg, #f97316, #fb7185, #7c3aed)",
  },
  {
    id: "mood-ember",
    label: "Crimson Ember",
    tag: "余燼",
    description: "深紅と琥珀。溶岩・炭火の熱気。",
    swatch: "linear-gradient(135deg, #991b1b, #ea580c, #450a0a)",
  },
  {
    id: "mood-arctic",
    label: "Frost Arctic",
    tag: "極寒",
    description: "アイスブルーとシルバー。極地・凍結 HUD。",
    swatch: "linear-gradient(135deg, #e0f2fe, #38bdf8, #1e293b)",
  },
  {
    id: "mood-toxic",
    label: "Acid Toxic",
    tag: "毒緑",
    description: "酸緑とネオンライム。バイオハザード lab。",
    swatch: "linear-gradient(135deg, #84cc16, #22c55e, #14532d)",
  },
  {
    id: "mood-neon-pink",
    label: "Neon District",
    tag: "ネオン街",
    description: "ホットピンク×フクシア。夜のサイバー街。",
    swatch: "linear-gradient(135deg, #ec4899, #d946ef, #6366f1)",
  },
  {
    id: "mood-deep-sea",
    label: "Abyss Glow",
    tag: "深海",
    description: "群青と生物発光ティール。深海探査。",
    swatch: "linear-gradient(135deg, #0c4a6e, #06b6d4, #020617)",
  },
  {
    id: "mood-infrared",
    label: "Heat Scan",
    tag: "赤外線",
    description: "熱分布マップ。赤〜黄のスキャンライン。",
    swatch: "linear-gradient(135deg, #7f1d1d, #f97316, #fef08a)",
  },
  {
    id: "mood-lavender",
    label: "Twilight Mist",
    tag: "薄暮",
    description: "ラベンダーと薄紫の霧。静かな黄昏。",
    swatch: "linear-gradient(135deg, #c4b5fd, #a78bfa, #312e81)",
  },
];

export const PROFILE_PLAN_PRO_MOOD_BG_DEFAULT: ProfilePlanProMoodBgVariant =
  "mood-sunset";

export function isProfilePlanProMoodBgVariant(
  id: string
): id is ProfilePlanProMoodBgVariant {
  return PROFILE_PLAN_PRO_MOOD_BG_VARIANTS.some((v) => v.id === id);
}
