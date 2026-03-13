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
  { key: "marginPrecision", label: "点差精度" },
  { key: "upsetScore", label: "アップセットスコア" },
  { key: "streak", label: "連勝" },
];

export type CountryCode = "US" | "CN" | "JP";

export type RankingRowWithCountry = RankingRow & {
  countryCode?: CountryCode;
  totalScore?: number;
  avgTotalScore?: number;
  marginPrecisionScore?: number;
  avgMarginPrecision?: number;
  upsetScore?: number;
  avgUpsetScore?: number;
};

const USERS: RankingRowWithCountry[] = [
  {
    uid: "u1",
    handle: "alpha",
    displayName: "Alpha",
    totalScore: 412,
    avgTotalScore: 9.8,
    winRate: 0.62,
    marginPrecisionScore: 168,
    avgMarginPrecision: 4.0,
    upsetScore: 74,
    avgUpsetScore: 1.8,
    streak: 5,
    posts: 42,
    countryCode: "US",
  },
  {
    uid: "u2",
    handle: "beta",
    displayName: "Beta",
    totalScore: 389,
    avgTotalScore: 10.2,
    winRate: 0.58,
    marginPrecisionScore: 156,
    avgMarginPrecision: 4.1,
    upsetScore: 68,
    avgUpsetScore: 1.8,
    streak: 3,
    posts: 38,
    countryCode: "CN",
  },
  {
    uid: "u3",
    handle: "gamma",
    displayName: "Gamma",
    totalScore: 371,
    avgTotalScore: 12.0,
    winRate: 0.55,
    marginPrecisionScore: 149,
    avgMarginPrecision: 4.8,
    upsetScore: 82,
    avgUpsetScore: 2.6,
    streak: 6,
    posts: 31,
    countryCode: "JP",
  },
  {
    uid: "u4",
    handle: "sora",
    displayName: "ソラ",
    totalScore: 344,
    avgTotalScore: 12.3,
    winRate: 0.53,
    marginPrecisionScore: 141,
    avgMarginPrecision: 5.0,
    upsetScore: 66,
    avgUpsetScore: 2.4,
    streak: 4,
    posts: 28,
    countryCode: "JP",
  },
  {
    uid: "u5",
    handle: "ren",
    displayName: "レン",
    totalScore: 322,
    avgTotalScore: 13.4,
    winRate: 0.51,
    marginPrecisionScore: 133,
    avgMarginPrecision: 5.5,
    upsetScore: 61,
    avgUpsetScore: 2.5,
    streak: 2,
    posts: 24,
    countryCode: "JP",
  },
  {
    uid: "u6",
    handle: "haru",
    displayName: "はる",
    totalScore: 310,
    avgTotalScore: 14.1,
    winRate: 0.5,
    marginPrecisionScore: 126,
    avgMarginPrecision: 5.7,
    upsetScore: 57,
    avgUpsetScore: 2.6,
    streak: 1,
    posts: 22,
    countryCode: "JP",
  },
  {
    uid: "u7",
    handle: "mio",
    displayName: "みお",
    totalScore: 298,
    avgTotalScore: 14.9,
    winRate: 0.49,
    marginPrecisionScore: 121,
    avgMarginPrecision: 6.1,
    upsetScore: 52,
    avgUpsetScore: 2.6,
    streak: 2,
    posts: 20,
    countryCode: "JP",
  },
  {
    uid: "u8",
    handle: "yui",
    displayName: "ゆい",
    totalScore: 281,
    avgTotalScore: 15.6,
    winRate: 0.47,
    marginPrecisionScore: 116,
    avgMarginPrecision: 6.4,
    upsetScore: 48,
    avgUpsetScore: 2.7,
    streak: 1,
    posts: 18,
    countryCode: "JP",
  },
  {
    uid: "u9",
    handle: "takumi",
    displayName: "匠",
    totalScore: 267,
    avgTotalScore: 16.7,
    winRate: 0.46,
    marginPrecisionScore: 109,
    avgMarginPrecision: 6.8,
    upsetScore: 44,
    avgUpsetScore: 2.8,
    streak: 1,
    posts: 16,
    countryCode: "JP",
  },
  {
    uid: "u10",
    handle: "ayaka",
    displayName: "彩花",
    totalScore: 255,
    avgTotalScore: 18.2,
    winRate: 0.85,
    marginPrecisionScore: 103,
    avgMarginPrecision: 7.4,
    upsetScore: 40,
    avgUpsetScore: 2.9,
    streak: 1,
    posts: 14,
    countryCode: "JP",
  },
];

export const MOCK_ROWS: Record<MobileMetric, RankingRowWithCountry[]> = {
  totalScore: [...USERS].sort((a, b) => (b.totalScore ?? 0) - (a.totalScore ?? 0)),
  winRate: [...USERS].sort((a, b) => (b.winRate ?? 0) - (a.winRate ?? 0)),
  marginPrecision: [...USERS].sort(
    (a, b) => (b.marginPrecisionScore ?? 0) - (a.marginPrecisionScore ?? 0)
  ),
  upsetScore: [...USERS].sort((a, b) => (b.upsetScore ?? 0) - (a.upsetScore ?? 0)),
  streak: [...USERS].sort((a, b) => (b.streak ?? 0) - (a.streak ?? 0)),
};