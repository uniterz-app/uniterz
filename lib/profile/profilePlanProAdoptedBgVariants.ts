/**
 * PRO プロフィール背景 — 採用候補（決定ドラフト）
 * プレビュー: /dev/profile-plan-pro-adopted-preview
 *
 * `category` = ユーザー向けグループ（サイバー / 爬虫類 / 獣皮 / 素材 / 幾何学）
 * `family`   = 実装系統（パターン生成の参照元）
 */

import {
  PROFILE_PLAN_PRO_BEAST_BG_VARIANTS,
  type ProfilePlanProBeastBgMeta,
  type ProfilePlanProBeastBgVariant,
} from "@/lib/profile/profilePlanProBeastBgVariants";
import {
  PROFILE_PLAN_PRO_BG_VARIANTS,
  type ProfilePlanProBgVariant,
  type ProfilePlanProBgVariantMeta,
} from "@/lib/profile/profilePlanProBgVariants";
import {
  PROFILE_PLAN_PRO_FORM_BG_VARIANTS,
  type ProfilePlanProFormBgMeta,
  type ProfilePlanProFormBgVariant,
} from "@/lib/profile/profilePlanProFormBgVariants";
import {
  PROFILE_PLAN_PRO_NEO_BG_VARIANTS,
  type ProfilePlanProNeoBgMeta,
  type ProfilePlanProNeoBgVariant,
} from "@/lib/profile/profilePlanProNeoBgVariants";
import {
  PROFILE_PLAN_PRO_SCALE_BG_VARIANTS,
  type ProfilePlanProScaleBgMeta,
  type ProfilePlanProScaleBgVariant,
} from "@/lib/profile/profilePlanProScaleBgVariants";

/** ユーザー向けカテゴリ */
export type ProfilePlanProAdoptedCategory =
  | "cyber"
  | "reptile"
  | "beast"
  | "material"
  | "geometry";

/** 実装系統（内部） */
export type ProfilePlanProAdoptedFamily =
  | "atmos"
  | "scale"
  | "beast"
  | "form"
  | "neo";

/** @deprecated 表示は category を使う */
export type ProfilePlanProAdoptedGroup = ProfilePlanProAdoptedFamily;

export type ProfilePlanProAdoptedCategoryMeta = {
  id: ProfilePlanProAdoptedCategory;
  labelJa: string;
  labelEn: string;
  descriptionJa: string;
  descriptionEn: string;
};

export const PROFILE_PLAN_PRO_ADOPTED_CATEGORIES: readonly ProfilePlanProAdoptedCategoryMeta[] =
  [
    {
      id: "cyber",
      labelJa: "サイバー空間",
      labelEn: "Cyber Space",
      descriptionJa: "ネビュラ・多層パララックスなど、奥行きのあるサイバー HUD。",
      descriptionEn: "Nebula and parallax layers — depth-first cyber HUD.",
    },
    {
      id: "reptile",
      labelJa: "爬虫類",
      labelEn: "Reptile",
      descriptionJa: "蛇・鱗・竜鱗・クロコなど、爬虫類モチーフのスキン。",
      descriptionEn: "Snakes, scales, dragon plate, crocodile leather.",
    },
    {
      id: "beast",
      labelJa: "獣皮",
      labelEn: "Beast Hide",
      descriptionJa: "豹・鮫など、哺乳類・水生の肌理・ファー。",
      descriptionEn: "Panther fur, shark skin, and other animal textures.",
    },
    {
      id: "material",
      labelJa: "素材",
      labelEn: "Material",
      descriptionJa: "カーボン・チタン・織物・回路レースなど、素材・ブランド柄。",
      descriptionEn: "Carbon, titanium, weave, and circuit-lace motifs.",
    },
    {
      id: "geometry",
      labelJa: "幾何学",
      labelEn: "Geometry",
      descriptionJa: "六角・立体格子など、幾何パターンのスキン。",
      descriptionEn: "Hex grids, isometric cubes, and geometric patterns.",
    },
  ] as const;

export type ProfilePlanProAdoptedEntry = {
  id: ProfilePlanProBgVariant;
  /** ユーザー向けグループ */
  category: ProfilePlanProAdoptedCategory;
  /** 実装系統 */
  family: ProfilePlanProAdoptedFamily;
  /** @deprecated category を使う */
  group: ProfilePlanProAdoptedFamily;
  label: string;
  tag: string;
  description: string;
};

type AdoptedSpec = {
  id: ProfilePlanProBgVariant;
  category: ProfilePlanProAdoptedCategory;
  family: ProfilePlanProAdoptedFamily;
};

/** 採用 19 — カテゴリ順（No.1〜） */
const ADOPTED_SPECS: readonly AdoptedSpec[] = [
  // サイバー空間 ×3
  { id: "atmos", category: "cyber", family: "atmos" },
  { id: "parallax", category: "cyber", family: "atmos" },
  { id: "neo-flux", category: "cyber", family: "neo" },
  // 爬虫類 ×8
  { id: "scale-mamba", category: "reptile", family: "scale" },
  { id: "scale-king", category: "reptile", family: "scale" },
  { id: "scale-diamondback", category: "reptile", family: "scale" },
  { id: "scale-dragon", category: "reptile", family: "scale" },
  { id: "scale-python", category: "reptile", family: "scale" },
  { id: "beast-crocodile", category: "reptile", family: "beast" },
  { id: "beast-viper", category: "reptile", family: "beast" },
  { id: "beast-drake", category: "reptile", family: "beast" },
  // 獣皮 ×2
  { id: "beast-panther", category: "beast", family: "beast" },
  { id: "beast-shark", category: "beast", family: "beast" },
  // 素材 ×4
  { id: "beast-carbon", category: "material", family: "beast" },
  { id: "beast-titanium", category: "material", family: "beast" },
  { id: "beast-chevron", category: "material", family: "beast" },
  { id: "beast-circuitlace", category: "material", family: "beast" },
  // 幾何学 ×2
  { id: "form-hexveil", category: "geometry", family: "form" },
  { id: "form-isocubes", category: "geometry", family: "form" },
];

function bgMeta(id: ProfilePlanProBgVariant): ProfilePlanProBgVariantMeta | undefined {
  return PROFILE_PLAN_PRO_BG_VARIANTS.find((v) => v.id === id);
}

function scaleMeta(
  id: ProfilePlanProScaleBgVariant
): ProfilePlanProScaleBgMeta | undefined {
  return PROFILE_PLAN_PRO_SCALE_BG_VARIANTS.find((v) => v.id === id);
}

function beastMeta(
  id: ProfilePlanProBeastBgVariant
): ProfilePlanProBeastBgMeta | undefined {
  return PROFILE_PLAN_PRO_BEAST_BG_VARIANTS.find((v) => v.id === id);
}

function formMeta(
  id: ProfilePlanProFormBgVariant
): ProfilePlanProFormBgMeta | undefined {
  return PROFILE_PLAN_PRO_FORM_BG_VARIANTS.find((v) => v.id === id);
}

function neoMeta(
  id: ProfilePlanProNeoBgVariant
): ProfilePlanProNeoBgMeta | undefined {
  return PROFILE_PLAN_PRO_NEO_BG_VARIANTS.find((v) => v.id === id);
}

function metaForSpec(spec: AdoptedSpec): {
  label: string;
  tag: string;
  description: string;
} {
  const { id, family } = spec;
  if (family === "atmos") {
    const meta = bgMeta(id);
    return {
      label: meta?.label ?? id,
      tag: meta?.tag ?? "",
      description: meta?.description ?? "",
    };
  }
  if (family === "scale") {
    const meta = scaleMeta(id as ProfilePlanProScaleBgVariant);
    return {
      label: meta?.label ?? id,
      tag: meta?.tag ?? "",
      description: meta?.description ?? "",
    };
  }
  if (family === "beast") {
    const meta = beastMeta(id as ProfilePlanProBeastBgVariant);
    return {
      label: meta?.label ?? id,
      tag: meta?.tag ?? "",
      description: meta?.description ?? "",
    };
  }
  if (family === "neo") {
    const meta = neoMeta(id as ProfilePlanProNeoBgVariant);
    return {
      label: meta?.label ?? id,
      tag: meta?.tag ?? "",
      description: meta?.description ?? "",
    };
  }
  const meta = formMeta(id as ProfilePlanProFormBgVariant);
  return {
    label: meta?.label ?? id,
    tag: meta?.tag ?? "",
    description: meta?.description ?? "",
  };
}

export function profilePlanProAdoptedCategoryMeta(
  category: ProfilePlanProAdoptedCategory
): ProfilePlanProAdoptedCategoryMeta {
  return (
    PROFILE_PLAN_PRO_ADOPTED_CATEGORIES.find((c) => c.id === category) ??
    PROFILE_PLAN_PRO_ADOPTED_CATEGORIES[0]!
  );
}

export function profilePlanProAdoptedCategoryLabel(
  category: ProfilePlanProAdoptedCategory,
  language: "ja" | "en" = "en"
): string {
  const meta = profilePlanProAdoptedCategoryMeta(category);
  return language === "ja" ? meta.labelJa : meta.labelEn;
}

export const PROFILE_PLAN_PRO_ADOPTED_BG: readonly ProfilePlanProAdoptedEntry[] =
  ADOPTED_SPECS.map((spec) => {
    const meta = metaForSpec(spec);
    return {
      id: spec.id,
      category: spec.category,
      family: spec.family,
      group: spec.family,
      label: meta.label,
      tag: meta.tag,
      description: meta.description,
    };
  });

const ADOPTED_ID_SET = new Set(
  PROFILE_PLAN_PRO_ADOPTED_BG.map((entry) => entry.id)
);

export function isAdoptedProBgVariant(
  id: string
): id is ProfilePlanProBgVariant {
  return ADOPTED_ID_SET.has(id as ProfilePlanProBgVariant);
}

export const PROFILE_PLAN_PRO_ADOPTED_CYBER = PROFILE_PLAN_PRO_ADOPTED_BG.filter(
  (e) => e.category === "cyber"
);

export const PROFILE_PLAN_PRO_ADOPTED_REPTILE = PROFILE_PLAN_PRO_ADOPTED_BG.filter(
  (e) => e.category === "reptile"
);

export const PROFILE_PLAN_PRO_ADOPTED_BEAST = PROFILE_PLAN_PRO_ADOPTED_BG.filter(
  (e) => e.category === "beast"
);

export const PROFILE_PLAN_PRO_ADOPTED_MATERIAL = PROFILE_PLAN_PRO_ADOPTED_BG.filter(
  (e) => e.category === "material"
);

export const PROFILE_PLAN_PRO_ADOPTED_GEOMETRY = PROFILE_PLAN_PRO_ADOPTED_BG.filter(
  (e) => e.category === "geometry"
);

/** @deprecated category フィルタを使う */
export const PROFILE_PLAN_PRO_ADOPTED_ATMOS = PROFILE_PLAN_PRO_ADOPTED_CYBER;

/** @deprecated category フィルタを使う */
export const PROFILE_PLAN_PRO_ADOPTED_SCALE = PROFILE_PLAN_PRO_ADOPTED_REPTILE.filter(
  (e) => e.family === "scale"
);

/** @deprecated category フィルタを使う */
export const PROFILE_PLAN_PRO_ADOPTED_FORM = PROFILE_PLAN_PRO_ADOPTED_GEOMETRY;
