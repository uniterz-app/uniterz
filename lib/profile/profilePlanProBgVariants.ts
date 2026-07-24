/** PRO カード背景バリエーション */

import type { ProfilePlanProBeastBgVariant } from "./profilePlanProBeastBgVariants";
import type { ProfilePlanProCosmosBgVariant } from "./profilePlanProCosmosBgVariants";
import type { ProfilePlanProFormBgVariant } from "./profilePlanProFormBgVariants";
import type { ProfilePlanProGeoBgVariant } from "./profilePlanProGeoBgVariants";
import type { ProfilePlanProLabBgVariant } from "./profilePlanProLabBgVariants";
import type { ProfilePlanProMoodBgVariant } from "./profilePlanProMoodBgVariants";
import type { ProfilePlanProNovaBgVariant } from "./profilePlanProNovaBgVariants";
import type { ProfilePlanProScaleBgVariant } from "./profilePlanProScaleBgVariants";

export type ProfilePlanProBgVariant =
  | "atmos"
  | "tunnel"
  | "parallax"
  | "depth-field"
  | "sonar"
  | "orbit"
  | "light-shaft"
  | "stack"
  | "wormhole"
  | "hex-depth"
  | "starfield"
  | "isometric"
  | "topography"
  | "wire-cage"
  | "circuit"
  | "cloud-volume"
  | "aurora"
  | "holo"
  | "grain"
  | "prism"
  | "mesh"
  | ProfilePlanProMoodBgVariant
  | ProfilePlanProNovaBgVariant
  | ProfilePlanProGeoBgVariant
  | ProfilePlanProScaleBgVariant
  | ProfilePlanProBeastBgVariant
  | ProfilePlanProFormBgVariant
  | ProfilePlanProCosmosBgVariant
  | ProfilePlanProLabBgVariant;

/** 本番 PRO プロフィール背景 — 確定: Atmos（疎な六角 + 微細 HUD） */
export const PROFILE_PLAN_PRO_BG_DEFAULT: ProfilePlanProBgVariant = "atmos";

export type ProfilePlanProBgVariantMeta = {
  id: ProfilePlanProBgVariant;
  label: string;
  tag: string;
  description: string;
  depth?: boolean;
  /** dev プレビュー — 追加案バッジ */
  isNew?: boolean;
};

export const PROFILE_PLAN_PRO_BG_VARIANTS: ProfilePlanProBgVariantMeta[] = [
  {
    id: "atmos",
    label: "Atmos Nebula",
    tag: "宇宙霧",
    description: "青紫ネビュラ＋疎な六角＋微細HUD。奥行きのある高級サイバー。",
    depth: true,
  },
  {
    id: "scale-mamba",
    label: "Black Mamba",
    tag: "マンバ",
    description:
      "ガンメタル〜オリーブの平滑鱗＋微細 HUD。爬虫類スキン候補（dev）。",
    depth: true,
    isNew: true,
  },
  {
    id: "tunnel",
    label: "Void Tunnel",
    tag: "透視",
    description: "手前から奥へ流れる透視グリッド。",
    depth: true,
  },
  {
    id: "parallax",
    label: "Parallax Layers",
    tag: "多層",
    description: "遠・中・近の3層が異なる速度で動く。",
    depth: true,
  },
  {
    id: "depth-field",
    label: "Depth Field",
    tag: "粒子",
    description: "大小の光点が奥行き別に漂う。",
    depth: true,
  },
  {
    id: "sonar",
    label: "Sonar Rings",
    tag: "レーダー",
    description: "中心から広がる同心円＋スイープ。戦術 HUD。",
    depth: true,
  },
  {
    id: "orbit",
    label: "Orbital Rings",
    tag: "軌道",
    description: "楕円リングが回転。惑星軌道の立体感。",
    depth: true,
  },
  {
    id: "light-shaft",
    label: "Light Shaft",
    tag: "光芒",
    description: "上から降り注ぐボリュメトリック光。神聖感。",
    depth: true,
  },
  {
    id: "stack",
    label: "Glass Stack",
    tag: "層板",
    description: "水平ガラス板が奥に積層。立体ステージ感。",
    depth: true,
  },
  {
    id: "wormhole",
    label: "Wormhole",
    tag: "渦",
    description: "中央へ吸い込まれる螺旋トンネル。",
    depth: true,
  },
  {
    id: "hex-depth",
    label: "Hex Depth",
    tag: "六角",
    description: "六角グリッドの透視床。トンネルと別テイスト。",
    depth: true,
  },
  {
    id: "starfield",
    label: "Star Warp",
    tag: "3D ワープ",
    description: "手前から奥へ流れる星屑。ハイパースペース感。",
    depth: true,
    isNew: true,
  },
  {
    id: "isometric",
    label: "Isometric",
    tag: "3D 斜め",
    description: "アイソメトリック菱形グリッド。RTS マップ風の立体床。",
    depth: true,
    isNew: true,
  },
  {
    id: "topography",
    label: "Topo Map",
    tag: "3D 地形",
    description: "等高線が奥行きで重なる。地形 HUD。",
    depth: true,
    isNew: true,
  },
  {
    id: "wire-cage",
    label: "Wire Cage",
    tag: "3D 球体",
    description: "回転するワイヤーフレーム球。司令室コア。",
    depth: true,
    isNew: true,
  },
  {
    id: "circuit",
    label: "Circuit Board",
    tag: "3D 基板",
    description: "透視した回路基板。ノードが脈動する。",
    depth: true,
    isNew: true,
  },
  {
    id: "cloud-volume",
    label: "Volume Cloud",
    tag: "体積光",
    description: "厚みのある雲状グロー。平面オーロラより立体。",
    isNew: true,
  },
  {
    id: "aurora",
    label: "Aurora",
    tag: "平面",
    description: "シアン・紫の光が呼吸する。",
  },
  {
    id: "holo",
    label: "Holographic",
    tag: "平面",
    description: "斜めに流れるホログラムシマー。",
  },
  {
    id: "grain",
    label: "Film Grain",
    tag: "平面",
    description: "フィルムグレイン＋微パルス。",
  },
  {
    id: "prism",
    label: "Chromatic",
    tag: "平面",
    description: "隅に RGB 色収差グロー。",
  },
  {
    id: "mesh",
    label: "Mesh Blob",
    tag: "平面",
    description: "ぼかしメッシュグラデ。",
  },
];

export const PROFILE_PLAN_PRO_DEPTH_VARIANTS = PROFILE_PLAN_PRO_BG_VARIANTS.filter(
  (v) => v.depth
);

export const PROFILE_PLAN_PRO_FLAT_VARIANTS = PROFILE_PLAN_PRO_BG_VARIANTS.filter(
  (v) => !v.depth
);

/** dev — 追加背景案（3D / 別テイスト） */
export const PROFILE_PLAN_PRO_BG_NEW_VARIANTS = PROFILE_PLAN_PRO_BG_VARIANTS.filter(
  (v) => v.isNew
);

/** dev — Mobile で映える WOW 背景（非 PRO 驚き用） */
export const PROFILE_PLAN_PRO_MOBILE_WOW_VARIANTS: ProfilePlanProBgVariant[] = [
  "starfield",
  "wire-cage",
  "wormhole",
  "sonar",
  "circuit",
  "light-shaft",
];

export function isProfilePlanProDepthVariant(
  variant: ProfilePlanProBgVariant
): boolean {
  return PROFILE_PLAN_PRO_DEPTH_VARIANTS.some((v) => v.id === variant);
}

/** dev プレビュー — 3D / 奥行き系 */
export const PROFILE_PLAN_PRO_BG_PREVIEW_3D: ProfilePlanProBgVariant[] = [
  "starfield",
  "isometric",
  "topography",
  "wire-cage",
  "circuit",
  "wormhole",
  "tunnel",
  "hex-depth",
  "stack",
  "orbit",
  "sonar",
];

/** dev プレビュー — 六角レイアウト */
export const PROFILE_PLAN_PRO_BG_PREVIEW_HEX: ProfilePlanProBgVariant[] = [
  "geo-hex-layout-honeycomb",
  "geo-hex-layout-stagger",
  "geo-hex-layout-radial",
  "geo-hex-layout-grid",
  "geo-hex-layout-corners",
  "geo-hex-layout-corners-l",
  "geo-hex-layout-corners-quad",
  "geo-hex-layout-spine",
];

/** dev プレビュー — 平面幾何学 */
export const PROFILE_PLAN_PRO_BG_PREVIEW_GEOMETRIC: ProfilePlanProBgVariant[] = [
  "geo-lattice",
  "geo-diamond",
  "geo-triangle",
  "geo-hex",
  "geo-crosshatch",
  "geo-stipple",
];

/** dev プレビュー — パララックス多層 */
export const PROFILE_PLAN_PRO_BG_PREVIEW_PARALLAX: ProfilePlanProBgVariant[] = [
  "parallax",
  "depth-field",
];

/** dev プレビュー — 平面アニメ（呼吸・シマー・グロー） */
export const PROFILE_PLAN_PRO_BG_PREVIEW_ANIMATED: ProfilePlanProBgVariant[] = [
  "aurora",
  "holo",
  "grain",
  "prism",
  "mesh",
  "cloud-volume",
  "light-shaft",
];

export type ProfilePlanProBgPreviewCategory =
  | "mood"
  | "geometric"
  | "3d"
  | "parallax"
  | "animated";

export const PROFILE_PLAN_PRO_BG_PREVIEW_CATEGORIES: {
  id: ProfilePlanProBgPreviewCategory;
  label: string;
  description: string;
}[] = [
  {
    id: "mood",
    label: "ムード",
    description: "色味・雰囲気が違う 8 案",
  },
  {
    id: "geometric",
    label: "幾何学",
    description: "平面パターン — 3D なし",
  },
  {
    id: "3d",
    label: "3D",
    description: "透視・ワープ・立体グリッド",
  },
  {
    id: "parallax",
    label: "パララックス",
    description: "多層が異なる速度で動く",
  },
  {
    id: "animated",
    label: "アニメ",
    description: "呼吸・シマー・体積光",
  },
];

export function getProfilePlanProBgVariantMeta(
  id: ProfilePlanProBgVariant
): ProfilePlanProBgVariantMeta | undefined {
  return PROFILE_PLAN_PRO_BG_VARIANTS.find((v) => v.id === id);
}

export function resolveProfilePlanProBgLabel(id: ProfilePlanProBgVariant): string {
  return getProfilePlanProBgVariantMeta(id)?.label ?? id;
}

/** Native 奥行きアニメ周期 */
export const PROFILE_PLAN_PRO_BG_DEPTH_TIMING = {
  parallaxMs: 8000,
  tunnelMs: 5000,
  depthFieldMs: 9000,
  sonarMs: 6000,
  orbitMs: 12000,
  wormholeMs: 8000,
  starfieldMs: 3500,
  isometricMs: 6000,
  topographyMs: 10000,
  wireCageMs: 14000,
  circuitMs: 4500,
} as const;
