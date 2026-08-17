/**
 * PRO 背景 — NEO LAB 10 案（dev プレビュー）
 * 既存の疎な線画タイル方式とは別系統。
 * SVG フィルタ（乱流・変位・鏡面光）による実写質感・光学現象・実験的表現。
 */

export type ProfilePlanProNeoBgVariant =
  | "neo-chrome"
  | "neo-iridis"
  | "neo-caustics"
  | "neo-plasma"
  | "neo-glitch"
  | "neo-flux"
  | "neo-shatter"
  | "neo-velocity"
  | "neo-ferro"
  | "neo-moire";

export type ProfilePlanProNeoBgMeta = {
  id: ProfilePlanProNeoBgVariant;
  label: string;
  tag: string;
  description: string;
  swatch: string;
};

export const PROFILE_PLAN_PRO_NEO_BG_VARIANTS: ProfilePlanProNeoBgMeta[] = [
  {
    id: "neo-chrome",
    label: "Liquid Chrome",
    tag: "液体金属",
    description: "等高線状の金属波紋。鏡面の稜線柄。",
    swatch:
      "linear-gradient(155deg, #0c121c, #64748b66 45%, #c8d6e899 60%, #0a1018)",
  },
  {
    id: "neo-iridis",
    label: "Oil Iridis",
    tag: "油膜",
    description: "指紋のような渦巻き干渉。円が重なる柄。",
    swatch:
      "linear-gradient(150deg, #0e0a16, #e879f955 35%, #22d3ee55 55%, #a3e63544 70%, #0a0612)",
  },
  {
    id: "neo-caustics",
    label: "Caustics",
    tag: "水中光",
    description: "水面の網目セル。光の格子柄。",
    swatch:
      "linear-gradient(160deg, #034550, #0e7490 50%, #b8f8ff88 65%, #023840)",
  },
  {
    id: "neo-plasma",
    label: "Plasma Storm",
    tag: "電離雲",
    description: "雲の輪郭と稲妻の線。嵐の線描柄。",
    swatch:
      "linear-gradient(150deg, #1a0a30, #7c3aed88 42%, #f5d0fe66 62%, #120822)",
  },
  {
    id: "neo-glitch",
    label: "Signal Break",
    tag: "信号断裂",
    description: "走査線と断裂バー。放送事故の格子柄。",
    swatch:
      "linear-gradient(180deg, #101018, #22d3ee44 40%, #f43f5e55 55%, #0c0c12)",
  },
  {
    id: "neo-flux",
    label: "Flux Field",
    tag: "磁力線",
    description: "密に流れる磁力線。シルクの流線柄。",
    swatch:
      "linear-gradient(155deg, #071428, #164e6388 45%, #818cf888 62%, #061020)",
  },
  {
    id: "neo-shatter",
    label: "Impact Glass",
    tag: "衝撃硝子",
    description: "放射クラックと破断リング。硝子の亀裂柄。",
    swatch:
      "linear-gradient(148deg, #0c1830, #33415588 45%, #e0f2fe88 60%, #0a1424)",
  },
  {
    id: "neo-velocity",
    label: "Velocity Trails",
    tag: "光跡",
    description: "平行に走るカーブ光跡。長時間露光の縞柄。",
    swatch:
      "linear-gradient(115deg, #140a1e, #f59e0b66 35%, #22d3ee66 55%, #ec489966 70%, #100818)",
  },
  {
    id: "neo-ferro",
    label: "Ferrofluid",
    tag: "磁性流体",
    description: "棘立つシルエットの連続。磁性流体の輪郭柄。",
    swatch:
      "linear-gradient(160deg, #0a1018, #1e293b 50%, #22d3ee55 65%, #080c12)",
  },
  {
    id: "neo-moire",
    label: "Moiré Bloom",
    tag: "干渉縞",
    description: "二重同心円の干渉。モアレの縞柄。",
    swatch:
      "linear-gradient(150deg, #0c1424, #164e63 45%, #e879f966 62%, #0a101c)",
  },
];

export function isProfilePlanProNeoBgVariant(
  id: string
): id is ProfilePlanProNeoBgVariant {
  return PROFILE_PLAN_PRO_NEO_BG_VARIANTS.some((v) => v.id === id);
}

export const PROFILE_PLAN_PRO_NEO_BG_DEFAULT: ProfilePlanProNeoBgVariant =
  "neo-chrome";
