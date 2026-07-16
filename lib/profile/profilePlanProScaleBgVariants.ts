/** PRO 背景 — 爬虫類スキン × サイバー（dev 比較用） */

export type ProfilePlanProScaleBgVariant =
  | "scale-mamba"
  | "scale-king"
  | "scale-diamondback"
  | "scale-anaconda"
  | "scale-bushmaster"
  | "scale-gaboon"
  | "scale-python"
  | "scale-gecko"
  | "scale-cobra"
  | "scale-dragon"
  | "scale-viper"
  | "scale-shed"
  | "scale-chrome"
  | "scale-biolume";

export type ProfilePlanProScaleBgMeta = {
  id: ProfilePlanProScaleBgVariant;
  label: string;
  tag: string;
  description: string;
  /** スウォッチ用ヒント */
  swatch: string;
};

export const PROFILE_PLAN_PRO_SCALE_BG_VARIANTS: ProfilePlanProScaleBgMeta[] = [
  {
    id: "scale-mamba",
    label: "Black Mamba",
    tag: "マンバ",
    description:
      "ガンメタル〜オリーブの滑らかな平滑鱗。冷たい鋼の微 HUD。最速の捕食者感。",
    swatch: "linear-gradient(145deg, #0a0c0e, #1a1f24 40%, #3f4a52 70%, #050608)",
  },
  {
    id: "scale-king",
    label: "King Cobra",
    tag: "キングコブラ",
    description: "黒地に琥珀色バンドが走る王蛇。帯状の菱形鱗。",
    swatch: "linear-gradient(160deg, #0a0804, #1a1208 35%, #b45309 55%, #050403)",
  },
  {
    id: "scale-diamondback",
    label: "Diamondback",
    tag: "ガラガラ",
    description: "クラシックなダイヤモンドバック模様。砂漠のキール菱形。",
    swatch: "linear-gradient(145deg, #1c1410, #78716c 40%, #a8a29e 60%, #0c0a08)",
  },
  {
    id: "scale-anaconda",
    label: "Anaconda",
    tag: "アナコンダ",
    description: "オリーブの大判腹鱗。密めで重厚な水棲巨蟒。",
    swatch: "linear-gradient(150deg, #0a1208, #3f6212 45%, #1a2e05 70%, #040804)",
  },
  {
    id: "scale-bushmaster",
    label: "Bushmaster",
    tag: "ブッシュマスター",
    description: "銅錆色のキール鱗。新大陸最大級のピットバイパー。",
    swatch: "linear-gradient(145deg, #1a0c08, #9a3412 45%, #c2410c 65%, #0a0604)",
  },
  {
    id: "scale-gaboon",
    label: "Gaboon Viper",
    tag: "ガブーン",
    description: "葉脈のような幾何学ダイヤモンド。アフリカの伏兵。",
    swatch: "linear-gradient(145deg, #1a1408, #854d0e 40%, #a16207 55%, #422006)",
  },
  {
    id: "scale-python",
    label: "Python Circuit",
    tag: "菱形鱗",
    description:
      "atmos 配置の疎な菱形蛇鱗。右下に寄せ、中央は空けてコンテンツを邪魔しない。",
    swatch:
      "linear-gradient(145deg, #061018, #0a2a38 40%, #22d3ee55 55%, #050810)",
  },
  {
    id: "scale-gecko",
    label: "Gecko Belly",
    tag: "腹鱗",
    description: "重なる U 字の腹側鱗。ゲッコー／トカゲ腹皮の有機感。",
    swatch:
      "linear-gradient(135deg, #04120e, #0d3d32 45%, #34d39966, #030806)",
  },
  {
    id: "scale-cobra",
    label: "Cobra Hood",
    tag: "油膜鱗",
    description: "紫寄りの重なり腹鱗＋微細 HUD。コブラ皮の艶。",
    swatch:
      "linear-gradient(160deg, #0a0612, #4c1d9555, #22d3ee44, #05040a)",
  },
  {
    id: "scale-dragon",
    label: "Dragon Plate",
    tag: "竜鱗",
    description: "先の尖った盾形アーマー鱗。大判で端に寄せる。",
    swatch:
      "linear-gradient(150deg, #120806, #7c2d1244, #f59e0b55, #080403)",
  },
  {
    id: "scale-viper",
    label: "Viper Keel",
    tag: "キール",
    description: "中央稜線のあるキール鱗。毒蛇の細かい皮目。",
    swatch:
      "linear-gradient(145deg, #061208, #14532d55, #84cc16aa, #030806)",
  },
  {
    id: "scale-shed",
    label: "Shed Reveal",
    tag: "脱皮",
    description: "欠けた鱗の隙間から回路トレースが覗く。",
    swatch:
      "linear-gradient(135deg, #050810, #164e6355, #22d3ee77, #7c3aed44)",
  },
  {
    id: "scale-chrome",
    label: "Chrome Monitor",
    tag: "金属鱗",
    description: "稜線ハイライト付きの金属アーマー鱗。",
    swatch:
      "linear-gradient(145deg, #0c1018, #64748b66, #94a3b8aa, #38bdf855)",
  },
  {
    id: "scale-biolume",
    label: "Biolume Shift",
    tag: "生物発光",
    description: "腹鱗＋中心の微光。色相がゆっくり移る。",
    swatch:
      "linear-gradient(135deg, #020617, #06b6d466, #a78bfa66, #ec489955)",
  },
];

export const PROFILE_PLAN_PRO_SCALE_BG_DEFAULT: ProfilePlanProScaleBgVariant =
  "scale-mamba";

export function isProfilePlanProScaleBgVariant(
  id: string
): id is ProfilePlanProScaleBgVariant {
  return PROFILE_PLAN_PRO_SCALE_BG_VARIANTS.some((v) => v.id === id);
}
