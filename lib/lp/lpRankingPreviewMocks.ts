/**
 * LP / プレビュー用ランキングモック。
 * 総合スコアのみ。アバター写真は入れない（UI 側で photoURL=null → グリフ）。
 */

import type { MyRankMiniMetric } from "@/app/component/rankings/MyRankCard";
import type { RankingRowWithCountry } from "@/lib/rankings/rankingMetrics";
import type { MyRankStatsSource } from "@/lib/rankings/myRankCardFocus";
import { buildMockMyRankProgressPoints } from "@/lib/rankings/myRankRankingProgress";

export const LP_RANKING_METRIC = "totalScore" as const;

export const LP_RANKING_MY_UID = "lp-you";

export const LP_RANKING_TOTAL_ENTRIES = 186;

type Seed = {
  uid: string;
  displayName: string;
  handle: string;
  plan?: "free" | "pro";
  totalScore: number;
  posts: number;
  winRate: number;
  streak: number;
  countryCode: string;
  rankDeltaPlaces: number;
  metricValueDelta: number;
};

const SEEDS: readonly Seed[] = [
  {
    uid: "lp-nova",
    displayName: "NOVA",
    handle: "nova",
    plan: "pro",
    totalScore: 1248.6,
    posts: 58,
    winRate: 0.72,
    streak: 6,
    countryCode: "JP",
    rankDeltaPlaces: 1,
    metricValueDelta: 28,
  },
  {
    uid: "lp-kaito",
    displayName: "KAITO",
    handle: "kaito",
    plan: "pro",
    totalScore: 1191.2,
    posts: 55,
    winRate: 0.69,
    streak: 4,
    countryCode: "KR",
    rankDeltaPlaces: 2,
    metricValueDelta: 21,
  },
  {
    uid: "lp-mira",
    displayName: "MIRA",
    handle: "mira",
    totalScore: 1156.4,
    posts: 61,
    winRate: 0.66,
    streak: 3,
    countryCode: "US",
    rankDeltaPlaces: 0,
    metricValueDelta: 14,
  },
  {
    uid: LP_RANKING_MY_UID,
    displayName: "YOU",
    handle: "you",
    plan: "pro",
    totalScore: 1088,
    posts: 52,
    winRate: 0.64,
    streak: 5,
    countryCode: "JP",
    rankDeltaPlaces: 3,
    metricValueDelta: 22,
  },
  {
    uid: "lp-rex",
    displayName: "REX",
    handle: "rex",
    plan: "pro",
    totalScore: 1042.8,
    posts: 49,
    winRate: 0.61,
    streak: 2,
    countryCode: "TW",
    rankDeltaPlaces: -1,
    metricValueDelta: -6,
  },
  {
    uid: "lp-aoi",
    displayName: "AOI",
    handle: "aoi",
    totalScore: 1011.5,
    posts: 47,
    winRate: 0.6,
    streak: 1,
    countryCode: "JP",
    rankDeltaPlaces: 1,
    metricValueDelta: 11,
  },
  {
    uid: "lp-sena",
    displayName: "SENA",
    handle: "sena",
    totalScore: 986.2,
    posts: 50,
    winRate: 0.58,
    streak: 0,
    countryCode: "KR",
    rankDeltaPlaces: 0,
    metricValueDelta: 8,
  },
  {
    uid: "lp-yuki",
    displayName: "YUKI",
    handle: "yuki",
    totalScore: 954.7,
    posts: 44,
    winRate: 0.57,
    streak: 2,
    countryCode: "JP",
    rankDeltaPlaces: -2,
    metricValueDelta: -9,
  },
  {
    uid: "lp-leo",
    displayName: "LEO",
    handle: "leo",
    plan: "pro",
    totalScore: 931,
    posts: 46,
    winRate: 0.56,
    streak: 3,
    countryCode: "US",
    rankDeltaPlaces: 4,
    metricValueDelta: 19,
  },
  {
    uid: "lp-hana",
    displayName: "HANA",
    handle: "hana",
    totalScore: 902.4,
    posts: 43,
    winRate: 0.55,
    streak: 1,
    countryCode: "TH",
    rankDeltaPlaces: 0,
    metricValueDelta: 5,
  },
  {
    uid: "lp-nero",
    displayName: "NERO",
    handle: "nero",
    totalScore: 878.1,
    posts: 41,
    winRate: 0.54,
    streak: 0,
    countryCode: "JP",
    rankDeltaPlaces: 1,
    metricValueDelta: 7,
  },
  {
    uid: "lp-lyra",
    displayName: "LYRA",
    handle: "lyra",
    totalScore: 851.6,
    posts: 40,
    winRate: 0.53,
    streak: 2,
    countryCode: "KR",
    rankDeltaPlaces: -1,
    metricValueDelta: -4,
  },
];

function toRow(seed: Seed): RankingRowWithCountry {
  const posts = seed.posts;
  const totalScore = seed.totalScore;
  return {
    uid: seed.uid,
    displayName: seed.displayName,
    handle: seed.handle,
    photoURL: undefined,
    plan: seed.plan ?? "free",
    posts,
    winRate: seed.winRate,
    streak: seed.streak,
    totalScore,
    avgTotalScore: posts > 0 ? totalScore / posts : 0,
    countryCode: seed.countryCode,
    rankDeltaPlaces: seed.rankDeltaPlaces,
    metricValueDelta: seed.metricValueDelta,
  };
}

export const LP_RANKING_ROWS: RankingRowWithCountry[] = SEEDS.map(toRow);

export const LP_RANKING_MY_ROW =
  LP_RANKING_ROWS.find((row) => row.uid === LP_RANKING_MY_UID) ??
  LP_RANKING_ROWS[3];

export const LP_RANKING_MY_RANK =
  LP_RANKING_ROWS.findIndex((row) => row.uid === LP_RANKING_MY_UID) + 1;

export const LP_RANKING_MY_VALUE = LP_RANKING_MY_ROW.totalScore ?? 0;

export const LP_RANKING_MY_STATS: MyRankStatsSource = {
  totalPosts: LP_RANKING_MY_ROW.posts,
  totalPoints: LP_RANKING_MY_VALUE,
  totalUpset: 41.2,
  totalPrecision: 18.4,
};

export const LP_RANKING_MY_MINI_METRICS: MyRankMiniMetric[] = [
  {
    key: "totalScore",
    label: "totalPTS",
    value: Math.round(LP_RANKING_MY_VALUE).toLocaleString("en-US"),
    pct: Math.min(
      100,
      Math.round(
        (LP_RANKING_MY_VALUE / (LP_RANKING_ROWS[0]?.totalScore ?? 1)) * 100
      )
    ),
    dayDelta: "+22",
  },
];

/** Pro シーズンカード下段の Ranking Progress（7点） */
export const LP_RANKING_MY_PROGRESS = buildMockMyRankProgressPoints(
  LP_RANKING_MY_RANK,
  7
);
