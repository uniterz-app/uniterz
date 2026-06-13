import type { ProfileEditTronIdentity, ProfileEditTronStats } from "./profileEditTronTypes";

export const KINETIK_GREEN = "#a8ff2a";
export const KINETIK_MAGENTA = "#ff2bd6";
export const KINETIK_CYAN = "#22d3ee";
export const KINETIK_RED = "#ff4757";

export type ProfileEditKinetikStats = ProfileEditTronStats & {
  totalPointsRank?: number | null;
  /** 総合得点順位の母数（上位%バッジ算出用） */
  totalPointsRankDenominator?: number | null;
  /** 前日比の順位変動（+で上昇）— Rising 判定 */
  rankDeltaPlaces?: number | null;
  /** 現在の連勝数（アバター周り演出用） */
  winStreak?: number;
};

export const PROFILE_EDIT_KINETIK_MOCK: {
  identity: ProfileEditTronIdentity;
  stats: ProfileEditKinetikStats;
} = {
  identity: {
    systemId: "0092-XFF-SYSTEM",
    displayName: "KINETIK_VOID",
    handle: "kinetik_void",
    photoURL: null,
    reputationPct: 78,
  },
  stats: {
    winRate: 68.4,
    posts: 41,
    hits: 28,
    scorePrecision: 312.0,
    totalPoints: 1284,
    totalPointsRank: 14,
    totalPointsRankDenominator: 1400,
    rankDeltaPlaces: 0,
    winStreak: 5,
    upset: 96.5,
  },
};
