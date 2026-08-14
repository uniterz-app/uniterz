/** __DEV__ ランキングリスト見た目プレビュー用モック。写真アバターは使わない。 */

export type RankingListPreviewRow = {
  rank: number;
  displayName: string;
  handle: string;
  countryCode: string;
  score: number;
  posts: number;
  rankDelta: number;
  plan: "free" | "pro";
};

export const RANKING_LIST_PREVIEW_ROWS: readonly RankingListPreviewRow[] = [
  {
    rank: 1,
    displayName: "NOVA",
    handle: "nova",
    countryCode: "JP",
    score: 1248.6,
    posts: 58,
    rankDelta: 2,
    plan: "pro",
  },
  {
    rank: 2,
    displayName: "KAITO",
    handle: "kaito",
    countryCode: "KR",
    score: 1191.2,
    posts: 55,
    rankDelta: 1,
    plan: "pro",
  },
  {
    rank: 3,
    displayName: "MIRA",
    handle: "mira",
    countryCode: "US",
    score: 1156.4,
    posts: 61,
    rankDelta: 0,
    plan: "free",
  },
  {
    rank: 4,
    displayName: "YOU",
    handle: "you",
    countryCode: "JP",
    score: 1088,
    posts: 52,
    rankDelta: 3,
    plan: "pro",
  },
  {
    rank: 5,
    displayName: "REN",
    handle: "ren",
    countryCode: "FR",
    score: 1042.1,
    posts: 47,
    rankDelta: -1,
    plan: "free",
  },
  {
    rank: 6,
    displayName: "AYA",
    handle: "aya",
    countryCode: "TW",
    score: 998.4,
    posts: 44,
    rankDelta: 1,
    plan: "free",
  },
  {
    rank: 7,
    displayName: "LEO",
    handle: "leo",
    countryCode: "BR",
    score: 961.8,
    posts: 41,
    rankDelta: -2,
    plan: "free",
  },
  {
    rank: 8,
    displayName: "YUKI",
    handle: "yuki",
    countryCode: "JP",
    score: 920.3,
    posts: 39,
    rankDelta: 0,
    plan: "free",
  },
];
