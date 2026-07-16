/** PRO 背景 — 平面幾何学パターン（3D なし） */

import type { ProfilePlanProHexBgVariant } from "./profilePlanProHexBgVariants";
import { isProfilePlanProHexBgVariant } from "./profilePlanProHexBgVariants";

export type ProfilePlanProGeoBgVariant =
  | "geo-lattice"
  | "geo-diamond"
  | "geo-triangle"
  | "geo-hex"
  | "geo-crosshatch"
  | "geo-stipple"
  | ProfilePlanProHexBgVariant;

export type ProfilePlanProGeoBgMeta = {
  id: ProfilePlanProGeoBgVariant;
  label: string;
  tag: string;
  description: string;
  swatch: string;
};

export const PROFILE_PLAN_PRO_GEO_BG_VARIANTS: ProfilePlanProGeoBgMeta[] = [
  {
    id: "geo-lattice",
    label: "Lattice Grid",
    tag: "方眼",
    description: "等間隔の直交グリッド。HUD の基礎テクスチャ。",
    swatch: "linear-gradient(180deg, #050810, #0a1628)",
  },
  {
    id: "geo-diamond",
    label: "Diamond Quilt",
    tag: "菱形",
    description: "45° の菱形タイル。キルト状の幾何学模様。",
    swatch: "linear-gradient(135deg, #060a12 25%, #0c1a2e 25%, #060a12 50%)",
  },
  {
    id: "geo-triangle",
    label: "Triangle Mesh",
    tag: "三角",
    description: "三角分割メッシュ。低ポリの平面タイル。",
    swatch: "linear-gradient(60deg, #050810 40%, #122035 40%, #050810 60%)",
  },
  {
    id: "geo-hex",
    label: "Hex Honeycomb",
    tag: "六角",
    description: "フラットな六角ハニカム。透視なしの蜂の巣。",
    swatch: "linear-gradient(165deg, #04080e, #0d2238 45%, #050810)",
  },
  {
    id: "geo-crosshatch",
    label: "Cross Hatch",
    tag: "ハッチ",
    description: "斜め線のクロスハッチ。図面・ブループリント風。",
    swatch: "repeating-linear-gradient(45deg, #050810, #0a1520 12px, #050810 24px)",
  },
  {
    id: "geo-stipple",
    label: "Dot Stipple",
    tag: "点描",
    description: "錯綜配置のドットグリッド。粒子状の幾何学。",
    swatch: "radial-gradient(circle at 30% 40%, rgba(34,211,238,0.35) 0%, transparent 45%), #050810",
  },
];

export const PROFILE_PLAN_PRO_GEO_BG_DEFAULT: ProfilePlanProGeoBgVariant =
  "geo-lattice";

export function isProfilePlanProGeoBgVariant(
  id: string
): id is ProfilePlanProGeoBgVariant {
  return (
    isProfilePlanProHexBgVariant(id) ||
    PROFILE_PLAN_PRO_GEO_BG_VARIANTS.some((v) => v.id === id)
  );
}
