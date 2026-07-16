/** PRO 背景 — 整列六角レイアウト比較 */

import type { ProfilePlanProHexLayoutId } from "./profilePlanProHexLayoutPattern";

export type ProfilePlanProHexBgVariant = `geo-hex-layout-${ProfilePlanProHexLayoutId}`;

export type ProfilePlanProHexBgMeta = {
  id: ProfilePlanProHexBgVariant;
  layout: ProfilePlanProHexLayoutId;
  label: string;
  tag: string;
  description: string;
  swatch: string;
};

export const PROFILE_PLAN_PRO_HEX_BG_VARIANTS: ProfilePlanProHexBgMeta[] = [
  {
    id: "geo-hex-layout-honeycomb",
    layout: "honeycomb",
    label: "Honeycomb",
    tag: "蜂の巣",
    description: "全面の密なハニカム。",
    swatch: "linear-gradient(165deg, #04080e, #0d2238 45%, #050810)",
  },
  {
    id: "geo-hex-layout-stagger",
    layout: "stagger",
    label: "Pointy",
    tag: "尖り",
    description: "ポインティトップの全面タイル。",
    swatch: "linear-gradient(135deg, #060a12 25%, #0c1a2e 50%)",
  },
  {
    id: "geo-hex-layout-radial",
    layout: "radial",
    label: "Checker",
    tag: "市松",
    description: "全面ハニカムの交互ハイライト。",
    swatch: "radial-gradient(circle at 50% 50%, rgba(34,211,238,0.2), #050810)",
  },
  {
    id: "geo-hex-layout-grid",
    layout: "grid",
    label: "Grid",
    tag: "方眼",
    description: "正方格子に等間隔で並ぶ六角。",
    swatch: "linear-gradient(180deg, #050810, #0a1628)",
  },
  {
    id: "geo-hex-layout-corners",
    layout: "corners",
    label: "Corners",
    tag: "四隅",
    description: "四隅にミニハニカムを配置。中央は空ける。",
    swatch:
      "radial-gradient(circle at 0% 0%, rgba(34,211,238,0.25), transparent 42%), radial-gradient(circle at 100% 100%, rgba(167,139,250,0.2), transparent 42%), #050810",
  },
  {
    id: "geo-hex-layout-corners-l",
    layout: "corners-l",
    label: "Corner L",
    tag: "L字",
    description: "各コーナーから L 字に沿って整列。",
    swatch:
      "linear-gradient(135deg, rgba(34,211,238,0.2) 0%, transparent 36%), linear-gradient(315deg, rgba(6,182,212,0.18) 0%, transparent 36%), #050810",
  },
  {
    id: "geo-hex-layout-corners-quad",
    layout: "corners-quad",
    label: "Corner Zone",
    tag: "象限",
    description: "四隅ゾーンに小グリッド。中心はすっきり。",
    swatch:
      "radial-gradient(circle at 18% 18%, rgba(34,211,238,0.18), transparent 38%), radial-gradient(circle at 82% 82%, rgba(167,139,250,0.16), transparent 38%), #050810",
  },
  {
    id: "geo-hex-layout-spine",
    layout: "spine",
    label: "Columns",
    tag: "縦列",
    description: "等間隔の縦列だけを抽出。",
    swatch: "linear-gradient(90deg, #050810, rgba(6,182,212,0.18), #050810)",
  },
];

export const PROFILE_PLAN_PRO_HEX_BG_DEFAULT: ProfilePlanProHexBgVariant =
  "geo-hex-layout-honeycomb";

export function isProfilePlanProHexBgVariant(
  id: string
): id is ProfilePlanProHexBgVariant {
  return PROFILE_PLAN_PRO_HEX_BG_VARIANTS.some((v) => v.id === id);
}

export function isProfilePlanProHexCircuitBgVariant(
  id: string
): id is ProfilePlanProHexBgVariant {
  return isProfilePlanProHexBgVariant(id);
}

export function getProfilePlanProHexLayoutId(
  variant: ProfilePlanProHexBgVariant
): ProfilePlanProHexLayoutId {
  return variant.slice("geo-hex-layout-".length) as ProfilePlanProHexLayoutId;
}
