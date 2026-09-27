/**
 * PRO プロフィール背景 — 採用候補（決定ドラフト）
 * プレビュー: /dev/profile-plan-pro-adopted-preview
 *
 * `category` = ユーザー向けグループ（サイバー / 爬虫類 / 獣皮 / 素材 / 幾何学 / 宇宙）
 * `family`   = 実装系統（パターン生成の参照元）
 */

import { L, resolveLocalizedLang } from "@/lib/i18n/localize";
import type { UiStrings } from "@/lib/i18n/ui";
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
  | "geometry"
  | "cosmos";

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
  label: UiStrings;
  description: UiStrings;
};

export const PROFILE_PLAN_PRO_ADOPTED_CATEGORIES: readonly ProfilePlanProAdoptedCategoryMeta[] =
  [
    {
      id: "cyber",
      label: {
        ja: "サイバー空間",
        en: "Cyber Space",
        ko: "사이버 공간",
        zh: "赛博空间",
        es: "Ciberespacio",
        pt: "Ciberespaço",
        fr: "Cyberespace",
      },
      description: {
        ja: "シアン格子・ネオン稜線など、線画サイバー HUD。",
        en: "Cyan grids, neon ridges, and line-art cyber HUD.",
        ko: "시안 격자와 네온 능선 등 선화 사이버 HUD.",
        zh: "青色网格、霓虹棱线等线稿赛博 HUD。",
        es: "Rejillas cian, crestas neón y HUD ciber lineal.",
        pt: "Grades ciano, cristas neon e HUD cyber em linhas.",
        fr: "Grilles cyan, crêtes néon et HUD cyber au trait.",
      },
    },
    {
      id: "reptile",
      label: {
        ja: "爬虫類",
        en: "Reptile",
        ko: "파충류",
        zh: "爬行动物",
        es: "Reptil",
        pt: "Réptil",
        fr: "Reptile",
      },
      description: {
        ja: "蛇・鱗・竜鱗・クロコなど、爬虫類モチーフのスキン。",
        en: "Snakes, scales, dragon plate, crocodile leather.",
        ko: "뱀·비늘·용린·크로코 등 파충류 모티브 스킨.",
        zh: "蛇皮、鳞片、龙鳞、鳄鱼皮等爬行动物主题。",
        es: "Serpientes, escamas, placa de dragón y piel de cocodrilo.",
        pt: "Cobras, escamas, placa de dragão e couro de crocodilo.",
        fr: "Serpents, écailles, plaques de dragon, cuir de crocodile.",
      },
    },
    {
      id: "beast",
      label: {
        ja: "獣皮",
        en: "Beast Hide",
        ko: "짐승 가죽",
        zh: "兽皮",
        es: "Piel de bestia",
        pt: "Pele de fera",
        fr: "Peau de bête",
      },
      description: {
        ja: "豹・鮫など、哺乳類・水生の肌理・ファー。",
        en: "Panther fur, shark skin, and other animal textures.",
        ko: "표범·상어 등 포유류·수생 동물의 질감과 털.",
        zh: "豹纹、鲨鱼皮等哺乳与水生动物的质感与毛发。",
        es: "Pelaje de pantera, piel de tiburón y otras texturas animales.",
        pt: "Pelo de pantera, pele de tubarão e outras texturas animais.",
        fr: "Fourrure de panthère, peau de requin et autres textures animales.",
      },
    },
    {
      id: "material",
      label: {
        ja: "素材",
        en: "Material",
        ko: "소재",
        zh: "材质",
        es: "Material",
        pt: "Material",
        fr: "Matière",
      },
      description: {
        ja: "ダスト・装甲・回路レースなど、素材・ブランド柄。",
        en: "Dust, armor plate, and circuit-lace motifs.",
        ko: "더스트·장갑판·회로 레이스 등 소재·브랜드 패턴.",
        zh: "粉尘、装甲板、电路蕾丝等材质与品牌纹样。",
        es: "Polvo, placas de blindaje y motivos de circuito.",
        pt: "Poeira, placas de blindagem e motivos de circuito.",
        fr: "Poussière, plaques de blindage et motifs de circuits.",
      },
    },
    {
      id: "geometry",
      label: {
        ja: "幾何学",
        en: "Geometry",
        ko: "기하학",
        zh: "几何",
        es: "Geometría",
        pt: "Geometria",
        fr: "Géométrie",
      },
      description: {
        ja: "六角・立体格子など、幾何パターンのスキン。",
        en: "Hex grids, isometric cubes, and geometric patterns.",
        ko: "육각 격자·입체 큐브 등 기하 패턴 스킨.",
        zh: "六边形网格、立体方块等几何图案。",
        es: "Rejillas hexagonales, cubos isométricos y patrones geométricos.",
        pt: "Grades hexagonais, cubos isométricos e padrões geométricos.",
        fr: "Grilles hexagonales, cubes isométriques et motifs géométriques.",
      },
    },
    {
      id: "cosmos",
      label: {
        ja: "宇宙",
        en: "Cosmos",
        ko: "우주",
        zh: "宇宙",
        es: "Cosmos",
        pt: "Cosmos",
        fr: "Cosmos",
      },
      description: {
        ja: "地球・惑星・星雲・銀河の実写（NASA / ESA ほか）。",
        en: "Real imagery of Earth, planets, nebulae, and galaxies (NASA / ESA and others).",
        ko: "지구·행성·성운·은하 실사（NASA / ESA 등）.",
        zh: "地球、行星、星云、星系实拍（NASA / ESA 等）。",
        es: "Imágenes reales de la Tierra, planetas, nebulosas y galaxias.",
        pt: "Imagens reais da Terra, planetas, nebulosas e galáxias.",
        fr: "Images réelles de la Terre, des planètes, nébuleuses et galaxies.",
      },
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
  /** ユーザー向け表示名（英語 1〜2 語） */
  name: string;
  category: ProfilePlanProAdoptedCategory;
  family: ProfilePlanProAdoptedFamily;
};

/** 採用カタログ — 解放カタログ順（即解放11 → マイルストーン46）。詳細は `proSkinMilestoneCatalog.ts` */
const ADOPTED_SPECS: readonly AdoptedSpec[] = [
  // Pro 即解放 ×11
  { id: "atmos", name: "Atmos", category: "cyber", family: "atmos" },
  { id: "wave-riot-shard", name: "Riot Shard", category: "cyber", family: "wave" },
  { id: "wave-uniterz-logo", name: "Uniterz", category: "material", family: "wave" },
  { id: "wave-mono-hex", name: "Cyber Hex", category: "cyber", family: "wave" },
  { id: "beast-dust", name: "Dust", category: "material", family: "beast" },
  { id: "beast-dust-ash", name: "Ash", category: "material", family: "beast" },
  { id: "beast-crocodile", name: "Onyx Croc", category: "reptile", family: "beast" },
  { id: "scale-mamba", name: "Black Mamba", category: "reptile", family: "scale" },
  { id: "scale-python", name: "Python", category: "reptile", family: "scale" },
  { id: "scale-diamondback", name: "Diamondback", category: "reptile", family: "scale" },
  { id: "beast-shark", name: "Shark", category: "beast", family: "beast" },
  // 連勝 = 紅・炎
  { id: "wave-crimson-shard", name: "Crimson Shard", category: "cyber", family: "wave" },
  { id: "beast-eclipse", name: "Eclipse", category: "beast", family: "beast" },
  { id: "wave-ember-hex", name: "Ember Hex", category: "geometry", family: "wave" },
  { id: "beast-lavaflow", name: "Lava", category: "cosmos", family: "beast" },
  { id: "beast-io", name: "Io", category: "cosmos", family: "beast" },
  { id: "beast-flame", name: "Flame", category: "cosmos", family: "beast" },
  { id: "beast-helix", name: "Helix", category: "cosmos", family: "beast" },
  { id: "beast-solar", name: "Solar", category: "cosmos", family: "beast" },
  { id: "beast-corona", name: "Corona", category: "cosmos", family: "beast" },
  // パーフェクト = 蒼・氷
  { id: "beast-shard", name: "Azure Shard", category: "beast", family: "beast" },
  { id: "beast-europa", name: "Europa", category: "cosmos", family: "beast" },
  { id: "beast-neptune", name: "Neptune", category: "cosmos", family: "beast" },
  { id: "beast-nova", name: "Nova", category: "cosmos", family: "beast" },
  // 予想数 = 地球→冥王星の旅
  { id: "beast-lena", name: "Delta", category: "cosmos", family: "beast" },
  { id: "beast-hurricane", name: "Cyclone", category: "cosmos", family: "beast" },
  { id: "beast-nightearth", name: "Night Earth", category: "cosmos", family: "beast" },
  { id: "beast-aurora", name: "Aurora", category: "cosmos", family: "beast" },
  { id: "beast-lunar", name: "Lunar", category: "cosmos", family: "beast" },
  { id: "beast-marscrust", name: "Mars", category: "cosmos", family: "beast" },
  { id: "beast-dunes", name: "Dunes", category: "cosmos", family: "beast" },
  { id: "beast-jovian", name: "Jupiter", category: "cosmos", family: "beast" },
  { id: "beast-rings", name: "Rings", category: "cosmos", family: "beast" },
  { id: "beast-saturn", name: "Saturn", category: "cosmos", family: "beast" },
  { id: "beast-pluto", name: "Pluto", category: "cosmos", family: "beast" },
  // 順位 1回 = 称号
  { id: "beast-tessera", name: "Tessera", category: "geometry", family: "beast" },
  { id: "form-isocubes", name: "Cubes", category: "geometry", family: "form" },
  { id: "beast-jagarmor", name: "Jagged", category: "material", family: "beast" },
  { id: "wave-obsidian-warp", name: "Obsidian", category: "geometry", family: "wave" },
  { id: "wave-neon-ridge", name: "Neon Ridge", category: "cyber", family: "wave" },
  { id: "beast-circuitlace", name: "Circuit", category: "material", family: "beast" },
  { id: "beast-facet", name: "Facet", category: "beast", family: "beast" },
  { id: "beast-thunder", name: "Thunder", category: "beast", family: "beast" },
  { id: "beast-starborne", name: "Starborne", category: "beast", family: "beast" },
  { id: "beast-regalia", name: "Regalia", category: "beast", family: "beast" },
  // 順位回数 = 深宇宙
  { id: "beast-startrail", name: "Star Trail", category: "cosmos", family: "beast" },
  { id: "beast-nebula", name: "Cone", category: "cosmos", family: "beast" },
  { id: "beast-crab", name: "Crab", category: "cosmos", family: "beast" },
  { id: "beast-pillars", name: "Pillars", category: "cosmos", family: "beast" },
  { id: "beast-southernring", name: "Southern Ring", category: "cosmos", family: "beast" },
  { id: "beast-andromeda", name: "Andromeda", category: "cosmos", family: "beast" },
  { id: "beast-galaxy", name: "Galaxy", category: "cosmos", family: "beast" },
  { id: "beast-milkyway", name: "Galactic Core", category: "cosmos", family: "beast" },
  { id: "beast-deepfield", name: "Deep Field", category: "cosmos", family: "beast" },
  // 招待 = 金
  { id: "beast-viper", name: "Viper", category: "reptile", family: "beast" },
  { id: "wave-gold-monogram", name: "Monogram", category: "material", family: "wave" },
  { id: "scale-dragon", name: "Dragon", category: "reptile", family: "scale" },
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
  language: string = "en"
): string {
  return L(resolveLocalizedLang(language), profilePlanProAdoptedCategoryMeta(category).label);
}

export const PROFILE_PLAN_PRO_ADOPTED_BG: readonly ProfilePlanProAdoptedEntry[] =
  ADOPTED_SPECS.map((spec) => {
    const meta = metaForSpec(spec);
    return {
      id: spec.id,
      category: spec.category,
      family: spec.family,
      group: spec.family,
      label: spec.name,
      tag: "",
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
