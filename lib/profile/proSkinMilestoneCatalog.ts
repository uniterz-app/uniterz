/**
 * Pro Skin マイルストーン定義の単一ソース。
 * Functions へは `npm run sync:pro-skin-milestone-catalog` で同期する。
 *
 * - 閾値系 → NBA settle
 * - 順位系 → period snapshot 確定後 grant
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

/** 努力・精度（連勝 / 予想 / Perfect） */
export const PRO_SKIN_THRESHOLD_MILESTONES: readonly ProSkinThresholdMilestone[] =
  [
    { id: "beast-viper", kind: "streak", threshold: 7 },
    { id: "scale-king", kind: "streak", threshold: 10 },
    { id: "scale-dragon", kind: "streak", threshold: 15 },
    { id: "beast-circuitlace", kind: "posts", threshold: 100 },
    { id: "beast-eclipse", kind: "posts", threshold: 150 },
    { id: "beast-shard", kind: "exactHits", threshold: 10 },
  ] as const;

/** 週/月順位（standard ボード）— 表示順もここが正 */
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
