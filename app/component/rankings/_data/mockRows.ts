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
  totalScore?: number;
  avgTotalScore?: number;
  marginPrecisionScore?: number;
  avgMarginPrecision?: number;
  upsetScore?: number;
  avgUpsetScore?: number;
};

const USERS: RankingRowWithCountry[] = Array.from({ length: 20 }).map((_, i) => {
  const id = i + 1;
  const posts = 40 - i;
  const wins = Math.floor(posts * (0.5 + Math.random() * 0.3));

  return {
    uid: `u${id}`,
    handle: `user${id}`,
    displayName: `User${id}`,

    posts, // ← これが必須

    totalScore: 420 - i * 12,
    avgTotalScore: 10 + i * 0.4,

    winRate: posts > 0 ? wins / posts : 0,

    marginPrecisionScore: 170 - i * 5,
    avgMarginPrecision: 4 + i * 0.3,

    upsetScore: 80 - i * 3,
    avgUpsetScore: 2 + i * 0.1,

    streak: Math.max(1, 6 - Math.floor(i / 3)),

    countryCode: (["US", "CN", "JP"] as string[])[i % 3],
  };
});

export const MOCK_ROWS: Record<MobileMetric, RankingRowWithCountry[]> = {
  totalScore: [...USERS].sort(
    (a, b) => (b.totalScore ?? 0) - (a.totalScore ?? 0)
  ),
  winRate: [...USERS].sort(
    (a, b) => (b.winRate ?? 0) - (a.winRate ?? 0)
  ),
  marginPrecision: [...USERS].sort(
    (a, b) => (b.marginPrecisionScore ?? 0) - (a.marginPrecisionScore ?? 0)
  ),
  upsetScore: [...USERS].sort(
    (a, b) => (b.upsetScore ?? 0) - (a.upsetScore ?? 0)
  ),
  streak: [...USERS].sort(
    (a, b) => (b.streak ?? 0) - (a.streak ?? 0)
  ),
};