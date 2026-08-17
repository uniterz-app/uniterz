/** PRO 背景 — 幾何フォーム（採用比較用） */

export type ProfilePlanProFormBgVariant =
  | "form-hexveil"
  | "form-diamondgrid"
  | "form-chevronedge"
  | "form-trimesh"
  | "form-strata"
  | "form-prism"
  | "form-constgrid"
  | "form-arccircuit"
  | "form-monolith"
  | "form-lattice"
  | "form-radiant"
  | "form-shard"
  | "form-neodamier"
  | "form-offsetcheck"
  | "form-fractal"
  | "form-isocubes";

export type ProfilePlanProFormBgMeta = {
  id: ProfilePlanProFormBgVariant;
  label: string;
  tag: string;
  description: string;
  swatch: string;
};

export const PROFILE_PLAN_PRO_FORM_BG_VARIANTS: ProfilePlanProFormBgMeta[] = [
  {
    id: "form-hexveil",
    label: "Hex Veil",
    tag: "六角ベール",
    description: "六角形を薄く重ねる。定番でサイバー感が強い。",
    swatch: "linear-gradient(145deg, #040810, #0a2030 40%, #22d3ee55 58%, #010508)",
  },
  {
    id: "form-diamondgrid",
    label: "Diamond Grid",
    tag: "菱形格子",
    description: "菱形の連続。ラグジュアリー感が出しやすい。",
    swatch: "linear-gradient(148deg, #080604, #1a1408 38%, #d4a01755 58%, #040302)",
  },
  {
    id: "form-chevronedge",
    label: "Chevron Edge",
    tag: "Vエッジ",
    description: "V字の反復。シャープでスポーティ。",
    swatch: "linear-gradient(155deg, #06080a, #1a1e24 40%, #94a3b866 58%, #030406)",
  },
  {
    id: "form-trimesh",
    label: "Triangle Mesh",
    tag: "三角メッシュ",
    description: "三角ポリゴン。未来感が強い。",
    swatch: "linear-gradient(150deg, #04060c, #1a1030 40%, #a78bfa55 58%, #020408)",
  },
  {
    id: "form-strata",
    label: "Linear Strata",
    tag: "層線",
    description: "細い平行線の層。金属感・上品さが出る。",
    swatch: "linear-gradient(180deg, #0a0c10, #3f4654 45%, #c8d0dc44 70%, #050608)",
  },
  {
    id: "form-prism",
    label: "Prism Facet",
    tag: "プリズム",
    description: "宝石のカット面のような多面体。かなり高級寄り。",
    swatch: "linear-gradient(145deg, #020810, #0a2030 35%, #22d3ee55 50%, #e879f944 65%, #010508)",
  },
  {
    id: "form-constgrid",
    label: "Constellation Grid",
    tag: "星座格子",
    description: "点と線をつないだ星座風。知的で上品。",
    swatch: "linear-gradient(150deg, #03060c, #0a1830 42%, #7dd3fc55 60%, #020408)",
  },
  {
    id: "form-arccircuit",
    label: "Arc Circuit",
    tag: "弧回路",
    description: "円弧と細線の組み合わせ。HUD感が強い。",
    swatch: "linear-gradient(148deg, #040810, #0a1a2e 40%, #38bdf855 58%, #020508)",
  },
  {
    id: "form-monolith",
    label: "Monolith Blocks",
    tag: "モノリス",
    description: "長方形パネルを段差的に配置。重厚感あり。",
    swatch: "linear-gradient(145deg, #08090c, #1e2430 40%, #64748b55 58%, #040506)",
  },
  {
    id: "form-lattice",
    label: "Lattice Frame",
    tag: "格子枠",
    description: "格子状フレーム。UIとの相性が良い。",
    swatch: "linear-gradient(145deg, #050810, #0a2030 40%, #67e8f655 58%, #010508)",
  },
  {
    id: "form-radiant",
    label: "Radiant Rings",
    tag: "放射環",
    description: "同心円や半円を薄く配置。中心に視線を集めやすい。",
    swatch: "linear-gradient(148deg, #02060c, #0a1528 45%, #60a5fa55 65%, #010408)",
  },
  {
    id: "form-shard",
    label: "Shard Glass",
    tag: "破片ガラス",
    description: "割れたガラスのような鋭い面構成。攻撃的。",
    swatch: "linear-gradient(155deg, #0a0408, #1a0a18 38%, #f43f5e55 58%, #050204)",
  },
  {
    id: "form-neodamier",
    label: "Neo Damier",
    tag: "ネオダミエ",
    description: "市松を崩した幾何学版。高級ブランド感を出しやすい。",
    swatch: "linear-gradient(145deg, #04080c, #0a1828 35%, #22d3ee44 50%, #1e293b66 70%, #020508)",
  },
  {
    id: "form-offsetcheck",
    label: "Offset Check",
    tag: "オフセット市松",
    description: "ずらした正方形。落ち着いていて使いやすい。",
    swatch: "linear-gradient(148deg, #06080c, #1a2030 40%, #94a3b855 58%, #030508)",
  },
  {
    id: "form-fractal",
    label: "Fractal Weave",
    tag: "フラクタル織",
    description: "細かな反復パターン。見ると複雑だが主張しすぎない。",
    swatch: "linear-gradient(150deg, #05060a, #12161e 42%, #a78bfa44 60%, #030406)",
  },
  {
    id: "form-isocubes",
    label: "Isometric Cubes",
    tag: "立方体",
    description: "立方体が並ぶような錯視模様。立体感が出る。",
    swatch: "linear-gradient(145deg, #040810, #0c1a28 40%, #38bdf855 58%, #020508)",
  },
];

export const PROFILE_PLAN_PRO_FORM_BG_DEFAULT: ProfilePlanProFormBgVariant =
  "form-hexveil";

export function isProfilePlanProFormBgVariant(
  id: string
): id is ProfilePlanProFormBgVariant {
  return PROFILE_PLAN_PRO_FORM_BG_VARIANTS.some((v) => v.id === id);
}
