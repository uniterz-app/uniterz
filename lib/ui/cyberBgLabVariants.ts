/** アプリ向け cyber 背景ラボ — バリエーション定義 */

export type CyberBgLabVariant =
  | "nebula"
  | "hex-hive"
  | "signal"
  | "tunnel"
  | "radar"
  | "data-stream"
  | "circuit"
  | "prism-split";

export type CyberBgLabVariantMeta = {
  id: CyberBgLabVariant;
  label: string;
  tag: string;
  description: string;
  mood: string;
};

export const CYBER_BG_LAB_VARIANTS: CyberBgLabVariantMeta[] = [
  {
    id: "nebula",
    label: "Nebula Drift",
    tag: "宇宙系",
    description: "大きな星雲ブロブがゆっくり漂う。Games 背景の進化版。",
    mood: "没入・ダイナミック",
  },
  {
    id: "hex-hive",
    label: "Hex Hive",
    tag: "HUD",
    description: "六角ハニカム＋隅の HUD コーナー。テック感。",
    mood: "精密・未来的",
  },
  {
    id: "signal",
    label: "Signal Scope",
    tag: "データ",
    description: "オシロスコープ風の波形ライン。スポーツ解析 vibe。",
    mood: "計測・リアルタイム",
  },
  {
    id: "tunnel",
    label: "Void Tunnel",
    tag: "深度",
    description: "中央へ収束する透視グリッド。奥行きとスピード感。",
    mood: "疾走・没入",
  },
  {
    id: "radar",
    label: "Radar Sweep",
    tag: "戦術",
    description: "下部から回転するレーダー扇形。試合分析 HUD。",
    mood: "戦略・緊張感",
  },
  {
    id: "data-stream",
    label: "Data Stream",
    tag: "フロー",
    description: "縦に流れるデータ列。軽い Matrix 風。",
    mood: "情報・ライブ感",
  },
  {
    id: "circuit",
    label: "Circuit Trace",
    tag: "基板",
    description: "回路トレース＋発光ノード。サイバーパンク寄り。",
    mood: "ハードウェア・テック",
  },
  {
    id: "prism-split",
    label: "Prism Split",
    tag: "エディトリアル",
    description: "斜め二色分割＋色収差エッジ。目新しいコントラスト。",
    mood: "大胆・モダン",
  },
];
