/**
 * Pro Skin マイルストーン定義の単一ソース。
 * Functions へは `npm run sync:pro-skin-milestone-catalog` で同期する。
 *
 * 構成: 即解放 11 / マイルストーン 45
 *
 * 系統ごとに世界観を揃える（低い段は柄、高い段は宇宙写真）
 * - 連勝 = 紅・炎 / パーフェクト = 蒼・氷 / 予想数 = 地球→冥王星の旅
 * - 順位1回 = 称号（幾何・金属） / 順位回数 = 深宇宙 / RS 最終順位 = 銀河 / 招待 = 金
 *
 * - 閾値系・連勝回数系 → NBA settle
 * - 順位1回系 → period snapshot 確定後 grant（earnedIds）
 * - 順位回数系 → 同 grant で wins 加算 → 閾値到達で解放
 * - RS 最終順位系 → RS 全試合 final 後の season snapshot から grant（earnedIds）
 * - 招待系 → referral settle で completedCount 到達時に解放
 */
export const PRO_SKIN_UNLOCK_FROM_SEASON_KEY = "2026-27";

/** Pro 加入だけで解放（CAREER のマイルストーン数からは除外） */
export const PRO_IMMEDIATE_SKIN_IDS = [
  "atmos",
  "wave-riot-shard",
  "wave-uniterz-logo",
  "wave-mono-hex",
  "beast-dust",
  "beast-dust-ash",
  "beast-crocodile",
  "scale-mamba",
  "scale-python",
  "scale-diamondback",
  "beast-shark",
] as const;

/**
 * 期間確定 grant の冪等ロック。
 * `meta/{doc}/locks/{id}`（4 セグメント）— 3 セグメントの doc パスは Firestore で無効。
 */
export function proSkinPeriodGrantLockDocPath(
  period: string,
  labelKey: string
): string {
  const id = `${period}_${labelKey}`.replace(/\//g, "_");
  return `meta/proSkinPeriodGrants/locks/${id}`;
}

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

/**
 * 「N 連勝を X 回」。連勝が N に届いた瞬間を 1 回と数える（同一シーズン）。
 * 途切れて再び N に届けば 2 回目。1 回の連勝が 2N まで伸びても 1 回。
 */
export type ProSkinStreakRunMilestone = {
  id: string;
  streak: number;
  runs: number;
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

/** 連勝（紅・炎）/ パーフェクト（蒼・氷）/ 予想数（地球→冥王星の旅） */
export const PRO_SKIN_THRESHOLD_MILESTONES: readonly ProSkinThresholdMilestone[] =
  [
    { id: "wave-crimson-shard", kind: "streak", threshold: 5 },
    { id: "beast-eclipse", kind: "streak", threshold: 7 },
    { id: "beast-lavaflow", kind: "streak", threshold: 10 },
    { id: "beast-flame", kind: "streak", threshold: 15 },
    { id: "beast-solar", kind: "streak", threshold: 20 },
    { id: "beast-corona", kind: "streak", threshold: 25 },
    { id: "beast-shard", kind: "exactHits", threshold: 5 },
    { id: "beast-europa", kind: "exactHits", threshold: 10 },
    { id: "beast-neptune", kind: "exactHits", threshold: 15 },
    { id: "beast-nova", kind: "exactHits", threshold: 20 },
    { id: "beast-lena", kind: "posts", threshold: 50 },
    { id: "beast-hurricane", kind: "posts", threshold: 100 },
    { id: "beast-nightearth", kind: "posts", threshold: 200 },
    { id: "beast-aurora", kind: "posts", threshold: 300 },
    { id: "beast-lunar", kind: "posts", threshold: 400 },
    { id: "beast-marscrust", kind: "posts", threshold: 500 },
    { id: "beast-dunes", kind: "posts", threshold: 600 },
    { id: "beast-jovian", kind: "posts", threshold: 700 },
    { id: "beast-rings", kind: "posts", threshold: 800 },
    { id: "beast-saturn", kind: "posts", threshold: 900 },
    { id: "beast-pluto", kind: "posts", threshold: 1000 },
  ] as const;

/** 連勝回数（紅・炎） */
export const PRO_SKIN_STREAK_RUN_MILESTONES: readonly ProSkinStreakRunMilestone[] =
  [
    { id: "wave-ember-hex", streak: 5, runs: 2 },
    { id: "beast-io", streak: 5, runs: 3 },
    { id: "beast-helix", streak: 10, runs: 2 },
  ] as const;

/** streakRuns カウンタで追う連勝長（重複なし昇順） */
export const PRO_SKIN_STREAK_RUN_LENGTHS: readonly number[] = [
  ...new Set(PRO_SKIN_STREAK_RUN_MILESTONES.map((r) => r.streak)),
].sort((a, b) => a - b);

/** 週/月順位 1回達成 = 称号（standard ボード） */
export const PRO_SKIN_RANK_MILESTONES: readonly ProSkinRankMilestone[] = [
  { id: "beast-tessera", period: "weekly", metric: "totalPoints", maxRank: 10 },
  { id: "beast-jagarmor", period: "weekly", metric: "totalPoints", maxRank: 3 },
  { id: "form-isocubes", period: "weekly", metric: "totalPoints", maxRank: 1 },
  {
    id: "wave-obsidian-warp",
    period: "monthly",
    metric: "totalPoints",
    maxRank: 10,
  },
  { id: "wave-neon-ridge", period: "monthly", metric: "totalPoints", maxRank: 3 },
  {
    id: "beast-facet",
    period: "monthly",
    metric: "totalGoalScorerHits",
    maxRank: 1,
  },
  { id: "beast-thunder", period: "monthly", metric: "totalUpset", maxRank: 1 },
  { id: "beast-starborne", period: "monthly", metric: "winRate", maxRank: 1 },
  { id: "beast-regalia", period: "monthly", metric: "totalPoints", maxRank: 1 },
] as const;

/** 招待完了人数 = 金 */
export const PRO_SKIN_REFERRAL_MILESTONES: readonly ProSkinReferralMilestone[] =
  [
    { id: "beast-viper", completedCount: 5 },
    { id: "wave-gold-monogram", completedCount: 10 },
    { id: "scale-dragon", completedCount: 20 },
  ] as const;

/** 週/月条件の累計回数 = 深宇宙 */
export const PRO_SKIN_PERIOD_WIN_MILESTONES: readonly ProSkinPeriodWinMilestone[] =
  [
    {
      id: "beast-startrail",
      period: "weekly",
      metric: "totalPoints",
      maxRank: 10,
      wins: 3,
    },
    {
      id: "beast-nebula",
      period: "weekly",
      metric: "totalPoints",
      maxRank: 10,
      wins: 5,
    },
    {
      id: "beast-crab",
      period: "weekly",
      metric: "totalPoints",
      maxRank: 3,
      wins: 3,
    },
    {
      id: "beast-southernring",
      period: "monthly",
      metric: "totalPoints",
      maxRank: 10,
      wins: 3,
    },
  ] as const;

/**
 * レギュラーシーズン累計（standard 総合）の最終順位 = 銀河。
 * RS 最終日確定後に 1 回だけ grant。上位は下位段もまとめて解放（rank <= maxRank）。
 */
export type ProSkinSeasonRankMilestone = {
  id: string;
  metric: "totalPoints";
  maxRank: number;
};

export const PRO_SKIN_SEASON_RANK_MILESTONES: readonly ProSkinSeasonRankMilestone[] =
  [
    { id: "beast-galaxy", metric: "totalPoints", maxRank: 50 },
    { id: "beast-deepfield", metric: "totalPoints", maxRank: 20 },
    { id: "beast-milkyway", metric: "totalPoints", maxRank: 10 },
    { id: "beast-andromeda", metric: "totalPoints", maxRank: 5 },
    { id: "beast-pillars", metric: "totalPoints", maxRank: 1 },
  ] as const;

/** RS 最終順位 grant の冪等ロック */
export function proSkinSeasonRankGrantLockDocPath(seasonKey: string): string {
  return `meta/proSkinPeriodGrants/locks/season_${seasonKey.replace(/\//g, "_")}`;
}

/** periodWins カウンタのキー（users.proSkinProgress.periodWins） */
export function proSkinPeriodWinCounterKey(opts: {
  period: "weekly" | "monthly";
  metric: string;
  maxRank: number;
}): string {
  return `${opts.period}_${opts.metric}_${opts.maxRank}`;
}
