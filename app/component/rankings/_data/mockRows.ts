import type { RankingRow } from "@/lib/rankings/types";

export type MobileMetric =
  | "totalScore"
  | "winRate"
  | "marginPrecision"
  | "exactHits"
  | "upsetScore"
  | "streak"
  | "goalScorerHits";

export const METRICS: { key: MobileMetric; label: string }[] = [
  { key: "totalScore", label: "総合スコア" },
  { key: "winRate", label: "勝率" },
  { key: "marginPrecision", label: "スコア精度" },
  { key: "exactHits", label: "完全的中" },
  { key: "upsetScore", label: "アップセットスコア" },
  { key: "streak", label: "連勝" },
  { key: "goalScorerHits", label: "得点者的中" },
];

/** NBA 共通の指標（WC では goalScorerHits を追加表示） */
export const NBA_RANKING_METRICS: MobileMetric[] = [
  "totalScore",
  "winRate",
  "marginPrecision",
  "upsetScore",
  "streak",
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
  avgMarginPrecision?: number;
  upsetScore?: number;
  avgUpsetScore?: number;
  goalScorerHits?: number;
};