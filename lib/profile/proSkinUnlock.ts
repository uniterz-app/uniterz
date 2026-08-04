/**
 * Pro Skin 解放ルール — 即解放12 / マイルストーン18。
 * 並べ順もここが正（カタログ表示・No. はこの順）。
 */

import {
  PROFILE_PLAN_PRO_ADOPTED_BG,
  type ProfilePlanProAdoptedEntry,
} from "@/lib/profile/profilePlanProAdoptedBgVariants";
import type { ProfilePlanProBgVariant } from "@/lib/profile/profilePlanProBgVariants";
import {
  PRO_SKIN_PERIOD_WIN_MILESTONES,
  PRO_SKIN_RANK_MILESTONES,
  PRO_SKIN_REFERRAL_MILESTONES,
  PRO_SKIN_THRESHOLD_MILESTONES,
  PRO_SKIN_UNLOCK_FROM_SEASON_KEY as CATALOG_FROM_SEASON,
  proSkinPeriodWinCounterKey,
} from "@/lib/profile/proSkinMilestoneCatalog";

export type ProSkinUnlockKind =
  | "pro"
  | "streak"
  | "posts"
  | "exactHits"
  | "weeklyRank"
  | "monthlyRank"
  | "referralCompleted"
  | "periodWins"
  | "titleCollection";

export type ProSkinRankMetric =
  | "totalPoints"
  | "totalUpset"
  | "totalGoalScorerHits"
  | "winRate";

export type ProSkinUnlockRule =
  | { kind: "pro" }
  | { kind: "streak"; threshold: number }
  | { kind: "posts"; threshold: number }
  | { kind: "exactHits"; threshold: number }
  | {
      kind: "weeklyRank";
      maxRank: number;
      metric?: ProSkinRankMetric;
    }
  | {
      kind: "monthlyRank";
      maxRank: number;
      metric?: ProSkinRankMetric;
    }
  | { kind: "referralCompleted"; threshold: number }
  | {
      kind: "periodWins";
      period: "weekly" | "monthly";
      metric: ProSkinRankMetric;
      maxRank: number;
      wins: number;
    }
  | {
      kind: "titleCollection";
      /** これらのスキンをすべて保持すると解放 */
      requires: readonly ProfilePlanProBgVariant[];
    };

export type ProSkinUnlockProgress = {
  /** 対象シーズン内の最大連勝（users 通算や前シーズンは使わない） */
  maxWinStreak: number;
  /** 対象シーズン内の予想数 */
  posts: number;
  /** 対象シーズン内のパーフェクト予想 */
  exactHits: number;
  weeklyRanks: Record<ProSkinRankMetric, number | null>;
  monthlyRanks: Record<ProSkinRankMetric, number | null>;
  /** 招待完了人数（referralStats.completedCount） */
  referralCompletedCount: number;
  /**
   * 週/月条件の累計達成回数。
   * キー: `${period}_${metric}_${maxRank}`（proSkinPeriodWinCounterKey）
   */
  periodWins: Record<string, number>;
  isPro: boolean;
  /** マイルストーン判定に使うシーズンキー（未評価時も明示） */
  seasonKey?: string;
};

export const EMPTY_PRO_SKIN_RANK_MAP: Record<ProSkinRankMetric, number | null> =
  {
    totalPoints: null,
    totalUpset: null,
    totalGoalScorerHits: null,
    winRate: null,
  };

/**
 * マイルストーン解放の開始シーズン。これより前の累計・順位は使わない。
 * （カレンダー上 CURRENT が 2026-27 でも、旧データや users 通算からは解放しない）
 */
export const PRO_SKIN_UNLOCK_FROM_SEASON_KEY = CATALOG_FROM_SEASON;

export function isProSkinUnlockSeasonKeyEligible(
  seasonKey: string | null | undefined
): boolean {
  return (
    typeof seasonKey === "string" &&
    seasonKey.length > 0 &&
    seasonKey >= PRO_SKIN_UNLOCK_FROM_SEASON_KEY
  );
}

/** API ホットパス用: 追加 Firestore read なしの進捗（マイルストーンは未評価） */
export function emptyProSkinUnlockProgress(
  isPro: boolean,
  seasonKey: string = PRO_SKIN_UNLOCK_FROM_SEASON_KEY
): ProSkinUnlockProgress {
  return {
    isPro,
    posts: 0,
    exactHits: 0,
    maxWinStreak: 0,
    weeklyRanks: { ...EMPTY_PRO_SKIN_RANK_MAP },
    monthlyRanks: { ...EMPTY_PRO_SKIN_RANK_MAP },
    referralCompletedCount: 0,
    periodWins: {},
    seasonKey,
  };
}

export type ProSkinUnlockCatalogEntry = ProfilePlanProAdoptedEntry & {
  unlock: ProSkinUnlockRule;
  /** カタログ表示順（0始まり） */
  sortIndex: number;
};

/** users.plan / proUntil から Pro 判定（期限切れは free） */
export function userDataIsPro(userData: Record<string, unknown> | null | undefined): boolean {
  if (!userData || userData.plan !== "pro") return false;
  const until = userData.proUntil as
    | { toMillis?: () => number; seconds?: number; _seconds?: number }
    | Date
    | number
    | string
    | null
    | undefined;
  if (until == null || until === "") return true;
  let ms = 0;
  if (until instanceof Date) {
    ms = until.getTime();
  } else if (typeof until === "number") {
    ms = until < 1e12 ? until * 1000 : until;
  } else if (typeof until === "string") {
    const parsed = Date.parse(until);
    ms = Number.isFinite(parsed) ? parsed : 0;
  } else if (typeof until.toMillis === "function") {
    ms = until.toMillis();
  } else if (typeof until.seconds === "number") {
    ms = until.seconds * 1000;
  } else if (typeof until._seconds === "number") {
    ms = until._seconds * 1000;
  }
  if (!Number.isFinite(ms) || ms <= 0) return true;
  return ms > Date.now();
}

/** 即解放（Pro）→ マイルストーン（難易度昇順）。マイルストーン定義は catalog が正 */
const UNLOCK_ORDER: readonly {
  id: ProfilePlanProBgVariant;
  unlock: ProSkinUnlockRule;
}[] = [
  // —— Pro 即解放 ×12 ——
  { id: "beast-titanium", unlock: { kind: "pro" } },
  { id: "beast-circuitlace", unlock: { kind: "pro" } },
  { id: "beast-panther", unlock: { kind: "pro" } },
  { id: "beast-crocodile", unlock: { kind: "pro" } },
  { id: "scale-mamba", unlock: { kind: "pro" } },
  { id: "scale-python", unlock: { kind: "pro" } },
  { id: "form-hexveil", unlock: { kind: "pro" } },
  { id: "scale-diamondback", unlock: { kind: "pro" } },
  { id: "beast-shark", unlock: { kind: "pro" } },
  { id: "form-diamondgrid", unlock: { kind: "pro" } },
  { id: "beast-damascus", unlock: { kind: "pro" } },
  { id: "beast-chrome", unlock: { kind: "pro" } },
  // —— マイルストーン（catalog） ——
  ...PRO_SKIN_THRESHOLD_MILESTONES.map((row) => ({
    id: row.id as ProfilePlanProBgVariant,
    unlock: {
      kind: row.kind,
      threshold: row.threshold,
    } as ProSkinUnlockRule,
  })),
  ...PRO_SKIN_RANK_MILESTONES.map((row) => ({
    id: row.id as ProfilePlanProBgVariant,
    unlock: {
      kind: row.period === "weekly" ? "weeklyRank" : "monthlyRank",
      maxRank: row.maxRank,
      metric: row.metric,
    } as ProSkinUnlockRule,
  })),
  // Wave — 招待 / 週・月回数
  ...PRO_SKIN_REFERRAL_MILESTONES.map((row) => ({
    id: row.id as ProfilePlanProBgVariant,
    unlock: {
      kind: "referralCompleted" as const,
      threshold: row.completedCount,
    },
  })),
  ...PRO_SKIN_PERIOD_WIN_MILESTONES.map((row) => ({
    id: row.id as ProfilePlanProBgVariant,
    unlock: {
      kind: "periodWins" as const,
      period: row.period,
      metric: row.metric,
      maxRank: row.maxRank,
      wins: row.wins,
    },
  })),
];

const BY_ID = new Map(
  PROFILE_PLAN_PRO_ADOPTED_BG.map((e) => [e.id, e] as const)
);

export const PRO_SKIN_UNLOCK_CATALOG: readonly ProSkinUnlockCatalogEntry[] =
  UNLOCK_ORDER.map((row, sortIndex) => {
    const base = BY_ID.get(row.id);
    if (!base) {
      throw new Error(`proSkinUnlock: missing adopted entry ${row.id}`);
    }
    return { ...base, unlock: row.unlock, sortIndex };
  });

const UNLOCK_BY_ID = new Map(
  PRO_SKIN_UNLOCK_CATALOG.map((e) => [e.id, e] as const)
);

export function getProSkinUnlockEntry(
  id: string
): ProSkinUnlockCatalogEntry | null {
  return UNLOCK_BY_ID.get(id as ProfilePlanProBgVariant) ?? null;
}

function rankMetric(rule: {
  metric?: ProSkinRankMetric;
}): ProSkinRankMetric {
  return rule.metric ?? "totalPoints";
}

function periodRank(
  progress: ProSkinUnlockProgress,
  period: "weekly" | "monthly",
  metric: ProSkinRankMetric
): number | null {
  return period === "weekly"
    ? progress.weeklyRanks[metric]
    : progress.monthlyRanks[metric];
}

function isRankMet(
  rank: number | null,
  maxRank: number
): boolean {
  return rank != null && rank > 0 && rank <= maxRank;
}

export function isProSkinUnlockRuleMet(
  rule: ProSkinUnlockRule,
  progress: ProSkinUnlockProgress,
  unlockedIds?: ReadonlySet<string>
): boolean {
  if (!progress.isPro) return false;
  switch (rule.kind) {
    case "pro":
      return true;
    case "streak":
      return progress.maxWinStreak >= rule.threshold;
    case "posts":
      return progress.posts >= rule.threshold;
    case "exactHits":
      return progress.exactHits >= rule.threshold;
    case "weeklyRank":
      return isRankMet(
        periodRank(progress, "weekly", rankMetric(rule)),
        rule.maxRank
      );
    case "monthlyRank":
      return isRankMet(
        periodRank(progress, "monthly", rankMetric(rule)),
        rule.maxRank
      );
    case "referralCompleted":
      return progress.referralCompletedCount >= rule.threshold;
    case "periodWins": {
      const key = proSkinPeriodWinCounterKey({
        period: rule.period,
        metric: rule.metric,
        maxRank: rule.maxRank,
      });
      return (progress.periodWins[key] ?? 0) >= rule.wins;
    }
    case "titleCollection":
      if (!unlockedIds) return false;
      return rule.requires.every((id) => unlockedIds.has(id));
  }
}

export function isProSkinUnlocked(
  id: string,
  progress: ProSkinUnlockProgress,
  unlockedIds?: ReadonlySet<string>
): boolean {
  const entry = getProSkinUnlockEntry(id);
  if (!entry) return false;
  return isProSkinUnlockRuleMet(entry.unlock, progress, unlockedIds);
}

/** ライブ条件のみ（titleCollection はマージ時に付与） */
export function listUnlockedProSkinIds(
  progress: ProSkinUnlockProgress
): ProfilePlanProBgVariant[] {
  return PRO_SKIN_UNLOCK_CATALOG.filter(
    (e) =>
      e.unlock.kind !== "titleCollection" &&
      isProSkinUnlockRuleMet(e.unlock, progress)
  ).map((e) => e.id);
}

/** Pro 加入だけで解放されるスキン */
export function listProImmediateSkinIds(): ProfilePlanProBgVariant[] {
  return PRO_SKIN_UNLOCK_CATALOG.filter((e) => e.unlock.kind === "pro").map(
    (e) => e.id
  );
}

/** 称号コレクション（Drake 等）を保持セットへ反映 */
export function applyProSkinTitleCollections(
  unlockedIds: Set<string>,
  progress: ProSkinUnlockProgress
): void {
  for (const entry of PRO_SKIN_UNLOCK_CATALOG) {
    if (entry.unlock.kind !== "titleCollection") continue;
    if (isProSkinUnlockRuleMet(entry.unlock, progress, unlockedIds)) {
      unlockedIds.add(entry.id);
    }
  }
}

function formatRankMetricLabel(
  metric: ProSkinRankMetric,
  language: "ja" | "en"
): string {
  const ja = language === "ja";
  switch (metric) {
    case "totalPoints":
      return ja ? "総合" : "total points";
    case "totalUpset":
      return ja ? "UPSET" : "upset";
    case "totalGoalScorerHits":
      return ja ? "最多得点者" : "goal scorer";
    case "winRate":
      return ja ? "勝率" : "win rate";
  }
}

function formatPeriodRankCondition(
  period: "weekly" | "monthly",
  maxRank: number,
  metric: ProSkinRankMetric,
  language: "ja" | "en"
): string {
  const ja = language === "ja";
  const periodLabel = period === "weekly" ? (ja ? "週間" : "weekly") : ja ? "月間" : "monthly";
  const metricLabel = formatRankMetricLabel(metric, language);
  if (maxRank === 1) {
    return ja
      ? `${periodLabel}${metricLabel} 1位で解放`
      : `Unlock at ${periodLabel} ${metricLabel} #1`;
  }
  return ja
    ? `${periodLabel}${metricLabel} Top${maxRank} で解放`
    : `Unlock at ${periodLabel} ${metricLabel} Top ${maxRank}`;
}

export function formatProSkinUnlockCondition(
  rule: ProSkinUnlockRule,
  language: "ja" | "en"
): string {
  const ja = language === "ja";
  switch (rule.kind) {
    case "pro":
      return ja ? "Pro で解放" : "Unlocked with Pro";
    case "streak":
      return ja
        ? `連勝 ${rule.threshold} で解放`
        : `Unlock at ${rule.threshold}-win streak`;
    case "posts":
      return ja
        ? `予想 ${rule.threshold} 回で解放`
        : `Unlock at ${rule.threshold} predictions`;
    case "exactHits":
      return ja
        ? `パーフェクト予想 ${rule.threshold} で解放`
        : `Unlock at ${rule.threshold} perfect hits`;
    case "weeklyRank":
      return formatPeriodRankCondition(
        "weekly",
        rule.maxRank,
        rankMetric(rule),
        language
      );
    case "monthlyRank":
      return formatPeriodRankCondition(
        "monthly",
        rule.maxRank,
        rankMetric(rule),
        language
      );
    case "referralCompleted":
      return ja
        ? `招待完了 ${rule.threshold} 人で解放`
        : `Unlock at ${rule.threshold} completed invites`;
    case "periodWins": {
      const periodLabel =
        rule.period === "weekly" ? (ja ? "週間" : "weekly") : ja ? "月間" : "monthly";
      const metricLabel = formatRankMetricLabel(rule.metric, language);
      const rankLabel =
        rule.maxRank === 1
          ? ja
            ? "1位"
            : "#1"
          : ja
            ? `Top${rule.maxRank}`
            : `Top ${rule.maxRank}`;
      return ja
        ? `${periodLabel}${metricLabel} ${rankLabel} を ${rule.wins} 回で解放`
        : `Unlock after ${rule.wins}× ${periodLabel} ${metricLabel} ${rankLabel}`;
    }
    case "titleCollection":
      return ja
        ? "月間総合・UPSET・最多得点者の各1位スキンを集めて解放"
        : "Unlock by collecting all monthly #1 metric skins";
  }
}

export function formatProSkinOwnerCount(
  count: number | null | undefined,
  language: "ja" | "en"
): string {
  const n =
    typeof count === "number" && Number.isFinite(count)
      ? Math.max(0, Math.floor(count))
      : 0;
  return language === "ja" ? `${n}人が保持中` : `${n} holding`;
}

export const PRO_SKIN_UNLOCK_SEEN_STORAGE_KEY = "uniterz.proSkin.unlockSeen.v1";

export function readProSkinUnlockSeenIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(PRO_SKIN_UNLOCK_SEEN_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((x): x is string => typeof x === "string"));
  } catch {
    return new Set();
  }
}

export function writeProSkinUnlockSeenIds(ids: Iterable<string>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      PRO_SKIN_UNLOCK_SEEN_STORAGE_KEY,
      JSON.stringify([...ids])
    );
  } catch {
    /* ignore */
  }
}

export function diffNewlyUnlockedProSkins(
  unlockedIds: readonly string[],
  seenIds: ReadonlySet<string>
): string[] {
  return unlockedIds.filter((id) => {
    const entry = getProSkinUnlockEntry(id);
    return entry != null && entry.unlock.kind !== "pro" && !seenIds.has(id);
  });
}
