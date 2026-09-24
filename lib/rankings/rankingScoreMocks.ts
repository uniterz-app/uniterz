/**
 * ランキング画面用・スコア（totalPoints）のみのモック。
 * 本番データが空のとき一覧を埋める。オフにするには RANKINGS_SCORE_MOCK_ENABLED を false。
 */

import type { BulkMetricPayload } from "@/lib/rankings/useCumulativeRankingsBulk";

/** true のあいだ totalPoints 一覧をモックで埋める（他指標は触らない） */
export const RANKINGS_SCORE_MOCK_ENABLED = true;

type MockSeed = {
  uid: string;
  displayName: string;
  handle: string;
  plan?: "free" | "pro";
  totalPoints: number;
  totalPosts: number;
  winRate: number;
  countryCode: string;
  rankDeltaPlaces: number;
  metricValueDelta: number;
};

const MOCK_UID = "mock-you";

const SEEDS: readonly MockSeed[] = [
  {
    uid: "mock-nova",
    displayName: "NOVA",
    handle: "nova",
    plan: "pro",
    totalPoints: 1249,
    totalPosts: 58,
    winRate: 0.72,
    countryCode: "JP",
    rankDeltaPlaces: 1,
    metricValueDelta: 28,
  },
  {
    uid: "mock-kaito",
    displayName: "KAITO",
    handle: "kaito",
    plan: "pro",
    totalPoints: 1191,
    totalPosts: 55,
    winRate: 0.69,
    countryCode: "KR",
    rankDeltaPlaces: 2,
    metricValueDelta: 21,
  },
  {
    uid: "mock-mira",
    displayName: "MIRA",
    handle: "mira",
    totalPoints: 1156,
    totalPosts: 61,
    winRate: 0.66,
    countryCode: "US",
    rankDeltaPlaces: 0,
    metricValueDelta: 14,
  },
  {
    uid: MOCK_UID,
    displayName: "YOU",
    handle: "you",
    plan: "pro",
    totalPoints: 1088,
    totalPosts: 52,
    winRate: 0.64,
    countryCode: "JP",
    rankDeltaPlaces: 3,
    metricValueDelta: 22,
  },
  {
    uid: "mock-rex",
    displayName: "REX",
    handle: "rex",
    plan: "pro",
    totalPoints: 1043,
    totalPosts: 49,
    winRate: 0.61,
    countryCode: "TW",
    rankDeltaPlaces: -1,
    metricValueDelta: -6,
  },
  {
    uid: "mock-aoi",
    displayName: "AOI",
    handle: "aoi",
    totalPoints: 1012,
    totalPosts: 47,
    winRate: 0.6,
    countryCode: "JP",
    rankDeltaPlaces: 1,
    metricValueDelta: 11,
  },
  {
    uid: "mock-sena",
    displayName: "SENA",
    handle: "sena",
    totalPoints: 986,
    totalPosts: 50,
    winRate: 0.58,
    countryCode: "KR",
    rankDeltaPlaces: 0,
    metricValueDelta: 8,
  },
  {
    uid: "mock-yuki",
    displayName: "YUKI",
    handle: "yuki",
    totalPoints: 955,
    totalPosts: 44,
    winRate: 0.57,
    countryCode: "JP",
    rankDeltaPlaces: -2,
    metricValueDelta: -9,
  },
  {
    uid: "mock-leo",
    displayName: "LEO",
    handle: "leo",
    plan: "pro",
    totalPoints: 931,
    totalPosts: 46,
    winRate: 0.56,
    countryCode: "US",
    rankDeltaPlaces: 4,
    metricValueDelta: 19,
  },
  {
    uid: "mock-hana",
    displayName: "HANA",
    handle: "hana",
    totalPoints: 902,
    totalPosts: 43,
    winRate: 0.55,
    countryCode: "TH",
    rankDeltaPlaces: 0,
    metricValueDelta: 5,
  },
  {
    uid: "mock-nero",
    displayName: "NERO",
    handle: "nero",
    totalPoints: 878,
    totalPosts: 41,
    winRate: 0.54,
    countryCode: "JP",
    rankDeltaPlaces: 1,
    metricValueDelta: 7,
  },
  {
    uid: "mock-lyra",
    displayName: "LYRA",
    handle: "lyra",
    totalPoints: 852,
    totalPosts: 40,
    winRate: 0.53,
    countryCode: "KR",
    rankDeltaPlaces: -1,
    metricValueDelta: -4,
  },
];

function toApiRow(seed: MockSeed, rank: number, uidOverride?: string | null) {
  const uid = uidOverride && seed.uid === MOCK_UID ? uidOverride : seed.uid;
  const posts = seed.totalPosts;
  const wins = Math.round(posts * seed.winRate);
  return {
    uid,
    displayName: seed.displayName,
    handle: seed.handle,
    photoURL: null,
    plan: seed.plan ?? "free",
    totalPosts: posts,
    totalWins: wins,
    winRate: seed.winRate,
    totalPoints: seed.totalPoints,
    totalPrecision: Math.round(seed.totalPoints * 0.12),
    totalExactHits: Math.round(posts * 0.18),
    totalUpset: Math.round(seed.totalPoints * 0.08),
    totalGoalScorerHits: Math.round(posts * 0.22),
    currentStreak: Math.max(0, Math.round(seed.winRate * 6)),
    activeWinStreak: Math.max(0, Math.round(seed.winRate * 6)),
    countryCode: seed.countryCode,
    rankDeltaPlaces: seed.rankDeltaPlaces,
    metricValueDelta: seed.metricValueDelta,
    rank,
  };
}

export function buildRankingScoreMockBundle(
  myUid?: string | null
): BulkMetricPayload {
  const rows = SEEDS.map((seed, i) => toApiRow(seed, i + 1, myUid));
  const youIndex = SEEDS.findIndex((s) => s.uid === MOCK_UID);
  const myRank = youIndex >= 0 ? youIndex + 1 : 4;
  const myRow = rows[myRank - 1] ?? rows[3] ?? null;

  return {
    ok: true,
    rows,
    count: rows.length,
    myRank,
    myRow: myRow as unknown as Record<string, unknown>,
    myRankDeltaPlaces: SEEDS[myRank - 1]?.rankDeltaPlaces ?? 3,
  };
}

/**
 * totalPoints が空（または未設定）のときだけモックを差し込む。
 * 他メトリクスはそのまま。
 */
export function applyRankingScoreMock<T extends Record<string, BulkMetricPayload>>(
  byMetric: T | null | undefined,
  myUid?: string | null
): T | null | undefined {
  if (!RANKINGS_SCORE_MOCK_ENABLED) return byMetric;
  if (!byMetric) return byMetric;

  const existing = byMetric.totalPoints;
  const rows = existing?.rows;
  const hasRows = Array.isArray(rows) && rows.length > 0;
  if (hasRows) return byMetric;

  return {
    ...byMetric,
    totalPoints: buildRankingScoreMockBundle(myUid),
  };
}
