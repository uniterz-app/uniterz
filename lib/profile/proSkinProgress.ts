/**
 * Pro Skin マイルストーン進捗（users.proSkinProgress）。
 * 2026-27 以降のみ。GET は users 1 read でバー表示・解放判定に使う。
 */
import { PRO_SKIN_THRESHOLD_MILESTONES } from "@/lib/profile/proSkinMilestoneCatalog";
import {
  getProSkinUnlockEntry,
  PRO_SKIN_UNLOCK_FROM_SEASON_KEY,
  isProSkinUnlockSeasonKeyEligible,
  type ProSkinUnlockProgress,
  type ProSkinUnlockRule,
  EMPTY_PRO_SKIN_RANK_MAP,
} from "@/lib/profile/proSkinUnlock";
import type { ProfilePlanProBgVariant } from "@/lib/profile/profilePlanProBgVariants";

export type ProSkinProgressSnapshot = {
  seasonKey: string;
  posts: number;
  exactHits: number;
  /** 対象シーズン内の最大連勝 */
  maxWinStreak: number;
  updatedAtMs?: number;
  /** settle 冪等用 */
  lastPostId?: string;
};

function safeInt(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

export function emptyProSkinProgressSnapshot(
  seasonKey: string = PRO_SKIN_UNLOCK_FROM_SEASON_KEY
): ProSkinProgressSnapshot {
  return {
    seasonKey,
    posts: 0,
    exactHits: 0,
    maxWinStreak: 0,
  };
}

/** users.proSkinProgress をパース。シーズン未達・壊れていれば null */
export function parseProSkinProgressSnapshot(
  raw: unknown
): ProSkinProgressSnapshot | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const seasonKey = typeof o.seasonKey === "string" ? o.seasonKey : "";
  if (!isProSkinUnlockSeasonKeyEligible(seasonKey)) return null;
  return {
    seasonKey,
    posts: safeInt(o.posts),
    exactHits: safeInt(o.exactHits),
    maxWinStreak: safeInt(o.maxWinStreak),
    updatedAtMs: safeInt(o.updatedAtMs) || undefined,
    lastPostId: typeof o.lastPostId === "string" ? o.lastPostId : undefined,
  };
}

export function progressFromProSkinSnapshot(
  snap: ProSkinProgressSnapshot | null,
  isPro: boolean
): ProSkinUnlockProgress {
  if (!snap) {
    return {
      isPro,
      posts: 0,
      exactHits: 0,
      maxWinStreak: 0,
      weeklyRanks: { ...EMPTY_PRO_SKIN_RANK_MAP },
      monthlyRanks: { ...EMPTY_PRO_SKIN_RANK_MAP },
      seasonKey: PRO_SKIN_UNLOCK_FROM_SEASON_KEY,
    };
  }
  return {
    isPro,
    posts: snap.posts,
    exactHits: snap.exactHits,
    maxWinStreak: snap.maxWinStreak,
    weeklyRanks: { ...EMPTY_PRO_SKIN_RANK_MAP },
    monthlyRanks: { ...EMPTY_PRO_SKIN_RANK_MAP },
    seasonKey: snap.seasonKey,
  };
}

/** 進捗バーが意味を持つルール（連勝・予想・Perfect） */
export function proSkinUnlockRuleHasProgressBar(
  rule: ProSkinUnlockRule
): rule is Extract<
  ProSkinUnlockRule,
  { kind: "streak" | "posts" | "exactHits" }
> {
  return (
    rule.kind === "streak" ||
    rule.kind === "posts" ||
    rule.kind === "exactHits"
  );
}

export type ProSkinMilestoneBar = {
  current: number;
  target: number;
  /** 0..1 */
  ratio: number;
  label: string;
};

export function proSkinMilestoneProgressBar(
  rule: ProSkinUnlockRule,
  progress: Pick<
    ProSkinUnlockProgress,
    "posts" | "exactHits" | "maxWinStreak"
  >,
  language: "ja" | "en" = "ja"
): ProSkinMilestoneBar | null {
  if (!proSkinUnlockRuleHasProgressBar(rule)) return null;
  const ja = language === "ja";
  let current = 0;
  let target = 1;
  let unit = "";
  switch (rule.kind) {
    case "streak":
      current = progress.maxWinStreak;
      target = rule.threshold;
      unit = ja ? "連勝" : "streak";
      break;
    case "posts":
      current = progress.posts;
      target = rule.threshold;
      unit = ja ? "予想" : "picks";
      break;
    case "exactHits":
      current = progress.exactHits;
      target = rule.threshold;
      unit = ja ? "Perfect" : "perfect";
      break;
  }
  const capped = Math.min(current, target);
  const ratio = target > 0 ? Math.min(1, capped / target) : 0;
  return {
    current: capped,
    target,
    ratio,
    label: `${capped}/${target} ${unit}`,
  };
}

export function proSkinMilestoneBarForId(
  id: string,
  progress: Pick<
    ProSkinUnlockProgress,
    "posts" | "exactHits" | "maxWinStreak"
  >,
  language: "ja" | "en" = "ja"
): ProSkinMilestoneBar | null {
  const entry = getProSkinUnlockEntry(id);
  if (!entry) return null;
  return proSkinMilestoneProgressBar(entry.unlock, progress, language);
}

/** 閾値系マイルストーンで progress から解放すべき ID */
export function listThresholdUnlockIdsFromProgress(
  progress: ProSkinUnlockProgress
): ProfilePlanProBgVariant[] {
  if (!progress.isPro) return [];
  if (!isProSkinUnlockSeasonKeyEligible(progress.seasonKey)) return [];
  const out: ProfilePlanProBgVariant[] = [];
  for (const row of PRO_SKIN_THRESHOLD_MILESTONES) {
    const id = row.id as ProfilePlanProBgVariant;
    if (row.kind === "streak" && progress.maxWinStreak >= row.threshold) {
      out.push(id);
    } else if (row.kind === "posts" && progress.posts >= row.threshold) {
      out.push(id);
    } else if (
      row.kind === "exactHits" &&
      progress.exactHits >= row.threshold
    ) {
      out.push(id);
    }
  }
  return out;
}
