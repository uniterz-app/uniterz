/** PRO 背景 — Wave テーマ
 * 本番採用（マイルストーン）:
 *   cyan-grid=招待5 / gold-monogram=招待10
 *   neon-ridge=月間総合Top10×3 / chem-ink=月間総合Top10（1回）
 *   ember-hex=週間総合1位×3 / obsidian-warp=週間総合1位×5
 * 追加採用:
 *   - riot-shard … Pro 即解放
 *   - crimson-shard … 連勝5 / signal-mosaic … Perfect 5（マイルストーン）
 * カタログ外（プレビューのみ）: royal-plum / stealth-facet / parchment-crest / inferno-decal
 * ※ Jagged Plate (beast-jagarmor)=月間総合Top10×5 は Beast 側
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
  | "wave-parchment-crest"
  | "wave-crimson-shard"
  | "wave-signal-mosaic"
  | "wave-riot-shard"
  | "wave-inferno-decal";

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
    swatch: "linear-gradient(160deg,#07090e,#1a2430 45%,#c8d8ec 88%)",
    cardColors: ["#07090e", "#151b24", "#05070b"],
  },
  {
    id: "wave-parchment-crest",
    label: "Parchment Crest",
    tag: "羊皮紋章",
    description: "ゴシック四芒星の紋章リピート（暗地に暖色線）。",
    swatch: "linear-gradient(160deg,#2e2418,#4a3a28 42%,#f5dca0 90%)",
    cardColors: ["#2e2418", "#4a3a28", "#1c1610"],
  },
  {
    id: "wave-crimson-shard",
    label: "Crimson Shard",
    tag: "紅裂晶",
    description: "黒の裂晶切子＋右縁から差し込む紅光。",
    swatch: "linear-gradient(115deg,#050505 35%,#1a0508 70%,#ff2a2a)",
    cardColors: ["#050505", "#120608", "#020202"],
  },
  {
    id: "wave-signal-mosaic",
    label: "Signal Mosaic",
    tag: "信号格子",
    description: "赤とシアンの入れ子菱・角括弧のサイバーモザイク。",
    swatch: "linear-gradient(160deg,#000000,#0a1014 50%,#ff1a1a 92%)",
    cardColors: ["#000000", "#061014", "#000000"],
  },
  {
    id: "wave-riot-shard",
    label: "Riot Shard",
    tag: "暴砕片",
    description: "赤の鋭角シャード＋ハッチ線のストリートグラフィティ。",
    swatch: "linear-gradient(160deg,#000000,#1a0505 45%,#ff0000 90%)",
    cardColors: ["#050000", "#140404", "#000000"],
  },
  {
    id: "wave-inferno-decal",
    label: "Inferno Decal",
    tag: "炎紋",
    description: "黒地に散らした赤炎のフラットデカール。",
    swatch: "linear-gradient(160deg,#000000,#120000 48%,#ff1a1a)",
    cardColors: ["#000000", "#100000", "#000000"],
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
