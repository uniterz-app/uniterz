/**
 * Pro Skin マイルストーン定義の単一ソース。
 * Functions へは `npm run sync:pro-skin-milestone-catalog` で同期する。
 *
 * - 閾値系 → NBA settle
 * - 順位1回系 → period snapshot 確定後 grant（earnedIds）
 * - 順位回数系 → 同 grant で wins 加算 → 閾値到達で解放
 * - 招待系 → referral settle で completedCount 到達時に解放
 */
export const PRO_SKIN_UNLOCK_FROM_SEASON_KEY = "2026-27";

export type ProSkinThresholdMilestone = {
  id: string;
  kind: "streak" | "posts" | "exactHits";
  threshold: number;
};

export type ProSkinRankMilestone = {
  id: string;
  period: "weekly" | "monthly";
  metric: "totalPoints" | "winRate" | "totalUpset" | "totalGoalScorerHits";
  maxRank: number;
};

/** 招待完了人数（referralStats.completedCount） */
export type ProSkinReferralMilestone = {
  id: string;
  completedCount: number;
};

/**
 * 週/月の「条件達成回数」マイルストーン。
 * 例: 週間総合1位を3回、月間総合 Top10 を5回。
 */
export type ProSkinPeriodWinMilestone = {
  id: string;
  period: "weekly" | "monthly";
  metric: "totalPoints" | "winRate" | "totalUpset" | "totalGoalScorerHits";
  maxRank: number;
  /** 達成が必要な回数 */
  wins: number;
};

/** 努力・精度（連勝 / 予想 / Perfect） */
export const PRO_SKIN_THRESHOLD_MILESTONES: readonly ProSkinThresholdMilestone[] =
  [
    { id: "beast-viper", kind: "streak", threshold: 7 },
    { id: "scale-king", kind: "streak", threshold: 10 },
    { id: "scale-dragon", kind: "streak", threshold: 15 },
    { id: "beast-kintsugi", kind: "posts", threshold: 100 },
    { id: "beast-eclipse", kind: "posts", threshold: 150 },
    { id: "beast-shard", kind: "exactHits", threshold: 10 },
  ] as const;

/** 週/月順位 1回達成（standard ボード）— 表示順もここが正 */
export const PRO_SKIN_RANK_MILESTONES: readonly ProSkinRankMilestone[] = [
  {
    id: "beast-jagarmor",
    period: "monthly",
    metric: "totalPoints",
    maxRank: 10,
  },
  {
    id: "form-isocubes",
    period: "weekly",
    metric: "totalPoints",
    maxRank: 1,
  },
  {
    id: "beast-facet",
    period: "monthly",
    metric: "totalGoalScorerHits",
    maxRank: 1,
  },
  {
    id: "beast-thunder",
    period: "monthly",
    metric: "totalUpset",
    maxRank: 1,
  },
  {
    id: "beast-starborne",
    period: "monthly",
    metric: "winRate",
    maxRank: 1,
  },
  {
    id: "beast-regalia",
    period: "monthly",
    metric: "totalPoints",
    maxRank: 1,
  },
] as const;

/** Wave — 招待完了人数 */
export const PRO_SKIN_REFERRAL_MILESTONES: readonly ProSkinReferralMilestone[] =
  [
    { id: "wave-cyan-grid", completedCount: 5 },
    { id: "wave-gold-monogram", completedCount: 10 },
  ] as const;

/**
 * Wave — 週/月条件の累計回数
 * （週間総合1位 ×3/×5、月間総合 Top10 ×3/×5）
 */
export const PRO_SKIN_PERIOD_WIN_MILESTONES: readonly ProSkinPeriodWinMilestone[] =
  [
    {
      id: "wave-ember-hex",
      period: "monthly",
      metric: "totalPoints",
      maxRank: 10,
      wins: 3,
    },
    {
      id: "wave-chem-ink",
      period: "monthly",
      metric: "totalPoints",
      maxRank: 10,
      wins: 5,
    },
    {
      id: "wave-neon-ridge",
      period: "weekly",
      metric: "totalPoints",
      maxRank: 1,
      wins: 3,
    },
    {
      id: "wave-obsidian-warp",
      period: "weekly",
      metric: "totalPoints",
      maxRank: 1,
      wins: 5,
    },
  ] as const;

/** periodWins カウンタのキー（users.proSkinProgress.periodWins） */
export function proSkinPeriodWinCounterKey(opts: {
  period: "weekly" | "monthly";
  metric: string;
  maxRank: number;
}): string {
  return `${opts.period}_${opts.metric}_${opts.maxRank}`;
}
