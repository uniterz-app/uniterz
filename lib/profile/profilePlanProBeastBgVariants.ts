/** PRO 背景 — 獣皮 / 宝石 / 甲殻（高級感比較用） */

export type ProfilePlanProBeastBgVariant =
  | "beast-panther"
  | "beast-crocodile"
  | "beast-tiger"
  | "beast-drake"
  | "beast-raven"
  | "beast-wolf"
  | "beast-diamond"
  | "beast-marble"
  | "beast-viper"
  | "beast-shark"
  | "beast-falcon"
  | "beast-leopard"
  | "beast-scorpion"
  | "beast-beetle"
  | "beast-manta"
  | "beast-turtle"
  | "beast-carbon"
  | "beast-damascus"
  | "beast-titanium"
  | "beast-velvet"
  | "beast-chrome"
  | "beast-kintsugi"
  | "beast-meteorite"
  | "beast-holosilk"
  | "beast-monogram"
  | "beast-chain"
  | "beast-chevron"
  | "beast-damier"
  | "beast-crown"
  | "beast-constellation"
  | "beast-circuitlace"
  | "beast-ripple";

export type ProfilePlanProBeastBgMeta = {
  id: ProfilePlanProBeastBgVariant;
  label: string;
  tag: string;
  description: string;
  swatch: string;
};

export const PROFILE_PLAN_PRO_BEAST_BG_VARIANTS: ProfilePlanProBeastBgMeta[] = [
  {
    id: "beast-panther",
    label: "Midnight Panther",
    tag: "黒豹",
    description:
      "黒豹の毛並みと薄い斑点。ブラック×紫。流れのあるファーと淡いロゼットで高級感。",
    swatch:
      "linear-gradient(150deg, #050308, #1a0a1e 40%, #7c3aed44 60%, #020104)",
  },
  {
    id: "beast-crocodile",
    label: "Onyx Crocodile",
    tag: "クロコ",
    description:
      "クロコダイルの大型鱗。黒×深緑。レザー製品のような重厚な腹板。",
    swatch:
      "linear-gradient(145deg, #050807, #0a1a12 35%, #14532d66 55%, #030504)",
  },
  {
    id: "beast-tiger",
    label: "White Tiger",
    tag: "白虎",
    description:
      "細く抽象化した虎縞。黒×シルバー。鋭くスポーティーな斜めストライプ。",
    swatch:
      "linear-gradient(155deg, #060608, #1c1c22 40%, #c8d0dc55 58%, #030305)",
  },
  {
    id: "beast-drake",
    label: "Dragon Scale",
    tag: "龍鱗",
    description:
      "重なった六角形の龍鱗。黒×赤紫。サイバーとの相性が強いハニカム。",
    swatch:
      "linear-gradient(148deg, #0a0408, #2a0a1a 38%, #c026d355 58%, #050204)",
  },
  {
    id: "beast-raven",
    label: "Raven Feather",
    tag: "烏羽",
    description:
      "カラスの羽根が流れる模様。黒×青紫。光の角度で羽根の羽軸が浮かぶ。",
    swatch:
      "linear-gradient(160deg, #04060c, #12082a 40%, #6366f155 62%, #020408)",
  },
  {
    id: "beast-wolf",
    label: "Arctic Wolf",
    tag: "北極狼",
    description:
      "斜めに流れる毛並み。黒×アイスブルー。冷たい高級感のファーフロー。",
    swatch:
      "linear-gradient(152deg, #04080c, #0a1822 42%, #67e8f655 60%, #020508)",
  },
  {
    id: "beast-diamond",
    label: "Black Diamond",
    tag: "黒ダイヤ",
    description:
      "宝石のファセット模様。黒×シアン。PRO らしさを出しやすい切子面。",
    swatch:
      "linear-gradient(145deg, #020810, #0a2030 40%, #22d3ee66 58%, #010508)",
  },
  {
    id: "beast-marble",
    label: "Obsidian Marble",
    tag: "黒大理石",
    description:
      "黒大理石の細い亀裂。黒×ゴールド。最もラグジュアリな静脈模様。",
    swatch:
      "linear-gradient(148deg, #080604, #1a1408 38%, #d4a01755 58%, #040302)",
  },
  {
    id: "beast-viper",
    label: "Golden Viper",
    tag: "金蛇",
    description:
      "細かい蛇鱗。黒×ゴールド。緻密なダイヤモンド鱗でラグジュアリ。",
    swatch:
      "linear-gradient(148deg, #080604, #1a1408 36%, #d4a01766 58%, #040302)",
  },
  {
    id: "beast-shark",
    label: "Shark Skin",
    tag: "鮫肌",
    description:
      "細かな V 字状の皮膚パターン。黒×ブルー。流体力学的な質感。",
    swatch:
      "linear-gradient(150deg, #040810, #0a1a2e 40%, #3b82f666 58%, #020508)",
  },
  {
    id: "beast-falcon",
    label: "Falcon Wing",
    tag: "隼翼",
    description:
      "羽根を幾何学的に配置。黒×シルバー。鋭角の飛行機翼のような整列。",
    swatch:
      "linear-gradient(155deg, #06080a, #1a1e24 40%, #94a3b866 58%, #030406)",
  },
  {
    id: "beast-leopard",
    label: "Snow Leopard",
    tag: "雪豹",
    description:
      "斑点を円ではなくデジタル粒子化。黒×アイスシルバー。サイバーロゼット。",
    swatch:
      "linear-gradient(148deg, #06080c, #1a2030 38%, #cbd5e166 58%, #030508)",
  },
  {
    id: "beast-scorpion",
    label: "Scorpion Armor",
    tag: "蠍甲",
    description:
      "節のある甲殻パターン。黒×赤。関節がつながる重装甲感。",
    swatch:
      "linear-gradient(148deg, #0a0404, #2a0a0a 38%, #dc262666 58%, #050202)",
  },
  {
    id: "beast-beetle",
    label: "Beetle Shell",
    tag: "玉虫",
    description:
      "玉虫色の甲殻。黒×青緑グラデーション。光の角度で色が移る甲羅。",
    swatch:
      "linear-gradient(145deg, #040a0c, #0a2a28 35%, #2dd4bf55 55%, #1d4ed855, #020608)",
  },
  {
    id: "beast-manta",
    label: "Manta Flow",
    tag: "マンタ",
    description:
      "エイの翼を思わせる滑らかな曲線。黒×ディープブルー。流体の優雅さ。",
    swatch:
      "linear-gradient(160deg, #030810, #0a1830 42%, #2563eb55 62%, #02060c)",
  },
  {
    id: "beast-turtle",
    label: "Turtle Armor",
    tag: "亀甲",
    description:
      "不規則な甲羅パネル。六角形より自然な有機多角形。黒×アンバー緑。",
    swatch:
      "linear-gradient(148deg, #060805, #1a2210 38%, #a3a32a55 58%, #030402)",
  },
  {
    id: "beast-carbon",
    label: "Carbon Weave",
    tag: "カーボン",
    description:
      "極細カーボン織り。斜めツイルの微細クロスハッチ。黒×ガンメタル。",
    swatch:
      "linear-gradient(145deg, #050608, #1a1e24 40%, #64748b55 58%, #030406)",
  },
  {
    id: "beast-damascus",
    label: "Damascus Steel",
    tag: "ダマスカス",
    description:
      "波打つ鋼の木目。層状のうねりバンド。黒×スチールシルバー。",
    swatch:
      "linear-gradient(160deg, #08090c, #2a3038 38%, #94a3b866 55%, #040506)",
  },
  {
    id: "beast-titanium",
    label: "Brushed Titanium",
    tag: "チタン",
    description:
      "縦方向の金属ヘアライン。冷たいブラッシュドメタル。黒×チタングレー。",
    swatch:
      "linear-gradient(180deg, #0a0c10, #3f4654 45%, #c8d0dc44 70%, #050608)",
  },
  {
    id: "beast-velvet",
    label: "Black Velvet",
    tag: "ベルベット",
    description:
      "光が部分的に沈むベルベット質感。深い黒の沈みと端の淡いキャッチライト。",
    swatch:
      "linear-gradient(150deg, #020203, #1a0a18 40%, #4c1d9544 60%, #010102)",
  },
  {
    id: "beast-chrome",
    label: "Liquid Chrome",
    tag: "液体金属",
    description:
      "液体金属の緩やかな反射。リボン状のハイライトが流れる。黒×ミラーシルバー。",
    swatch:
      "linear-gradient(155deg, #06080c, #1e293b 35%, #e2e8f066 55%, #38bdf855, #030508)",
  },
  {
    id: "beast-kintsugi",
    label: "Cracked Gold",
    tag: "金継ぎ",
    description:
      "黒地に細い金継ぎライン。割れ目を金で継いだラグジュアリ修復美。",
    swatch:
      "linear-gradient(148deg, #080604, #1a1408 38%, #d4a01766 58%, #040302)",
  },
  {
    id: "beast-meteorite",
    label: "Meteorite",
    tag: "隕石",
    description:
      "隕石表面の結晶模様。ウィドマンシュテッテン風の交差ニードル。黒×鉄錆銀。",
    swatch:
      "linear-gradient(145deg, #0a0806, #2a2418 40%, #a8a29e55 58%, #050403)",
  },
  {
    id: "beast-holosilk",
    label: "Holographic Silk",
    tag: "偏光シルク",
    description:
      "布の折り目に沿った淡い偏光。シアン〜マゼンタが折り目で移る。",
    swatch:
      "linear-gradient(160deg, #06040c, #1a1030 35%, #22d3ee44 50%, #e879f944 65%, #030208)",
  },
  {
    id: "beast-monogram",
    label: "Monogram Grid",
    tag: "モノグラム",
    description:
      "Uniterz の「U」を小さく反復。ラグジュアリブランドのモノグラムグリッド。",
    swatch:
      "linear-gradient(145deg, #050810, #0a2030 40%, #22d3ee55 58%, #010508)",
  },
  {
    id: "beast-chain",
    label: "Interlock Chain",
    tag: "鎖環",
    description:
      "鎖やリングが連結したパターン。黒×プラチナ。重なり合う円環。",
    swatch:
      "linear-gradient(150deg, #08090c, #1e2430 40%, #94a3b866 58%, #040506)",
  },
  {
    id: "beast-chevron",
    label: "Royal Chevron",
    tag: "V字模様",
    description:
      "細い V 字を重ねた織物風模様。黒×ゴールド。ロイヤルなヘリンボーン。",
    swatch:
      "linear-gradient(155deg, #0a0804, #1a1408 38%, #d4a01755 58%, #040302)",
  },
  {
    id: "beast-damier",
    label: "Neo Damier",
    tag: "ダミエ",
    description:
      "市松模様を歪ませたサイバー版ダミエ。黒×シアンの斜めチェック。",
    swatch:
      "linear-gradient(145deg, #04080c, #0a1828 35%, #22d3ee44 50%, #1e293b66 70%, #020508)",
  },
  {
    id: "beast-crown",
    label: "Crown Matrix",
    tag: "王冠",
    description:
      "小さな王冠をドット状に反復。黒×ゴールド。点在するロイヤルモチーフ。",
    swatch:
      "linear-gradient(148deg, #080604, #1a1408 40%, #f59e0b55 58%, #040302)",
  },
  {
    id: "beast-constellation",
    label: "Constellation",
    tag: "星座",
    description:
      "点と細線で構成した星座模様。黒×アイスブルー。夜空の結線図。",
    swatch:
      "linear-gradient(150deg, #03060c, #0a1830 42%, #7dd3fc55 60%, #020408)",
  },
  {
    id: "beast-circuitlace",
    label: "Circuit Lace",
    tag: "回路レース",
    description:
      "レース模様と電子回路を融合。黒×バイオレット×シアンの繊細ネット。",
    swatch:
      "linear-gradient(160deg, #06040c, #1a1030 35%, #a78bfa44 50%, #22d3ee44 65%, #030208)",
  },
  {
    id: "beast-ripple",
    label: "Void Ripple",
    tag: "虚波紋",
    description:
      "水面の波紋のような暗い同心円。黒×ディープブルー。静かなリップル。",
    swatch:
      "linear-gradient(148deg, #02060c, #0a1528 45%, #1e3a5f55 65%, #010408)",
  },
];

/** Round 3 のみ（比較ナビ用） */
export const PROFILE_PLAN_PRO_BEAST_BG_ROUND3: ProfilePlanProBeastBgVariant[] = [
  "beast-viper",
  "beast-shark",
  "beast-falcon",
  "beast-leopard",
  "beast-scorpion",
  "beast-beetle",
  "beast-manta",
  "beast-turtle",
];

/** Round 4 — 素材 / 金属 / 布 */
export const PROFILE_PLAN_PRO_BEAST_BG_ROUND4: ProfilePlanProBeastBgVariant[] = [
  "beast-carbon",
  "beast-damascus",
  "beast-titanium",
  "beast-velvet",
  "beast-chrome",
  "beast-kintsugi",
  "beast-meteorite",
  "beast-holosilk",
];

/** Round 5 — ブランド / 幾何 / 結線 */
export const PROFILE_PLAN_PRO_BEAST_BG_ROUND5: ProfilePlanProBeastBgVariant[] = [
  "beast-monogram",
  "beast-chain",
  "beast-chevron",
  "beast-damier",
  "beast-crown",
  "beast-constellation",
  "beast-circuitlace",
  "beast-ripple",
];

export const PROFILE_PLAN_PRO_BEAST_BG_DEFAULT: ProfilePlanProBeastBgVariant =
  "beast-panther";

export function isProfilePlanProBeastBgVariant(
  id: string
): id is ProfilePlanProBeastBgVariant {
  return PROFILE_PLAN_PRO_BEAST_BG_VARIANTS.some((v) => v.id === id);
}
