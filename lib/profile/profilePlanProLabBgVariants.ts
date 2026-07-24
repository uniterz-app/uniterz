/** PRO 背景 — デザインラボ（洗練リデザイン） */

export type ProfilePlanProLabBgVariant =
  | "lab-quiet-hex"
  | "lab-blade-rain"
  | "lab-carbon-twill"
  | "lab-soft-contour"
  | "lab-bracket-marks"
  | "lab-orbit-rings"
  | "lab-graphite-mesh"
  | "lab-ivory-vein"
  | "lab-night-ledger"
  | "lab-steel-hatch"
  | "lab-void-nodes"
  | "lab-ridge-fold"
  | "lab-signal-bars"
  | "lab-mirror-facet"
  | "lab-trace-path"
  | "lab-mono-chevron"
  | "lab-brushed-steel"
  | "lab-liquid-chrome"
  | "lab-damascus-wave"
  | "lab-gunmetal-flake"
  | "lab-rose-metal"
  | "lab-anodized-blue";

export type ProfilePlanProLabBgMeta = {
  id: ProfilePlanProLabBgVariant;
  label: string;
  tag: string;
  description: string;
  swatch: string;
};

export const PROFILE_PLAN_PRO_LAB_BG_VARIANTS: ProfilePlanProLabBgMeta[] = [
  {
    id: "lab-quiet-hex",
    label: "Quiet Hex",
    tag: "静六角",
    description: "Atmos 系の疎な六角。中央空け・端にだけ沈む。",
    swatch: "linear-gradient(160deg,#030508,#0a121c 50%,#020406)",
  },
  {
    id: "lab-blade-rain",
    label: "Blade Rain",
    tag: "刃雨",
    description: "細い斜線だけ。ネオン過多なし、刃物のような一本線。",
    swatch: "linear-gradient(155deg,#04060a,#0c1824 48%,#020408)",
  },
  {
    id: "lab-carbon-twill",
    label: "Carbon Twill",
    tag: "炭素綾",
    description: "カーボンファイバーの綾織り。暗い銀のみ。",
    swatch: "linear-gradient(165deg,#050608,#14181e 50%,#030406)",
  },
  {
    id: "lab-soft-contour",
    label: "Soft Contour",
    tag: "等高線",
    description: "地図の等高線。大きく・少なく・静かに。",
    swatch: "linear-gradient(160deg,#040810,#0a1a28 48%,#02060c)",
  },
  {
    id: "lab-bracket-marks",
    label: "Bracket Marks",
    tag: "角括弧",
    description: "工業図面のコーナーマーク。精密機器感。",
    swatch: "linear-gradient(158deg,#05070c,#0e1620 50%,#030508)",
  },
  {
    id: "lab-orbit-rings",
    label: "Orbit Rings",
    tag: "軌道環",
    description: "大きな弧だけ。小さな装飾を捨てた軌道図。",
    swatch: "linear-gradient(162deg,#03060c,#0a1424 48%,#02040a)",
  },
  {
    id: "lab-graphite-mesh",
    label: "Graphite Mesh",
    tag: "石墨網",
    description: "欠けた格子。全面グリッドではなく断片だけ。",
    swatch: "linear-gradient(160deg,#06070a,#161a20 50%,#040506)",
  },
  {
    id: "lab-ivory-vein",
    label: "Ivory Vein",
    tag: "象牙脈",
    description: "大理石の細い脈。金は控えめ、線が主役。",
    swatch: "linear-gradient(165deg,#080704,#16120c 48%,#040302)",
  },
  {
    id: "lab-night-ledger",
    label: "Night Ledger",
    tag: "夜帳",
    description: "縦のティック列。相場画面の余白美学。",
    swatch: "linear-gradient(158deg,#030508,#0a1218 50%,#020406)",
  },
  {
    id: "lab-steel-hatch",
    label: "Steel Hatch",
    tag: "鋼ハッチ",
    description: "建築図面のハッチング。短い平行線の束。",
    swatch: "linear-gradient(160deg,#05070a,#12161c 48%,#030406)",
  },
  {
    id: "lab-void-nodes",
    label: "Void Nodes",
    tag: "虚点",
    description: "点とごく短い結線。星図ではなく配線図の余白。",
    swatch: "linear-gradient(162deg,#04060c,#0c1420 50%,#020408)",
  },
  {
    id: "lab-ridge-fold",
    label: "Ridge Fold",
    tag: "稜線折",
    description: "折り紙の稜線。大きな V / 平面分割だけ。",
    swatch: "linear-gradient(158deg,#06080c,#141820 48%,#030508)",
  },
  {
    id: "lab-signal-bars",
    label: "Signal Bars",
    tag: "信号柱",
    description: "不等高の縦バー。イコライザではなく建築柱列。",
    swatch: "linear-gradient(160deg,#03060a,#0a1820 50%,#020406)",
  },
  {
    id: "lab-mirror-facet",
    label: "Mirror Facet",
    tag: "鏡面切子",
    description: "大きな菱形アウトラインのみ。宝石の切子を疎に。",
    swatch: "linear-gradient(165deg,#040810,#0c1c2c 48%,#02060c)",
  },
  {
    id: "lab-trace-path",
    label: "Trace Path",
    tag: "軌跡",
    description: "滑らかな曲線パス数本。手描きの軌跡感。",
    swatch: "linear-gradient(160deg,#05070c,#101820 50%,#030508)",
  },
  {
    id: "lab-mono-chevron",
    label: "Mono Chevron",
    tag: "単色V",
    description: "細いシェブロンを端にだけ。ロゴマークの余白。",
    swatch: "linear-gradient(158deg,#06080a,#14181e 48%,#040506)",
  },
  {
    id: "lab-brushed-steel",
    label: "Brushed Steel",
    tag: "刷鋼",
    description: "縦ヘアラインのブラッシュドスチール。光の筋だけ。",
    swatch: "linear-gradient(180deg,#08090c,#2a3038 42%,#0a0c10 78%,#050608)",
  },
  {
    id: "lab-liquid-chrome",
    label: "Liquid Chrome",
    tag: "液態鏡",
    description: "液態クロムのスペキュラーリボン。ハイライトが流れる。",
    swatch: "linear-gradient(150deg,#06080c,#3a4555 38%,#e8eef855,#1a222c 72%,#040608)",
  },
  {
    id: "lab-damascus-wave",
    label: "Damascus Wave",
    tag: "ダマスカス",
    description: "ダマスカス鋼の波紋。層が薄く揺れる。",
    swatch: "linear-gradient(165deg,#07080a,#1c222a 40%,#8a93a055,#10141a 75%,#040506)",
  },
  {
    id: "lab-gunmetal-flake",
    label: "Gunmetal Flake",
    tag: "銃鉄片",
    description: "ガンメタルの薄いフレーク切子。冷たい金属片。",
    swatch: "linear-gradient(158deg,#05070a,#1a2028 45%,#6b7585aa,#0a0e14)",
  },
  {
    id: "lab-rose-metal",
    label: "Rose Metal",
    tag: "薔薇金",
    description: "ローズゴールドの刷毛目。暖色メタルのハイライト。",
    swatch: "linear-gradient(155deg,#0a0606,#2a1814 40%,#c48a6e88,#1a0e0c 78%,#080404)",
  },
  {
    id: "lab-anodized-blue",
    label: "Anodized Blue",
    tag: "陽極青",
    description: "陽極酸化チタンの青。金属の虹彩を控えめに。",
    swatch: "linear-gradient(160deg,#040810,#0c2840 40%,#3b82f688,#061018 78%,#02060c)",
  },
];

export function isProfilePlanProLabBgVariant(
  id: string
): id is ProfilePlanProLabBgVariant {
  return PROFILE_PLAN_PRO_LAB_BG_VARIANTS.some((v) => v.id === id);
}

export const PROFILE_PLAN_PRO_LAB_BG_DEFAULT: ProfilePlanProLabBgVariant =
  "lab-quiet-hex";
