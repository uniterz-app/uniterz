/**
 * Pro Skin 解放ルール — 即解放14 / マイルストーン21。
 * 表示順の正は `PROFILE_PLAN_PRO_ADOPTED_BG`。解放条件は milestone catalog。
 */

import { L, resolveLocalizedLang } from "@/lib/i18n/localize";
import {
  PROFILE_PLAN_PRO_ADOPTED_BG,
  type ProfilePlanProAdoptedEntry,
} from "@/lib/profile/profilePlanProAdoptedBgVariants";
import type { ProfilePlanProBgVariant } from "@/lib/profile/profilePlanProBgVariants";
import {
  PRO_IMMEDIATE_SKIN_IDS,
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

/** Pro 即解放 ×14 */
const PRO_IMMEDIATE_IDS = new Set<ProfilePlanProBgVariant>(
  PRO_IMMEDIATE_SKIN_IDS
);

/** id → 解放条件（表示順は ADOPTED に委譲） */
const UNLOCK_RULE_BY_ID: Map<ProfilePlanProBgVariant, ProSkinUnlockRule> =
  (() => {
    const m = new Map<ProfilePlanProBgVariant, ProSkinUnlockRule>();
    for (const id of PRO_IMMEDIATE_IDS) {
      m.set(id, { kind: "pro" });
    }
    for (const row of PRO_SKIN_THRESHOLD_MILESTONES) {
      m.set(row.id as ProfilePlanProBgVariant, {
        kind: row.kind,
        threshold: row.threshold,
      });
    }
    for (const row of PRO_SKIN_RANK_MILESTONES) {
      m.set(row.id as ProfilePlanProBgVariant, {
        kind: row.period === "weekly" ? "weeklyRank" : "monthlyRank",
        maxRank: row.maxRank,
        metric: row.metric,
      });
    }
    for (const row of PRO_SKIN_REFERRAL_MILESTONES) {
      m.set(row.id as ProfilePlanProBgVariant, {
        kind: "referralCompleted",
        threshold: row.completedCount,
      });
    }
    for (const row of PRO_SKIN_PERIOD_WIN_MILESTONES) {
      m.set(row.id as ProfilePlanProBgVariant, {
        kind: "periodWins",
        period: row.period,
        metric: row.metric,
        maxRank: row.maxRank,
        wins: row.wins,
      });
    }
    return m;
  })();

export const PRO_SKIN_UNLOCK_CATALOG: readonly ProSkinUnlockCatalogEntry[] =
  PROFILE_PLAN_PRO_ADOPTED_BG.map((base, sortIndex) => {
    const unlock = UNLOCK_RULE_BY_ID.get(base.id);
    if (!unlock) {
      throw new Error(`proSkinUnlock: missing unlock rule for ${base.id}`);
    }
    return { ...base, unlock, sortIndex };
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

const PRO_IMMEDIATE_SKIN_ID_SET = new Set<string>(listProImmediateSkinIds());

/** CAREER 等: Pro 即解放を除いたマイルストーン解放スキン数 */
export function countMilestoneUnlockedProSkins(
  unlockedIds: readonly string[] | null | undefined
): number {
  if (!unlockedIds?.length) return 0;
  const set = new Set<string>();
  for (const id of unlockedIds) {
    if (typeof id !== "string") continue;
    const trimmed = id.trim();
    if (!trimmed || PRO_IMMEDIATE_SKIN_ID_SET.has(trimmed)) continue;
    set.add(trimmed);
  }
  return set.size;
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
  language: string | null | undefined
): string {
  const lang = resolveLocalizedLang(language);
  switch (metric) {
    case "totalPoints":
      return L(lang, {
        ja: "総合",
        en: "total points",
        ko: "종합",
        zh: "总分",
        es: "puntos totales",
        pt: "pontos totais",
        fr: "points totaux",
      });
    case "totalUpset":
      return L(lang, {
        ja: "UPSET",
        en: "upset",
        ko: "UPSET",
        zh: "UPSET",
        es: "upset",
        pt: "upset",
        fr: "upset",
      });
    case "totalGoalScorerHits":
      return L(lang, {
        ja: "最多得点者",
        en: "goal scorer",
        ko: "최다 득점",
        zh: "最佳得分",
        es: "máximo anotador",
        pt: "cestinha",
        fr: "meilleur marqueur",
      });
    case "winRate":
      return L(lang, {
        ja: "勝率",
        en: "win rate",
        ko: "승률",
        zh: "胜率",
        es: "win rate",
        pt: "win rate",
        fr: "win rate",
      });
  }
}

function formatPeriodLabel(
  period: "weekly" | "monthly",
  language: string | null | undefined
): string {
  const lang = resolveLocalizedLang(language);
  return period === "weekly"
    ? L(lang, {
        ja: "週間",
        en: "weekly",
        ko: "주간",
        zh: "周",
        es: "semanal",
        pt: "semanal",
        fr: "hebdo",
      })
    : L(lang, {
        ja: "月間",
        en: "monthly",
        ko: "월간",
        zh: "月",
        es: "mensual",
        pt: "mensal",
        fr: "mensuel",
      });
}

function formatPeriodRankCondition(
  period: "weekly" | "monthly",
  maxRank: number,
  metric: ProSkinRankMetric,
  language: string | null | undefined
): string {
  const lang = resolveLocalizedLang(language);
  const periodLabel = formatPeriodLabel(period, lang);
  const metricLabel = formatRankMetricLabel(metric, lang);
  if (maxRank === 1) {
    return L(lang, {
      ja: `${periodLabel}${metricLabel} 1位で解放`,
      en: `Unlock at ${periodLabel} ${metricLabel} #1`,
      ko: `${periodLabel} ${metricLabel} 1위로 해제`,
      zh: `${periodLabel}${metricLabel} 第1名解锁`,
      es: `Desbloquea en ${periodLabel} ${metricLabel} #1`,
      pt: `Desbloqueie em ${periodLabel} ${metricLabel} #1`,
      fr: `Débloquez au ${periodLabel} ${metricLabel} n°1`,
    });
  }
  return L(lang, {
    ja: `${periodLabel}${metricLabel} Top${maxRank} で解放`,
    en: `Unlock at ${periodLabel} ${metricLabel} Top ${maxRank}`,
    ko: `${periodLabel} ${metricLabel} Top${maxRank}로 해제`,
    zh: `${periodLabel}${metricLabel} Top${maxRank} 解锁`,
    es: `Desbloquea en ${periodLabel} ${metricLabel} Top ${maxRank}`,
    pt: `Desbloqueie em ${periodLabel} ${metricLabel} Top ${maxRank}`,
    fr: `Débloquez au ${periodLabel} ${metricLabel} Top ${maxRank}`,
  });
}

export function formatProSkinUnlockCondition(
  rule: ProSkinUnlockRule,
  language: string | null | undefined
): string {
  const lang = resolveLocalizedLang(language);
  switch (rule.kind) {
    case "pro":
      return L(lang, {
        ja: "Pro で解放",
        en: "Unlocked with Pro",
        ko: "Pro로 해제",
        zh: "Pro 解锁",
        es: "Desbloqueado con Pro",
        pt: "Desbloqueado com Pro",
        fr: "Débloqué avec Pro",
      });
    case "streak":
      return L(lang, {
        ja: `連勝 ${rule.threshold} で解放`,
        en: `Unlock at ${rule.threshold}-win streak`,
        ko: `연승 ${rule.threshold}으로 해제`,
        zh: `连胜 ${rule.threshold} 解锁`,
        es: `Desbloquea con ${rule.threshold} victorias seguidas`,
        pt: `Desbloqueie com ${rule.threshold} vitórias seguidas`,
        fr: `Débloquez avec ${rule.threshold} victoires d’affilée`,
      });
    case "posts":
      return L(lang, {
        ja: `予想 ${rule.threshold} 回で解放`,
        en: `Unlock at ${rule.threshold} predictions`,
        ko: `예상 ${rule.threshold}회로 해제`,
        zh: `预测 ${rule.threshold} 次解锁`,
        es: `Desbloquea con ${rule.threshold} predicciones`,
        pt: `Desbloqueie com ${rule.threshold} palpites`,
        fr: `Débloquez avec ${rule.threshold} pronostics`,
      });
    case "exactHits":
      return L(lang, {
        ja: `パーフェクト予想 ${rule.threshold} で解放`,
        en: `Unlock at ${rule.threshold} perfect hits`,
        ko: `퍼펙트 예상 ${rule.threshold}으로 해제`,
        zh: `完美预测 ${rule.threshold} 次解锁`,
        es: `Desbloquea con ${rule.threshold} aciertos perfectos`,
        pt: `Desbloqueie com ${rule.threshold} acertos perfeitos`,
        fr: `Débloquez avec ${rule.threshold} perfects`,
      });
    case "weeklyRank":
      return formatPeriodRankCondition(
        "weekly",
        rule.maxRank,
        rankMetric(rule),
        lang
      );
    case "monthlyRank":
      return formatPeriodRankCondition(
        "monthly",
        rule.maxRank,
        rankMetric(rule),
        lang
      );
    case "referralCompleted":
      return L(lang, {
        ja: `招待完了 ${rule.threshold} 人で解放`,
        en: `Unlock at ${rule.threshold} completed invites`,
        ko: `초대 완료 ${rule.threshold}명으로 해제`,
        zh: `邀请完成 ${rule.threshold} 人解锁`,
        es: `Desbloquea con ${rule.threshold} invitaciones completadas`,
        pt: `Desbloqueie com ${rule.threshold} convites concluídos`,
        fr: `Débloquez avec ${rule.threshold} invitations terminées`,
      });
    case "periodWins": {
      const periodLabel = formatPeriodLabel(rule.period, lang);
      const metricLabel = formatRankMetricLabel(rule.metric, lang);
      const rankLabel =
        rule.maxRank === 1
          ? L(lang, {
              ja: "1位",
              en: "#1",
              ko: "1위",
              zh: "第1名",
              es: "#1",
              pt: "#1",
              fr: "n°1",
            })
          : L(lang, {
              ja: `Top${rule.maxRank}`,
              en: `Top ${rule.maxRank}`,
              ko: `Top${rule.maxRank}`,
              zh: `Top${rule.maxRank}`,
              es: `Top ${rule.maxRank}`,
              pt: `Top ${rule.maxRank}`,
              fr: `Top ${rule.maxRank}`,
            });
      return L(lang, {
        ja: `${periodLabel}${metricLabel} ${rankLabel} を ${rule.wins} 回で解放`,
        en: `Unlock after ${rule.wins}× ${periodLabel} ${metricLabel} ${rankLabel}`,
        ko: `${periodLabel} ${metricLabel} ${rankLabel} ${rule.wins}회로 해제`,
        zh: `${periodLabel}${metricLabel} ${rankLabel} 达成 ${rule.wins} 次解锁`,
        es: `Desbloquea tras ${rule.wins}× ${periodLabel} ${metricLabel} ${rankLabel}`,
        pt: `Desbloqueie após ${rule.wins}× ${periodLabel} ${metricLabel} ${rankLabel}`,
        fr: `Débloquez après ${rule.wins}× ${periodLabel} ${metricLabel} ${rankLabel}`,
      });
    }
    case "titleCollection":
      return L(lang, {
        ja: "月間総合・UPSET・最多得点者の各1位スキンを集めて解放",
        en: "Unlock by collecting all monthly #1 metric skins",
        ko: "월간 종합·UPSET·최다 득점 각 1위 스킨을 모아 해제",
        zh: "集齐月度总分、UPSET、最佳得分各第1名皮肤解锁",
        es: "Desbloquea reuniendo las skins de #1 mensual por métrica",
        pt: "Desbloqueie reunindo as skins de #1 mensal por métrica",
        fr: "Débloquez en collectant les skins n°1 mensuels par métrique",
      });
  }
}

export function formatProSkinOwnerCount(
  count: number | null | undefined,
  language: string | null | undefined
): string {
  const lang = resolveLocalizedLang(language);
  const n =
    typeof count === "number" && Number.isFinite(count)
      ? Math.max(0, Math.floor(count))
      : 0;
  return L(lang, {
    ja: `${n}人が保持中`,
    en: `${n} holding`,
    ko: `${n}명이 보유 중`,
    zh: `${n} 人持有中`,
    es: `${n} en posesión`,
    pt: `${n} com a skin`,
    fr: `${n} en possession`,
  });
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
