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
  PROFILE_PLAN_PRO_FUTURISTIC_BG_VARIANTS,
  type ProfilePlanProFuturisticBgMeta,
  type ProfilePlanProFuturisticBgVariant,
} from "@/lib/profile/profilePlanProFuturisticBgVariants";
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
import {
  PROFILE_PLAN_PRO_WAVE_BG_VARIANTS,
  type ProfilePlanProWaveBgMeta,
  type ProfilePlanProWaveBgVariant,
} from "@/lib/profile/profilePlanProWaveBgVariants";

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
  | "neo"
  | "futuristic"
  | "wave";

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
      descriptionJa: "シアン格子・ネオン稜線など、線画サイバー HUD。",
      descriptionEn: "Cyan grids, neon ridges, and line-art cyber HUD.",
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
      descriptionJa: "チタン・装甲・回路レースなど、素材・ブランド柄。",
      descriptionEn: "Titanium, armor plate, and circuit-lace motifs.",
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

/** 採用カタログ — 解放カタログ順（即解放12 → マイルストーン20）。詳細は `proSkinUnlock.ts` */
const ADOPTED_SPECS: readonly AdoptedSpec[] = [
  // Pro 即解放 ×12
  { id: "atmos", category: "cyber", family: "atmos" },
  { id: "parallax", category: "cyber", family: "atmos" },
  { id: "wave-riot-shard", category: "cyber", family: "wave" },
  { id: "beast-titanium", category: "material", family: "beast" },
  { id: "beast-panther", category: "beast", family: "beast" },
  { id: "beast-crocodile", category: "reptile", family: "beast" },
  { id: "scale-mamba", category: "reptile", family: "scale" },
  { id: "scale-python", category: "reptile", family: "scale" },
  { id: "form-hexveil", category: "geometry", family: "form" },
  { id: "scale-diamondback", category: "reptile", family: "scale" },
  { id: "beast-shark", category: "beast", family: "beast" },
  { id: "form-diamondgrid", category: "geometry", family: "form" },
  // マイルストーン ×20（閾値 → 順位1回 → 招待 → 回数）
  { id: "wave-crimson-shard", category: "cyber", family: "wave" },
  { id: "beast-viper", category: "reptile", family: "beast" },
  { id: "scale-king", category: "reptile", family: "scale" },
  { id: "scale-dragon", category: "reptile", family: "scale" },
  { id: "wave-signal-mosaic", category: "cyber", family: "wave" },
  { id: "beast-shard", category: "beast", family: "beast" },
  { id: "beast-circuitlace", category: "material", family: "beast" },
  { id: "beast-eclipse", category: "beast", family: "beast" },
  { id: "wave-chem-ink", category: "material", family: "wave" },
  { id: "form-isocubes", category: "geometry", family: "form" },
  { id: "beast-facet", category: "beast", family: "beast" },
  { id: "beast-thunder", category: "beast", family: "beast" },
  { id: "beast-starborne", category: "beast", family: "beast" },
  { id: "beast-regalia", category: "beast", family: "beast" },
  { id: "wave-cyan-grid", category: "cyber", family: "wave" },
  { id: "wave-gold-monogram", category: "material", family: "wave" },
  { id: "wave-neon-ridge", category: "cyber", family: "wave" },
  { id: "beast-jagarmor", category: "material", family: "beast" },
  { id: "wave-ember-hex", category: "geometry", family: "wave" },
  { id: "wave-obsidian-warp", category: "geometry", family: "wave" },
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

function futuristicMeta(
  id: ProfilePlanProFuturisticBgVariant
): ProfilePlanProFuturisticBgMeta | undefined {
  return PROFILE_PLAN_PRO_FUTURISTIC_BG_VARIANTS.find((v) => v.id === id);
}

function waveMeta(
  id: ProfilePlanProWaveBgVariant
): ProfilePlanProWaveBgMeta | undefined {
  return PROFILE_PLAN_PRO_WAVE_BG_VARIANTS.find((v) => v.id === id);
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
  if (family === "futuristic") {
    const meta = futuristicMeta(id as ProfilePlanProFuturisticBgVariant);
    return {
      label: meta?.label ?? id,
      tag: meta?.tag ?? "",
      description: meta?.description ?? "",
    };
  }
  if (family === "wave") {
    const meta = waveMeta(id as ProfilePlanProWaveBgVariant);
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

export const PROFILE_PLAN_PRO_ADOPTED_WAVE = PROFILE_PLAN_PRO_ADOPTED_BG.filter(
  (e) => e.family === "wave"
);

/** @deprecated category フィルタを使う */
export const PROFILE_PLAN_PRO_ADOPTED_ATMOS = PROFILE_PLAN_PRO_ADOPTED_CYBER;

/** @deprecated category フィルタを使う */
export const PROFILE_PLAN_PRO_ADOPTED_SCALE = PROFILE_PLAN_PRO_ADOPTED_REPTILE.filter(
  (e) => e.family === "scale"
);

/** @deprecated category フィルタを使う */
export const PROFILE_PLAN_PRO_ADOPTED_FORM = PROFILE_PLAN_PRO_ADOPTED_GEOMETRY;
