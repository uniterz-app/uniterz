export type ProfileEditTronStats = {
  winRate: number;
  posts: number;
  hits: number;
  /** WC のみで表示する完全的中数（NBA プロフィールでは使わない） */
  exactHits: number;
  /** NBA 最多得点者的中数 */
  goalScorerHits: number;
  totalPoints: number;
  upset: number;
};

export type ProfileEditTronIdentity = {
  systemId: string;
  displayName: string;
  handle: string;
  photoURL?: string | null;
  statusLabel?: string;
  /** 0–100 — 左塔のセグメントバー */
  reputationPct?: number;
};

export const PROFILE_EDIT_TRON_MOCK: {
  identity: ProfileEditTronIdentity;
  stats: ProfileEditTronStats;
} = {
  identity: {
    systemId: "CLU_882",
    displayName: "QUORRA.01",
    handle: "quorra01",
    photoURL: null,
    statusLabel: "ISO INTERFACE : ACTIVE",
    reputationPct: 62,
  },
  stats: {
    winRate: 68.4,
    posts: 41,
    hits: 28,
    exactHits: 0,
    goalScorerHits: 12,
    totalPoints: 1284,
    upset: 96.5,
  },
};
