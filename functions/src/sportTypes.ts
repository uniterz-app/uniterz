// functions/src/calcScorePrecision/sportTypes.ts

/** 
 * 各リーグを大分類スポーツにマッピング
 * "basketball" または "football"
 */
export const SPORT_TYPE_BY_LEAGUE: Record<string, "basketball" | "football"> = {
  // Basketball
  b1: "basketball",
  bj: "basketball",
  b2: "basketball",
  nba: "basketball",

  // Football (Soccer)
  j1: "football",
  j2: "football",
  pl: "football",
  epl: "football",
  premier: "football",
};
