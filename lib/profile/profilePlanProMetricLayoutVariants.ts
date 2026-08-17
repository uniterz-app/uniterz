/** PRO メトリクスグリッド — レイアウト案（dev ショーケース用） */

export type ProfilePlanProMetricLayoutVariant =
  | "grid"
  | "bento"
  | "slant"
  | "orbit"
  | "ribbon"
  | "terminal";

export type ProfilePlanProMetricLayoutMeta = {
  id: ProfilePlanProMetricLayoutVariant;
  label: string;
  tag: string;
  description: string;
};

export const PROFILE_PLAN_PRO_METRIC_LAYOUT_VARIANTS: ProfilePlanProMetricLayoutMeta[] =
  [
    {
      id: "grid",
      label: "Grid Glass",
      tag: "現行ベース",
      description:
        "均等 2×2。ガラスパネル＋左アクセントバー。情報密度は高く、一覧性が最も良い。",
    },
    {
      id: "bento",
      label: "Bento Hero",
      tag: "非対称",
      description:
        "勝率を全幅ヒーローに。得点を縦長、残り2枚を右に積む。主役メトリクスが一目でわかる。",
    },
    {
      id: "slant",
      label: "Slant Stack",
      tag: "斜め HUD",
      description:
        "平行四辺形カードを段差配置。Cyber 斜めタブと同系統の攻めたシルエット。",
    },
    {
      id: "orbit",
      label: "Orbit Cross",
      tag: "放射",
      description:
        "4 指標を十字配置。中央ハブからデータが放射される司令室 UI。",
    },
    {
      id: "ribbon",
      label: "Data Ribbon",
      tag: "横ストリップ",
      description:
        "全幅リボンを縦積み。ラベル左・数値右のリスト型。スキャンしやすい。",
    },
    {
      id: "terminal",
      label: "Terminal Feed",
      tag: "ターミナル",
      description:
        "等幅フォントの読み出しログ。括弧とドットリーダーでテック感を強調。",
    },
  ];

export const PROFILE_PLAN_PRO_METRIC_LAYOUT_DEFAULT: ProfilePlanProMetricLayoutVariant =
  "grid";

/** Cyber 寄り — ショーケース用（grid 除く） */
export const PROFILE_PLAN_PRO_CYBER_METRIC_LAYOUT_VARIANTS =
  PROFILE_PLAN_PRO_METRIC_LAYOUT_VARIANTS.filter((v) => v.id !== "grid");
