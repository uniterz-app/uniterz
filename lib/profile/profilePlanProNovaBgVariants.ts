/** PRO 背景 — 新世代 FX（dev / 次回候補） */

export type ProfilePlanProNovaBgVariant =
  | "nova-neural"
  | "nova-scan"
  | "nova-cascade"
  | "nova-plasma"
  | "nova-shockwave"
  | "nova-facet"
  | "nova-field"
  | "nova-bloom";

export type ProfilePlanProNovaBgMeta = {
  id: ProfilePlanProNovaBgVariant;
  label: string;
  tag: string;
  description: string;
  /** スウォッチ用ヒント */
  swatch: string;
};

export const PROFILE_PLAN_PRO_NOVA_BG_VARIANTS: ProfilePlanProNovaBgMeta[] = [
  {
    id: "nova-neural",
    label: "Neural Mesh",
    tag: "シナプス",
    description: "ノードが脈動するニューラルネット。AI コア HUD。",
    swatch: "linear-gradient(135deg, #0c1929, #22d3ee 40%, #7c3aed 75%, #020617)",
  },
  {
    id: "nova-scan",
    label: "Holo Scan",
    tag: "走査",
    description: "水平スキャンビームが面を走査。ホログラム解析。",
    swatch: "linear-gradient(180deg, #020617, #06b6d4 48%, #020617)",
  },
  {
    id: "nova-cascade",
    label: "Data Cascade",
    tag: "滝",
    description: "縦に流れるデータ列。サイバー滝・パララックス。",
    swatch: "linear-gradient(180deg, #030712, #0891b2, #6366f1, #030712)",
  },
  {
    id: "nova-plasma",
    label: "Plasma Core",
    tag: "プラズマ",
    description: "有機的にうねるプラズマ球。エネルギーコア。",
    swatch: "radial-gradient(circle at 40% 35%, #f0abfc, #7c3aed 45%, #020617)",
  },
  {
    id: "nova-shockwave",
    label: "Shockwave",
    tag: "衝撃波",
    description: "複数点から広がるソフトな衝撃波リング。",
    swatch: "radial-gradient(circle, rgba(34,211,238,0.5) 0%, transparent 55%), #050810",
  },
  {
    id: "nova-facet",
    label: "Crystal Facet",
    tag: "結晶",
    description: "回転するプリズム面。屈折光のキラキラ。",
    swatch: "conic-gradient(from 45deg, #22d3ee, #a78bfa, #ec4899, #22d3ee)",
  },
  {
    id: "nova-field",
    label: "Field Lines",
    tag: "磁場",
    description: "うねる磁場線。科学 viz × サイバー。",
    swatch: "linear-gradient(90deg, transparent, #67e8f9 50%, transparent)",
  },
  {
    id: "nova-bloom",
    label: "Corner Bloom",
    tag: "開花",
    description: "四隅から呼吸するライトブルーム。ステージ照明。",
    swatch: "radial-gradient(circle at 0% 0%, #22d3ee, transparent 50%), radial-gradient(circle at 100% 100%, #c084fc, transparent 50%), #030508",
  },
];

export const PROFILE_PLAN_PRO_NOVA_BG_DEFAULT: ProfilePlanProNovaBgVariant =
  "nova-neural";

export function isProfilePlanProNovaBgVariant(
  id: string
): id is ProfilePlanProNovaBgVariant {
  return PROFILE_PLAN_PRO_NOVA_BG_VARIANTS.some((v) => v.id === id);
}
