import type { RankingRow } from "@/lib/rankings/types";

export type MobileMetric =
  | "totalScore"
  | "winRate"
  | "marginPrecision"
  | "upsetScore"
  | "streak";

export const METRICS: { key: MobileMetric; label: string }[] = [
  { key: "totalScore", label: "総合スコア" },
  { key: "winRate", label: "勝率" },
  { key: "marginPrecision", label: "スコア精度" },
  { key: "upsetScore", label: "アップセットスコア" },
  { key: "streak", label: "連勝" },
];

// Firestore に保存された countryCode は将来的に増えるため、ここでは汎用stringで扱います。
export type CountryCode = string;

export type RankingRowWithCountry = RankingRow & {
  countryCode?: CountryCode;
  /** 前日比順位差（正=上昇）。スナップショット行のみ。 */
  rankDeltaPlaces?: number;
  totalScore?: number;
  avgTotalScore?: number;
  marginPrecisionScore?: number;
  avgMarginPrecision?: number;
  upsetScore?: number;
  avgUpsetScore?: number;
};