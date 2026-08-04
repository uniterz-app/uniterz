/** PRO 背景 — Wave9 テーマ
 * 本番採用（マイルストーン）:
 *   cyan-grid=招待5 / gold-monogram=招待10
 *   ember-hex=月間総合Top10×3 / chem-ink=×5
 *   neon-ridge=週間総合1位×3 / obsidian-warp=×5
 * プレビューのみ: royal-plum / stealth-facet / parchment-crest
 */

export type ProfilePlanProWaveBgVariant =
  | "wave-royal-plum"
  | "wave-obsidian-warp"
  | "wave-cyan-grid"
  | "wave-ember-hex"
  | "wave-neon-ridge"
  | "wave-chem-ink"
  | "wave-gold-monogram"
  | "wave-stealth-facet"
  | "wave-parchment-crest";

export type ProfilePlanProWaveBgMeta = {
  id: ProfilePlanProWaveBgVariant;
  label: string;
  tag: string;
  description: string;
  swatch: string;
  /** Native カード地（LinearGradient colors） */
  cardColors: readonly [string, string, string];
};

export const PROFILE_PLAN_PRO_WAVE_BG_VARIANTS: ProfilePlanProWaveBgMeta[] = [
  {
    id: "wave-royal-plum",
    label: "Royal Plum",
    tag: "紫金格子",
    description: "プラム地にブロンズの装飾タイル（線画）。",
    swatch: "linear-gradient(160deg,#1a0815,#2b1026 48%,#0a0408)",
    cardColors: ["#12060f", "#2a1224", "#080308"],
  },
  {
    id: "wave-obsidian-warp",
    label: "Obsidian Warp",
    tag: "黒曜石歪曲",
    description: "歪んだ等角ダイヤモンドのモノクロ面。",
    swatch: "linear-gradient(160deg,#050505,#141414 50%,#020202)",
    cardColors: ["#060606", "#121212", "#030303"],
  },
  {
    id: "wave-cyan-grid",
    label: "Cyan Grid",
    tag: "電光回路",
    description: "入れ子矩形＋交点スパークのシアン回路。",
    swatch: "linear-gradient(160deg,#000000,#021018 48%,#000000)",
    cardColors: ["#000000", "#041820", "#000408"],
  },
  {
    id: "wave-ember-hex",
    label: "Ember Hex",
    tag: "炎六角",
    description: "ヘクス格子と溶芯フィルの赤橙。",
    swatch: "linear-gradient(160deg,#050000,#1a0500 45%,#000000)",
    cardColors: ["#080200", "#1c0800", "#020000"],
  },
  {
    id: "wave-neon-ridge",
    label: "Neon Ridge",
    tag: "霓虹稜",
    description: "マゼンタ〜シアンのヘクス稜線。",
    swatch: "linear-gradient(160deg,#050008,#1a0820 40%,#041820)",
    cardColors: ["#08040c", "#180820", "#041018"],
  },
  {
    id: "wave-chem-ink",
    label: "Chem Ink",
    tag: "分子墨",
    description: "六員環と結合腕・原子ラベルの分子スケッチ。",
    swatch: "linear-gradient(160deg,#000000,#0a0000 50%,#000000)",
    cardColors: ["#000000", "#0c0404", "#000000"],
  },
  {
    id: "wave-gold-monogram",
    label: "Gold Monogram",
    tag: "金紋",
    description: "疎な八芒星モノグラムの金線。",
    swatch: "linear-gradient(160deg,#000000,#1a1408 48%,#000000)",
    cardColors: ["#050400", "#161208", "#020200"],
  },
  {
    id: "wave-stealth-facet",
    label: "Stealth Facet",
    tag: "切子黒",
    description: "低ポリ切子モザイクのマット装甲。",
    swatch: "linear-gradient(160deg,#000000,#121212 50%,#000000)",
    cardColors: ["#040404", "#101010", "#020202"],
  },
  {
    id: "wave-parchment-crest",
    label: "Parchment Crest",
    tag: "羊皮紋章",
    description: "ゴシック四芒星の紋章リピート（暗地に暖色線）。",
    swatch: "linear-gradient(160deg,#2a2218,#3d3226 50%,#1a1410)",
    cardColors: ["#2a2218", "#3d3226", "#1a1410"],
  },
];

export function isProfilePlanProWaveBgVariant(
  id: string
): id is ProfilePlanProWaveBgVariant {
  return PROFILE_PLAN_PRO_WAVE_BG_VARIANTS.some((v) => v.id === id);
}

export function getProfilePlanProWaveBgMeta(
  id: ProfilePlanProWaveBgVariant
): ProfilePlanProWaveBgMeta | undefined {
  return PROFILE_PLAN_PRO_WAVE_BG_VARIANTS.find((v) => v.id === id);
}
