import type { RankingRow } from "@/lib/rankings/types";

export type MobileMetric =
  | "totalScore"
  | "winRate"
  /** ランキングからは廃止済み — 旧コミュニティグループ（totalPrecision）の表示互換用 */
  | "marginPrecision"
  | "exactHits"
  | "upsetScore"
  | "streak"
  | "goalScorerHits";

export const METRICS: { key: MobileMetric; label: string }[] = [
  { key: "totalScore", label: "総合スコア" },
  { key: "winRate", label: "勝率" },
  { key: "exactHits", label: "完全的中" },
  { key: "upsetScore", label: "アップセットスコア" },
  { key: "streak", label: "連勝" },
  { key: "goalScorerHits", label: "得点者的中" },
];

/** NBA 共通の指標（最多得点者的中は goalScorerHits） */
export const NBA_RANKING_METRICS: MobileMetric[] = [
  "totalScore",
  "winRate",
  "upsetScore",
  "goalScorerHits",
];

export const WC_RANKING_METRICS: MobileMetric[] = [
  "totalScore",
  "winRate",
  "exactHits",
  "upsetScore",
  "streak",
  "goalScorerHits",
];

// Firestore に保存された countryCode は将来的に増えるため、ここでは汎用stringで扱います。
export type CountryCode = string;

export type RankingRowWithCountry = RankingRow & {
  countryCode?: CountryCode;
  /** 前日比順位差（正=上昇）。スナップショット行のみ。 */
  rankDeltaPlaces?: number;
  /** 選択指標の前日比。スナップショット行のみ。 */
  metricValueDelta?: number;
  totalScore?: number;
  avgTotalScore?: number;
  marginPrecisionScore?: number;
  exactHits?: number;
  totalExactHits?: number;
  avgMarginPrecision?: number;
  upsetScore?: number;
  avgUpsetScore?: number;
  goalScorerHits?: number;
  /** Pro Skin（ランキング行背景）。Pro かつ採用スキン時のみ描画 */
  planProBgVariant?: string;
};