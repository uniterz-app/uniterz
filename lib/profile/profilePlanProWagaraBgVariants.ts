/** PRO 背景 — 和柄×サイバー 10 案（dev プレビュー） */

export type ProfilePlanProWagaraBgVariant =
  | "wagara-seigaiha"
  | "wagara-asanoha"
  | "wagara-kikkou"
  | "wagara-yagasuri"
  | "wagara-shippou"
  | "wagara-sayagata"
  | "wagara-ichimatsu"
  | "wagara-karakusa"
  | "wagara-raimon"
  | "wagara-kumiko";

export type ProfilePlanProWagaraBgMeta = {
  id: ProfilePlanProWagaraBgVariant;
  label: string;
  tag: string;
  description: string;
  swatch: string;
};

export const PROFILE_PLAN_PRO_WAGARA_BG_VARIANTS: ProfilePlanProWagaraBgMeta[] = [
  {
    id: "wagara-seigaiha",
    label: "Seigaiha Tide",
    tag: "青海波",
    description: "重なる波紋の伝統文様。藍とシアンの静かな海。",
    swatch:
      "linear-gradient(155deg, #020a14, #0c4a6e66 42%, #38bdf888 62%, #01060c)",
  },
  {
    id: "wagara-asanoha",
    label: "Asanoha Grid",
    tag: "麻の葉",
    description: "麻の葉の星形格子。翡翠グリーンの成長と守護。",
    swatch:
      "linear-gradient(150deg, #020c08, #065f4666 40%, #34d39988 60%, #010604)",
  },
  {
    id: "wagara-kikkou",
    label: "Kikkou Armor",
    tag: "亀甲",
    description: "亀甲の二重六角。黄金の長寿と堅牢。",
    swatch:
      "linear-gradient(148deg, #0a0700, #78350f66 38%, #eab30888 58%, #050300)",
  },
  {
    id: "wagara-yagasuri",
    label: "Yagasuri Volley",
    tag: "矢絣",
    description: "破魔矢の矢羽根。緋色の必中と決意。",
    swatch:
      "linear-gradient(152deg, #0a0202, #7f1d1d66 40%, #f8717188 60%, #050101)",
  },
  {
    id: "wagara-shippou",
    label: "Shippou Rings",
    tag: "七宝",
    description: "円が無限に連なる七宝繋ぎ。紫の円満と縁。",
    swatch:
      "linear-gradient(150deg, #060210, #4c1d9566 40%, #c084fc88 60%, #030108)",
  },
  {
    id: "wagara-sayagata",
    label: "Sayagata Key",
    tag: "紗綾形",
    description: "卍崩しの鍵文様。白銀の不断長久。",
    swatch:
      "linear-gradient(155deg, #04060c, #33415566 42%, #e2e8f088 64%, #020408)",
  },
  {
    id: "wagara-ichimatsu",
    label: "Ichimatsu Board",
    tag: "市松",
    description: "市松の格子。青緑のモダンな反復。",
    swatch:
      "linear-gradient(148deg, #020c0b, #0f766e66 40%, #5eead488 60%, #010605)",
  },
  {
    id: "wagara-karakusa",
    label: "Karakusa Vine",
    tag: "唐草",
    description: "渦を巻く唐草の蔓。若葉色の生命力。",
    swatch:
      "linear-gradient(150deg, #060a02, #3f621266 40%, #a3e63588 60%, #030501)",
  },
  {
    id: "wagara-raimon",
    label: "Raimon Circuit",
    tag: "雷文",
    description: "稲妻の角渦・雷文。電光ブルーの回路的迷宮。",
    swatch:
      "linear-gradient(152deg, #020614, #1e3a8a66 40%, #60a5fa88 60%, #010310)",
  },
  {
    id: "wagara-kumiko",
    label: "Kumiko Lattice",
    tag: "組子",
    description: "組子細工の三角格子。琥珀色の職人技。",
    swatch:
      "linear-gradient(148deg, #0a0502, #7c2d1266 40%, #fb923c88 60%, #050301)",
  },
];

export function isProfilePlanProWagaraBgVariant(
  id: string
): id is ProfilePlanProWagaraBgVariant {
  return PROFILE_PLAN_PRO_WAGARA_BG_VARIANTS.some((v) => v.id === id);
}

export const PROFILE_PLAN_PRO_WAGARA_BG_DEFAULT: ProfilePlanProWagaraBgVariant =
  "wagara-seigaiha";
