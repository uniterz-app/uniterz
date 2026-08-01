/** PRO 背景 — 宇宙テーマ 20 案（dev プレビュー） */

export type ProfilePlanProCosmosBgVariant =
  | "cosmos-event-horizon"
  | "cosmos-nebula-crown"
  | "cosmos-stellar-drift"
  | "cosmos-cosmic-rift"
  | "cosmos-lunar-eclipse"
  | "cosmos-solar-flare"
  | "cosmos-deep-space-core"
  | "cosmos-galactic-halo"
  | "cosmos-void-signal"
  | "cosmos-starforge"
  | "cosmos-nova-pulse"
  | "cosmos-aurora-orbit"
  | "cosmos-dark-matter"
  | "cosmos-comet-trail"
  | "cosmos-celestial-grid"
  | "cosmos-quantum-nebula"
  | "cosmos-meteor-veil"
  | "cosmos-orbital-throne"
  | "cosmos-singularity-vein"
  | "cosmos-archive";

export type ProfilePlanProCosmosBgMeta = {
  id: ProfilePlanProCosmosBgVariant;
  label: string;
  tag: string;
  description: string;
  swatch: string;
};

export const PROFILE_PLAN_PRO_COSMOS_BG_VARIANTS: ProfilePlanProCosmosBgMeta[] = [
  {
    id: "cosmos-event-horizon",
    label: "Event Horizon",
    tag: "事象の地平",
    description: "ブラックホールと重力の歪み。漆黒で重厚。",
    swatch:
      "linear-gradient(150deg, #000000, #0a0a12 40%, #1e1b4b66 60%, #000000)",
  },
  {
    id: "cosmos-nebula-crown",
    label: "Nebula Crown",
    tag: "星雲冠",
    description: "紫と青の星雲。王冠のような高級感。",
    swatch:
      "linear-gradient(145deg, #0a0618, #4c1d9566 40%, #2563eb88 65%, #020108)",
  },
  {
    id: "cosmos-stellar-drift",
    label: "Stellar Drift",
    tag: "星屑流",
    description: "静かに流れる星屑。落ち着いた深宇宙。",
    swatch:
      "linear-gradient(155deg, #020617, #0f172a 45%, #94a3b866 70%, #01040c)",
  },
  {
    id: "cosmos-cosmic-rift",
    label: "Cosmic Rift",
    tag: "宇宙亀裂",
    description: "宇宙を切り裂く青紫の亀裂。攻撃的。",
    swatch:
      "linear-gradient(148deg, #02010a, #312e8188 35%, #7c3aed99 55%, #010005)",
  },
  {
    id: "cosmos-lunar-eclipse",
    label: "Lunar Eclipse",
    tag: "月食",
    description: "赤い月食。ダークで不気味。",
    swatch:
      "linear-gradient(150deg, #050101, #450a0a 40%, #b91c1c88 60%, #020000)",
  },
  {
    id: "cosmos-solar-flare",
    label: "Solar Flare",
    tag: "太陽フレア",
    description: "金色の太陽フレア。力強く豪華。",
    swatch:
      "linear-gradient(145deg, #0a0600, #78350f66 35%, #fbbf2488 55%, #050300)",
  },
  {
    id: "cosmos-deep-space-core",
    label: "Deep Space Core",
    tag: "深宇宙核",
    description: "深宇宙に浮かぶ青白いエネルギー核。",
    swatch:
      "linear-gradient(150deg, #01040c, #0c4a6e66 40%, #e0f2fe88 58%, #010208)",
  },
  {
    id: "cosmos-galactic-halo",
    label: "Galactic Halo",
    tag: "銀河光輪",
    description: "銀河の光輪。神秘的で上品。",
    swatch:
      "linear-gradient(148deg, #04020c, #1e1b4b66 38%, #c4b5fd88 60%, #020108)",
  },
  {
    id: "cosmos-void-signal",
    label: "Void Signal",
    tag: "虚無信号",
    description: "虚無空間を走る通信信号。SF・サイバー。",
    swatch:
      "linear-gradient(155deg, #010508, #042f2e66 40%, #22d3ee88 62%, #010304)",
  },
  {
    id: "cosmos-starforge",
    label: "Starforge",
    tag: "星鍛炉",
    description: "星を生み出す宇宙炉。青と金の重厚感。",
    swatch:
      "linear-gradient(145deg, #020610, #1e3a8a66 35%, #f59e0b88 58%, #010308)",
  },
  {
    id: "cosmos-nova-pulse",
    label: "Nova Pulse",
    tag: "新星脈動",
    description: "新星から広がる光の波。静かな爆発力。",
    swatch:
      "linear-gradient(150deg, #050208, #4a044e66 38%, #f9a8d488 60%, #020104)",
  },
  {
    id: "cosmos-aurora-orbit",
    label: "Aurora Orbit",
    tag: "オーロラ軌道",
    description: "宇宙オーロラと惑星軌道。幻想的。",
    swatch:
      "linear-gradient(148deg, #020812, #065f4666 35%, #34d39988 50%, #818cf888 70%, #010408)",
  },
  {
    id: "cosmos-dark-matter",
    label: "Dark Matter",
    tag: "暗黒物質",
    description: "暗黒物質の揺らぎ。暗く静かで上級者向け。",
    swatch:
      "linear-gradient(155deg, #000000, #111827 50%, #37415155 75%, #000000)",
  },
  {
    id: "cosmos-comet-trail",
    label: "Comet Trail",
    tag: "彗星軌跡",
    description: "彗星の軌跡。スピード感と爽快感。",
    swatch:
      "linear-gradient(140deg, #020618, #0ea5e966 40%, #f8fafc88 65%, #01030c)",
  },
  {
    id: "cosmos-celestial-grid",
    label: "Celestial Grid",
    tag: "星図格子",
    description: "星図と宇宙座標。知的でテクノロジー寄り。",
    swatch:
      "linear-gradient(150deg, #020617, #1e293b66 40%, #38bdf888 60%, #01040c)",
  },
  {
    id: "cosmos-quantum-nebula",
    label: "Quantum Nebula",
    tag: "量子星雲",
    description: "量子粒子が漂う星雲。細かく幻想的。",
    swatch:
      "linear-gradient(148deg, #0a0614, #6d28d966 35%, #22d3ee77 55%, #ec489977 70%, #040208)",
  },
  {
    id: "cosmos-meteor-veil",
    label: "Meteor Veil",
    tag: "流星の帳",
    description: "霧の奥を流れる流星群。静かで上品。",
    swatch:
      "linear-gradient(155deg, #06080e, #33415566 42%, #cbd5e188 65%, #030508)",
  },
  {
    id: "cosmos-orbital-throne",
    label: "Orbital Throne",
    tag: "軌道の玉座",
    description: "惑星リングが作る王座。威厳と最上位感。",
    swatch:
      "linear-gradient(145deg, #08060a, #42200666 35%, #d4a01788 55%, #040305)",
  },
  {
    id: "cosmos-singularity-vein",
    label: "Singularity Vein",
    tag: "特異点の脈",
    description: "特異点から伸びるエネルギー脈。ダークで鋭い。",
    swatch:
      "linear-gradient(150deg, #000000, #1a0533 40%, #a855f788 60%, #000000)",
  },
  {
    id: "cosmos-archive",
    label: "Cosmos Archive",
    tag: "宇宙書庫",
    description: "古代星図と未来の観測データ。知性と神秘。",
    swatch:
      "linear-gradient(148deg, #04060c, #1e293b66 38%, #67e8f688 50%, #c4b5fd66 70%, #020408)",
  },
];

export function isProfilePlanProCosmosBgVariant(
  id: string
): id is ProfilePlanProCosmosBgVariant {
  return PROFILE_PLAN_PRO_COSMOS_BG_VARIANTS.some((v) => v.id === id);
}

export const PROFILE_PLAN_PRO_COSMOS_BG_DEFAULT: ProfilePlanProCosmosBgVariant =
  "cosmos-event-horizon";
