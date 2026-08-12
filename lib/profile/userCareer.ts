/**
 * ユーザー CAREER（予想者の歴史）正本。
 * Firestore: user_career/{uid} — 公開 1 read で CAREER 面を埋める。
 *
 * All-Time Rank は持たない。週/月ピーク・Top10・グループバトル最高などは
 * 期間確定 / settle 時に差分更新（表示時の横断スキャン禁止）。
 */

export const USER_CAREER_COLLECTION = "user_career";
export const USER_CAREER_SCHEMA_VERSION = 1 as const;

/** Regular / Playoffs / 通算サマリーで共有する成績ボード */
export type UserCareerBoardStats = {
  predictions: number;
  hits: number;
  exactHits: number;
  /** 0..100 */
  winRatePct: number;
  maxWinStreak: number | null;
  bestWeeklyRank: number | null;
  bestMonthlyRank: number | null;
  weeklyTop10Count: number;
  monthlyTop10Count: number;
};

export type UserCareerSeasonChapter = {
  regular: UserCareerBoardStats;
  playoffs: UserCareerBoardStats;
};

/** 通算サマリー（CAREER 面の主表示） */
export type UserCareerSummary = UserCareerBoardStats & {
  sinceYear: number | null;
  unlockedSkinCount: number;
  lifetimeUnitsEarned: number | null;
  /** グループバトル最高順位（未参加 null） */
  bestGroupBattleRank: number | null;
};

export type UserCareerDoc = {
  v: typeof USER_CAREER_SCHEMA_VERSION;
  uid: string;
  summary: UserCareerSummary;
  seasons: Record<string, UserCareerSeasonChapter>;
  /**
   * 週/月 Top10・ピーク更新の冪等キー → その時点の順位。
   * 例: "w:2026-08-04" / "m:2026-07"
   */
  periodSeen?: Record<string, number>;
  /**
   * グループバトル確定の冪等キー → 順位。
   * 例: "gb:{battleId}:{period}:{label}"
   */
  groupBattleSeen?: Record<string, number>;
  updatedAtMs: number;
  /** backfill | settle | period | skin | units | group_battle | ensure */
  source?: string;
};

export function emptyCareerBoardStats(): UserCareerBoardStats {
  return {
    predictions: 0,
    hits: 0,
    exactHits: 0,
    winRatePct: 0,
    maxWinStreak: null,
    bestWeeklyRank: null,
    bestMonthlyRank: null,
    weeklyTop10Count: 0,
    monthlyTop10Count: 0,
  };
}

export function emptyCareerSummary(): UserCareerSummary {
  return {
    ...emptyCareerBoardStats(),
    sinceYear: null,
    unlockedSkinCount: 0,
    lifetimeUnitsEarned: null,
    bestGroupBattleRank: null,
  };
}

export function emptyUserCareerDoc(uid: string): UserCareerDoc {
  return {
    v: USER_CAREER_SCHEMA_VERSION,
    uid,
    summary: emptyCareerSummary(),
    seasons: {},
    periodSeen: {},
    groupBattleSeen: {},
    updatedAtMs: 0,
  };
}

function safeInt(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

function safeRank(v: unknown): number | null {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n) || n < 1) return null;
  return Math.floor(n);
}

function winRatePct(posts: number, wins: number): number {
  if (posts <= 0) return 0;
  return Math.round((wins / posts) * 1000) / 10;
}

export function boardFromPostsWinsExact(input: {
  predictions?: number;
  hits?: number;
  exactHits?: number;
  maxWinStreak?: number | null;
  bestWeeklyRank?: number | null;
  bestMonthlyRank?: number | null;
  weeklyTop10Count?: number;
  monthlyTop10Count?: number;
}): UserCareerBoardStats {
  const predictions = safeInt(input.predictions);
  const hits = safeInt(input.hits);
  const exactHits = safeInt(input.exactHits);
  return {
    predictions,
    hits,
    exactHits,
    winRatePct: winRatePct(predictions, hits),
    maxWinStreak:
      input.maxWinStreak == null ? null : safeRank(input.maxWinStreak),
    bestWeeklyRank:
      input.bestWeeklyRank == null ? null : safeRank(input.bestWeeklyRank),
    bestMonthlyRank:
      input.bestMonthlyRank == null ? null : safeRank(input.bestMonthlyRank),
    weeklyTop10Count: safeInt(input.weeklyTop10Count),
    monthlyTop10Count: safeInt(input.monthlyTop10Count),
  };
}

/** より良い（小さい）順位を採用 */
export function betterRank(
  a: number | null | undefined,
  b: number | null | undefined
): number | null {
  const aa = a != null && a >= 1 ? Math.floor(a) : null;
  const bb = b != null && b >= 1 ? Math.floor(b) : null;
  if (aa == null) return bb;
  if (bb == null) return aa;
  return Math.min(aa, bb);
}

export function maxStreak(
  a: number | null | undefined,
  b: number | null | undefined
): number | null {
  const aa = a != null && a >= 1 ? Math.floor(a) : null;
  const bb = b != null && b >= 1 ? Math.floor(b) : null;
  if (aa == null) return bb;
  if (bb == null) return aa;
  return Math.max(aa, bb);
}

export function periodSeenKey(
  period: "weekly" | "monthly",
  label: string
): string {
  return period === "weekly" ? `w:${label}` : `m:${label}`;
}

export function groupBattleSeenKey(
  battleId: string,
  period: "weekly" | "monthly",
  label: string
): string {
  return `gb:${battleId}:${period}:${label}`;
}

function parseBoard(raw: unknown): UserCareerBoardStats {
  if (!raw || typeof raw !== "object") return emptyCareerBoardStats();
  const o = raw as Record<string, unknown>;
  return boardFromPostsWinsExact({
    predictions: safeInt(o.predictions ?? o.posts),
    hits: safeInt(o.hits ?? o.wins),
    exactHits: safeInt(o.exactHits),
    maxWinStreak:
      o.maxWinStreak == null ? null : safeInt(o.maxWinStreak) || null,
    bestWeeklyRank:
      o.bestWeeklyRank == null ? null : safeInt(o.bestWeeklyRank) || null,
    bestMonthlyRank:
      o.bestMonthlyRank == null ? null : safeInt(o.bestMonthlyRank) || null,
    weeklyTop10Count: safeInt(o.weeklyTop10Count),
    monthlyTop10Count: safeInt(o.monthlyTop10Count),
  });
}

function parseSummary(raw: unknown): UserCareerSummary {
  const board = parseBoard(raw);
  if (!raw || typeof raw !== "object") {
    return { ...board, ...emptyCareerSummary(), ...board };
  }
  const o = raw as Record<string, unknown>;
  const sinceYear = safeInt(o.sinceYear);
  return {
    ...board,
    sinceYear: sinceYear > 0 ? sinceYear : null,
    unlockedSkinCount: safeInt(o.unlockedSkinCount),
    lifetimeUnitsEarned:
      o.lifetimeUnitsEarned == null
        ? null
        : safeInt(o.lifetimeUnitsEarned),
    bestGroupBattleRank: safeRank(o.bestGroupBattleRank),
  };
}

function parseStringNumberMap(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!k) continue;
    const n = safeRank(v);
    if (n != null) out[k] = n;
  }
  return out;
}

/** Firestore / API JSON → UserCareerDoc */
export function parseUserCareerDoc(
  uid: string,
  raw: unknown
): UserCareerDoc | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (safeInt(o.v) !== USER_CAREER_SCHEMA_VERSION && o.v != null) {
    // 未知バージョンは summary だけでも読んでおく
  }
  const seasonsRaw =
    o.seasons && typeof o.seasons === "object"
      ? (o.seasons as Record<string, unknown>)
      : {};
  const seasons: Record<string, UserCareerSeasonChapter> = {};
  for (const [seasonKey, chapter] of Object.entries(seasonsRaw)) {
    if (!seasonKey || !chapter || typeof chapter !== "object") continue;
    const c = chapter as Record<string, unknown>;
    seasons[seasonKey] = {
      regular: parseBoard(c.regular),
      playoffs: parseBoard(c.playoffs),
    };
  }
  return {
    v: USER_CAREER_SCHEMA_VERSION,
    uid: typeof o.uid === "string" && o.uid ? o.uid : uid,
    summary: parseSummary(o.summary),
    seasons,
    periodSeen: parseStringNumberMap(o.periodSeen),
    groupBattleSeen: parseStringNumberMap(o.groupBattleSeen),
    updatedAtMs: safeInt(o.updatedAtMs),
    source: typeof o.source === "string" ? o.source : undefined,
  };
}

export function formatCareerRankValue(rank: number | null): string {
  if (rank == null) return "—";
  return `#${rank.toLocaleString("en-US")}`;
}

export function formatCareerCountValue(n: number | null | undefined): string {
  if (n == null) return "—";
  return n.toLocaleString("en-US");
}

export function formatCareerWinRateValue(pct: number | null | undefined): string {
  if (pct == null) return "—";
  return `${Number(pct).toFixed(1)}%`;
}

export function formatCareerUnitsValue(n: number | null | undefined): string {
  if (n == null) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toLocaleString("en-US")}`;
}

export type UserCareerSummaryRowKey =
  | "since"
  | "predictions"
  | "hits"
  | "exactHits"
  | "winRate"
  | "maxWinStreak"
  | "bestWeeklyRank"
  | "bestMonthlyRank"
  | "weeklyTop10"
  | "monthlyTop10"
  | "bestGroupBattleRank"
  | "unlockedSkins"
  | "lifetimeUnits";

export type UserCareerSummaryRow = {
  key: UserCareerSummaryRowKey;
  label: string;
  value: string;
};

export function userCareerSummaryLabels(language: "ja" | "en"): Record<
  UserCareerSummaryRowKey,
  string
> {
  if (language === "ja") {
    return {
      since: "Since",
      predictions: "Predictions",
      hits: "Hits",
      exactHits: "Exact Hits",
      winRate: "Win Rate",
      maxWinStreak: "Max Win Streak",
      bestWeeklyRank: "Best Weekly Rank",
      bestMonthlyRank: "Best Monthly Rank",
      weeklyTop10: "Weekly Top 10",
      monthlyTop10: "Monthly Top 10",
      bestGroupBattleRank: "Group Battle Best",
      unlockedSkins: "Unlocked Skins",
      lifetimeUnits: "Lifetime Units",
    };
  }
  return {
    since: "Since",
    predictions: "Predictions",
    hits: "Hits",
    exactHits: "Exact Hits",
    winRate: "Win Rate",
    maxWinStreak: "Max Win Streak",
    bestWeeklyRank: "Best Weekly Rank",
    bestMonthlyRank: "Best Monthly Rank",
    weeklyTop10: "Weekly Top 10",
    monthlyTop10: "Monthly Top 10",
    bestGroupBattleRank: "Group Battle Best",
    unlockedSkins: "Unlocked Skins",
    lifetimeUnits: "Lifetime Units",
  };
}

/** 通算サマリー行（表示順固定） */
export function buildUserCareerSummaryRows(
  summary: UserCareerSummary,
  language: "ja" | "en"
): UserCareerSummaryRow[] {
  const labels = userCareerSummaryLabels(language);
  return [
    {
      key: "since",
      label: labels.since,
      value: summary.sinceYear != null ? String(summary.sinceYear) : "—",
    },
    {
      key: "predictions",
      label: labels.predictions,
      value: formatCareerCountValue(summary.predictions),
    },
    {
      key: "hits",
      label: labels.hits,
      value: formatCareerCountValue(summary.hits),
    },
    {
      key: "exactHits",
      label: labels.exactHits,
      value: formatCareerCountValue(summary.exactHits),
    },
    {
      key: "winRate",
      label: labels.winRate,
      value: formatCareerWinRateValue(summary.winRatePct),
    },
    {
      key: "maxWinStreak",
      label: labels.maxWinStreak,
      value: formatCareerCountValue(summary.maxWinStreak),
    },
    {
      key: "bestWeeklyRank",
      label: labels.bestWeeklyRank,
      value: formatCareerRankValue(summary.bestWeeklyRank),
    },
    {
      key: "bestMonthlyRank",
      label: labels.bestMonthlyRank,
      value: formatCareerRankValue(summary.bestMonthlyRank),
    },
    {
      key: "weeklyTop10",
      label: labels.weeklyTop10,
      value: formatCareerCountValue(summary.weeklyTop10Count),
    },
    {
      key: "monthlyTop10",
      label: labels.monthlyTop10,
      value: formatCareerCountValue(summary.monthlyTop10Count),
    },
    {
      key: "bestGroupBattleRank",
      label: labels.bestGroupBattleRank,
      value: formatCareerRankValue(summary.bestGroupBattleRank),
    },
    {
      key: "unlockedSkins",
      label: labels.unlockedSkins,
      value: formatCareerCountValue(summary.unlockedSkinCount),
    },
    {
      key: "lifetimeUnits",
      label: labels.lifetimeUnits,
      value: formatCareerUnitsValue(summary.lifetimeUnitsEarned),
    },
  ];
}

/** シーズン章用（スキン・Unit・GB・Since なし） */
export function buildUserCareerBoardRows(
  board: UserCareerBoardStats,
  language: "ja" | "en"
): UserCareerSummaryRow[] {
  const labels = userCareerSummaryLabels(language);
  const keys: UserCareerSummaryRowKey[] = [
    "predictions",
    "hits",
    "exactHits",
    "winRate",
    "maxWinStreak",
    "bestWeeklyRank",
    "bestMonthlyRank",
    "weeklyTop10",
    "monthlyTop10",
  ];
  const summaryLike: UserCareerSummary = {
    ...board,
    sinceYear: null,
    unlockedSkinCount: 0,
    lifetimeUnitsEarned: null,
    bestGroupBattleRank: null,
  };
  const all = buildUserCareerSummaryRows(summaryLike, language);
  return all.filter((r) => keys.includes(r.key));
}
