/**
 * 既存 Firestore ソースから user_career を合成（バックフィル / ensure 用）。
 * 追加の重い横断クエリはしない（period / group battle は別バッチで載せる）。
 *
 * ソース（NBA のみ。WC / football は含めない）:
 * - cumulative_stats.rankingBySeason / rankingByNbaPlayoffs / rankingByPhase(play_in|playoffs|regular)
 * - users.createdAt / memberSince / proSkinUnlockedIds / proSkinProgress
 * - unit_ledger 合計は任意（渡されたときだけ）
 * - 週/月ベスト順位は user_reports / period_ranking_snapshots を backfill でマージ
 * - 投稿数・的中・勝率・連勝・完全的中の正は backfill 時の NBA posts スキャン
 */

import { countMilestoneUnlockedProSkins } from "@/lib/profile/proSkinUnlock";
import {
  CURRENT_NBA_SEASON_KEY,
  previousNbaSeasonKey,
} from "@/lib/rankings/nbaSeason";
import {
  betterRank,
  boardFromPostsWinsExact,
  emptyCareerBoardStats,
  emptyUserCareerDoc,
  maxStreak,
  USER_CAREER_SCHEMA_VERSION,
  type UserCareerBoardStats,
  type UserCareerDoc,
  type UserCareerSeasonChapter,
  type UserCareerSummary,
} from "@/lib/profile/userCareer";

function safeInt(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

function timestampToMs(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === "number" && Number.isFinite(v)) {
    return v < 1e12 ? Math.floor(v * 1000) : Math.floor(v);
  }
  if (v instanceof Date) {
    const ms = v.getTime();
    return Number.isFinite(ms) ? ms : null;
  }
  if (typeof v === "string") {
    const ms = Date.parse(v);
    return Number.isFinite(ms) ? ms : null;
  }
  if (typeof v === "object") {
    const o = v as { toMillis?: () => number; seconds?: number; _seconds?: number };
    if (typeof o.toMillis === "function") {
      const ms = o.toMillis();
      return Number.isFinite(ms) ? ms : null;
    }
    if (typeof o.seconds === "number") return Math.floor(o.seconds * 1000);
    if (typeof o._seconds === "number") return Math.floor(o._seconds * 1000);
  }
  return null;
}

function sinceYearFromUser(user: Record<string, unknown> | null | undefined): number | null {
  if (!user) return null;
  const ms =
    timestampToMs(user.memberSinceMs) ??
    timestampToMs(user.memberSince) ??
    timestampToMs(user.createdAt) ??
    timestampToMs(user.createdAtMs);
  if (ms == null) return null;
  const y = new Date(ms).getFullYear();
  return Number.isFinite(y) && y >= 2000 ? y : null;
}

function unlockedSkinCountFromUser(
  user: Record<string, unknown> | null | undefined
): number {
  if (!user) return 0;
  const ids = user.proSkinUnlockedIds;
  if (!Array.isArray(ids)) return 0;
  return countMilestoneUnlockedProSkins(ids);
}

function maxWinStreakFromUser(
  user: Record<string, unknown> | null | undefined
): number | null {
  if (!user) return null;
  const mb = user.maxWinStreakBySport as
    | { basketball?: number; football?: number }
    | undefined;
  let max = 0;
  if (typeof mb?.basketball === "number" && Number.isFinite(mb.basketball)) {
    max = Math.max(max, Math.floor(mb.basketball));
  }
  // football / WC 連勝は CAREER に含めない
  if (typeof user.maxWinStreak === "number" && Number.isFinite(user.maxWinStreak)) {
    max = Math.max(max, Math.floor(user.maxWinStreak));
  }
  const progress =
    user.proSkinProgress && typeof user.proSkinProgress === "object"
      ? (user.proSkinProgress as Record<string, unknown>)
      : null;
  if (progress) {
    max = Math.max(max, safeInt(progress.maxWinStreak));
  }
  const sb = user.streakBySport as
    | { basketball?: number; football?: number }
    | undefined;
  if (typeof sb?.basketball === "number" && sb.basketball > 0) {
    max = Math.max(max, Math.floor(sb.basketball));
  }
  if (typeof user.currentStreak === "number" && user.currentStreak > 0) {
    max = Math.max(max, Math.floor(user.currentStreak));
  }
  return max >= 1 ? max : null;
}

function maxWinStreakFromCumulativeBuckets(
  cumulative: Record<string, unknown> | null | undefined
): number | null {
  if (!cumulative) return null;
  let max = 0;
  const bump = (node: unknown) => {
    if (!node || typeof node !== "object") return;
    const o = node as Record<string, unknown>;
    max = Math.max(max, safeInt(o.maxWinStreak ?? o.bestWinStreak));
  };
  bump(cumulative);
  bump(cumulative.ranking);
  for (const bucket of Object.values(
    (cumulative.rankingBySeason ?? {}) as Record<string, unknown>
  )) {
    bump(bucket);
  }
  for (const bucket of Object.values(
    (cumulative.rankingByNbaPlayoffs ?? {}) as Record<string, unknown>
  )) {
    bump(bucket);
  }
  for (const bucket of Object.values(
    (cumulative.rankingByPhase ?? {}) as Record<string, unknown>
  )) {
    bump(bucket);
  }
  const sb = cumulative.streakBySport as
    | { basketball?: number; football?: number }
    | undefined;
  const mb = cumulative.maxWinStreakBySport as
    | { basketball?: number; football?: number }
    | undefined;
  if (typeof mb?.basketball === "number") {
    max = Math.max(max, Math.floor(mb.basketball));
  }
  if (typeof cumulative.maxWinStreak === "number") {
    max = Math.max(max, Math.floor(cumulative.maxWinStreak));
  }
  const active = safeInt(
    cumulative.activeWinStreakBasketball ??
      sb?.basketball ??
      cumulative.currentStreak ??
      cumulative.activeWinStreak
  );
  max = Math.max(max, active);
  max = Math.max(max, maxWinStreakFromProfileChartsLast20(cumulative));
  return max >= 1 ? max : null;
}

/** profileCharts.last20 の時系列から連勝ピーク（users に max が無い場合の保険） */
function maxWinStreakFromProfileChartsLast20(
  cumulative: Record<string, unknown>
): number {
  const charts = cumulative.profileCharts as
    | { last20?: unknown }
    | undefined;
  const raw = charts?.last20;
  if (!Array.isArray(raw) || raw.length === 0) return 0;
  const points = raw
    .filter(
      (p): p is { settledAtMs?: unknown; isWin?: unknown } =>
        !!p && typeof p === "object"
    )
    .map((p) => ({
      settledAtMs: safeInt(p.settledAtMs),
      isWin: p.isWin === true,
    }))
    .sort((a, b) => a.settledAtMs - b.settledAtMs);
  let cur = 0;
  let peak = 0;
  for (const p of points) {
    if (p.isWin) {
      cur += 1;
      peak = Math.max(peak, cur);
    } else {
      cur = 0;
    }
  }
  return peak;
}

function bucketToBoard(
  bucket: Record<string, unknown> | null | undefined,
  extras?: Partial<UserCareerBoardStats>
): UserCareerBoardStats {
  if (!bucket) {
    return boardFromPostsWinsExact({ ...extras });
  }
  const predictions = safeInt(bucket.totalPosts ?? bucket.posts);
  const hits = safeInt(bucket.totalWins ?? bucket.wins);
  const exactHits = safeInt(
    bucket.exactHitCount ?? bucket.totalExactHits ?? bucket.exactHits
  );
  return boardFromPostsWinsExact({
    predictions,
    hits,
    exactHits,
    maxWinStreak: extras?.maxWinStreak ?? null,
    bestWeeklyRank: extras?.bestWeeklyRank ?? null,
    bestMonthlyRank: extras?.bestMonthlyRank ?? null,
    weeklyTop10Count: extras?.weeklyTop10Count ?? 0,
    monthlyTop10Count: extras?.monthlyTop10Count ?? 0,
  });
}

function mergeBoards(
  a: UserCareerBoardStats,
  b: UserCareerBoardStats
): UserCareerBoardStats {
  const predictions = a.predictions + b.predictions;
  const hits = a.hits + b.hits;
  const exactHits = a.exactHits + b.exactHits;
  return boardFromPostsWinsExact({
    predictions,
    hits,
    exactHits,
    maxWinStreak: maxStreak(a.maxWinStreak, b.maxWinStreak),
    bestWeeklyRank: betterRank(a.bestWeeklyRank, b.bestWeeklyRank),
    bestMonthlyRank: betterRank(a.bestMonthlyRank, b.bestMonthlyRank),
    weeklyTop10Count: a.weeklyTop10Count + b.weeklyTop10Count,
    monthlyTop10Count: a.monthlyTop10Count + b.monthlyTop10Count,
  });
}

function seasonKeysFromCumulative(
  cumulative: Record<string, unknown> | null | undefined
): string[] {
  const keys = new Set<string>();
  keys.add(CURRENT_NBA_SEASON_KEY);
  keys.add(previousNbaSeasonKey(CURRENT_NBA_SEASON_KEY));
  if (!cumulative) return [...keys];
  const bySeason = (cumulative.rankingBySeason ?? {}) as Record<string, unknown>;
  const byPlayoffs = (cumulative.rankingByNbaPlayoffs ?? {}) as Record<
    string,
    unknown
  >;
  for (const k of Object.keys(bySeason)) {
    if (/^\d{4}-\d{2}$/.test(k)) keys.add(k);
  }
  for (const k of Object.keys(byPlayoffs)) {
    if (/^\d{4}-\d{2}$/.test(k)) keys.add(k);
  }
  return [...keys].sort();
}

export type BuildUserCareerFromSourcesInput = {
  uid: string;
  cumulative?: Record<string, unknown> | null;
  user?: Record<string, unknown> | null;
  /** unit_ledger 正付与の合計（事前集計）。未指定なら null のまま */
  lifetimeUnitsEarned?: number | null;
  /** 既存 career があればピーク系を引き継ぐ */
  existing?: UserCareerDoc | null;
  source?: string;
  nowMs?: number;
};

/**
 * cumulative + users から CAREER 正本を組み立てる。
 * 週/月ピーク・GB・lifetime units は existing / 引数があるときのみ反映。
 */
export function buildUserCareerFromSources(
  input: BuildUserCareerFromSourcesInput
): UserCareerDoc {
  const nowMs = input.nowMs ?? Date.now();
  const existing = input.existing ?? null;
  const base = existing ?? emptyUserCareerDoc(input.uid);

  const bySeason: Record<string, Record<string, unknown>> = {
    ...((input.cumulative?.rankingBySeason ?? {}) as Record<
      string,
      Record<string, unknown>
    >),
  };
  const byPlayoffs: Record<string, Record<string, unknown>> = {
    ...((input.cumulative?.rankingByNbaPlayoffs ?? {}) as Record<
      string,
      Record<string, unknown>
    >),
  };
  /** レガシー: season キー無しの phase 集計（25-26 プレーオフなど） */
  const byPhase = (input.cumulative?.rankingByPhase ?? {}) as Record<
    string,
    Record<string, unknown>
  >;
  const byPlayoffRound = (input.cumulative
    ?.rankingByPlayoffRound ?? {}) as Record<string, Record<string, unknown>>;

  const progress =
    input.user?.proSkinProgress &&
    typeof input.user.proSkinProgress === "object"
      ? (input.user.proSkinProgress as Record<string, unknown>)
      : null;
  const progressSeason =
    typeof progress?.seasonKey === "string" ? progress.seasonKey : null;
  const progressExact = safeInt(progress?.exactHits);
  const progressMaxStreak = safeInt(progress?.maxWinStreak);

  const seasons: Record<string, UserCareerSeasonChapter> = {
    ...base.seasons,
  };

  /** プレーオフ phase は 4–6 月想定 → 直前シーズンキー（例: 今が 2026-27 なら 2025-26） */
  const legacyPlayoffsSeasonKey = previousNbaSeasonKey(CURRENT_NBA_SEASON_KEY);
  if (
    byPhase.playoffs &&
    typeof byPhase.playoffs === "object" &&
    !byPlayoffs[legacyPlayoffsSeasonKey]
  ) {
    byPlayoffs[legacyPlayoffsSeasonKey] = byPhase.playoffs;
  }
  // play_in はプレーオフ章へ合算（CAREER は NBA のみ。wc phase は無視）
  if (byPhase.play_in && typeof byPhase.play_in === "object") {
    const existingPo = byPlayoffs[legacyPlayoffsSeasonKey];
    const pi = byPhase.play_in;
    if (!existingPo) {
      byPlayoffs[legacyPlayoffsSeasonKey] = pi;
    } else {
      byPlayoffs[legacyPlayoffsSeasonKey] = {
        ...existingPo,
        totalPosts:
          safeInt(existingPo.totalPosts ?? existingPo.posts) +
          safeInt(pi.totalPosts ?? pi.posts),
        totalWins:
          safeInt(existingPo.totalWins ?? existingPo.wins) +
          safeInt(pi.totalWins ?? pi.wins),
        totalPoints:
          safeInt(existingPo.totalPoints) + safeInt(pi.totalPoints),
        exactHitCount:
          safeInt(
            existingPo.exactHitCount ??
              existingPo.totalExactHits ??
              existingPo.exactHits
          ) +
          safeInt(pi.exactHitCount ?? pi.totalExactHits ?? pi.exactHits),
      };
    }
  }
  if (
    byPhase.regular &&
    typeof byPhase.regular === "object" &&
    !bySeason[legacyPlayoffsSeasonKey] &&
    !bySeason[CURRENT_NBA_SEASON_KEY]
  ) {
    // regular phase は現行キーへ（曖昧なら current）
    bySeason[CURRENT_NBA_SEASON_KEY] = byPhase.regular;
  }
  // ラウンド別を合算して playoffs が空のときの保険
  if (!byPlayoffs[legacyPlayoffsSeasonKey] && Object.keys(byPlayoffRound).length > 0) {
    let posts = 0;
    let wins = 0;
    let points = 0;
    let exact = 0;
    for (const round of Object.values(byPlayoffRound)) {
      if (!round || typeof round !== "object") continue;
      posts += safeInt(round.totalPosts ?? round.posts);
      wins += safeInt(round.totalWins ?? round.wins);
      points += safeInt(round.totalPoints ?? round.pointsSumV3);
      exact += safeInt(round.exactHitCount ?? round.totalExactHits);
    }
    if (posts > 0) {
      byPlayoffs[legacyPlayoffsSeasonKey] = {
        totalPosts: posts,
        totalWins: wins,
        totalPoints: points,
        exactHitCount: exact,
      };
    }
  }

  const allSeasonKeys = new Set<string>([
    ...seasonKeysFromCumulative(input.cumulative ?? null),
    ...Object.keys(bySeason),
    ...Object.keys(byPlayoffs),
  ]);

  for (const seasonKey of [...allSeasonKeys].sort()) {
    const prev = seasons[seasonKey];
    const regularExtras: Partial<UserCareerBoardStats> = {
      bestWeeklyRank: prev?.regular.bestWeeklyRank ?? null,
      bestMonthlyRank: prev?.regular.bestMonthlyRank ?? null,
      weeklyTop10Count: prev?.regular.weeklyTop10Count ?? 0,
      monthlyTop10Count: prev?.regular.monthlyTop10Count ?? 0,
      maxWinStreak:
        progressSeason === seasonKey && progressMaxStreak > 0
          ? progressMaxStreak
          : prev?.regular.maxWinStreak ?? null,
    };
    const playoffExtras: Partial<UserCareerBoardStats> = {
      bestWeeklyRank: prev?.playoffs.bestWeeklyRank ?? null,
      bestMonthlyRank: prev?.playoffs.bestMonthlyRank ?? null,
      weeklyTop10Count: prev?.playoffs.weeklyTop10Count ?? 0,
      monthlyTop10Count: prev?.playoffs.monthlyTop10Count ?? 0,
      maxWinStreak: prev?.playoffs.maxWinStreak ?? null,
    };

    let regular = bucketToBoard(bySeason[seasonKey], regularExtras);
    let playoffs = bucketToBoard(byPlayoffs[seasonKey], playoffExtras);

    // exactHits: cumulative に無いことが多い → 今季は proSkinProgress を載せる
    if (progressSeason === seasonKey && progressExact > 0) {
      regular = boardFromPostsWinsExact({
        ...regular,
        exactHits: Math.max(regular.exactHits, progressExact),
      });
    }

    // 活動ゼロの章は、既存ピークがなければ落とす
    const hasActivity =
      regular.predictions > 0 ||
      playoffs.predictions > 0 ||
      (regular.bestWeeklyRank != null ||
        regular.bestMonthlyRank != null ||
        playoffs.bestWeeklyRank != null ||
        playoffs.bestMonthlyRank != null);
    if (!hasActivity && !prev) continue;

    seasons[seasonKey] = { regular, playoffs };
  }

  let rolled = emptyCareerBoardStats();
  for (const chapter of Object.values(seasons)) {
    rolled = mergeBoards(rolled, chapter.regular);
    rolled = mergeBoards(rolled, chapter.playoffs);
  }

  // ルート totalPosts/totalWins は全リーグ合算のため CAREER（NBA のみ）には使わない

  // exactHits は NBA settle / posts バックフィル側が正。cumulative の precision スコアは使わない
  if (progressExact > 0) {
    rolled = boardFromPostsWinsExact({
      ...rolled,
      exactHits: Math.max(rolled.exactHits, progressExact),
    });
  }

  const summary: UserCareerSummary = {
    ...rolled,
    maxWinStreak: maxStreak(
      maxStreak(
        rolled.maxWinStreak,
        maxWinStreakFromCumulativeBuckets(input.cumulative ?? null)
      ),
      maxStreak(
        maxWinStreakFromUser(input.user),
        progressMaxStreak > 0 ? progressMaxStreak : null
      )
    ),
    bestWeeklyRank: betterRank(
      rolled.bestWeeklyRank,
      base.summary.bestWeeklyRank
    ),
    bestMonthlyRank: betterRank(
      rolled.bestMonthlyRank,
      base.summary.bestMonthlyRank
    ),
    weeklyTop10Count: Math.max(
      rolled.weeklyTop10Count,
      base.summary.weeklyTop10Count
    ),
    monthlyTop10Count: Math.max(
      rolled.monthlyTop10Count,
      base.summary.monthlyTop10Count
    ),
    sinceYear: sinceYearFromUser(input.user) ?? base.summary.sinceYear,
    unlockedSkinCount:
      input.user && Array.isArray(input.user.proSkinUnlockedIds)
        ? unlockedSkinCountFromUser(input.user)
        : Math.max(
            unlockedSkinCountFromUser(input.user),
            base.summary.unlockedSkinCount
          ),
    lifetimeUnitsEarned:
      input.lifetimeUnitsEarned != null
        ? safeInt(input.lifetimeUnitsEarned)
        : base.summary.lifetimeUnitsEarned,
    bestGroupBattleRank: betterRank(
      base.summary.bestGroupBattleRank,
      null
    ),
  };

  return {
    v: USER_CAREER_SCHEMA_VERSION,
    uid: input.uid,
    summary,
    seasons,
    periodSeen: { ...(base.periodSeen ?? {}) },
    groupBattleSeen: { ...(base.groupBattleSeen ?? {}) },
    updatedAtMs: nowMs,
    source: input.source ?? "build",
  };
}

/** 週/月順位を career にマージ（冪等） */
export function applyPeriodRankToCareer(
  career: UserCareerDoc,
  opts: {
    period: "weekly" | "monthly";
    label: string;
    rank: number;
    /** 紐づけるシーズン章（regular）。不明なら summary のみ */
    seasonKey?: string | null;
    board?: "regular" | "playoffs";
    nowMs?: number;
  }
): UserCareerDoc {
  const rank = Math.floor(opts.rank);
  if (!Number.isFinite(rank) || rank < 1) return career;

  const key =
    opts.period === "weekly" ? `w:${opts.label}` : `m:${opts.label}`;
  const seen = { ...(career.periodSeen ?? {}) };
  if (seen[key] != null) {
    // 既処理 — best だけ再評価して返す
    const next = { ...career, summary: { ...career.summary } };
    if (opts.period === "weekly") {
      next.summary.bestWeeklyRank = betterRank(
        next.summary.bestWeeklyRank,
        rank
      );
    } else {
      next.summary.bestMonthlyRank = betterRank(
        next.summary.bestMonthlyRank,
        rank
      );
    }
    return next;
  }
  seen[key] = rank;

  const isTop10 = rank <= 10;
  const summary = { ...career.summary };
  if (opts.period === "weekly") {
    summary.bestWeeklyRank = betterRank(summary.bestWeeklyRank, rank);
    if (isTop10) summary.weeklyTop10Count += 1;
  } else {
    summary.bestMonthlyRank = betterRank(summary.bestMonthlyRank, rank);
    if (isTop10) summary.monthlyTop10Count += 1;
  }

  const seasons = { ...career.seasons };
  const seasonKey = opts.seasonKey?.trim() || null;
  if (seasonKey) {
    const boardKey = opts.board ?? "regular";
    const chapter = seasons[seasonKey] ?? {
      regular: emptyCareerBoardStats(),
      playoffs: emptyCareerBoardStats(),
    };
    const board = { ...chapter[boardKey] };
    if (opts.period === "weekly") {
      board.bestWeeklyRank = betterRank(board.bestWeeklyRank, rank);
      if (isTop10) board.weeklyTop10Count += 1;
    } else {
      board.bestMonthlyRank = betterRank(board.bestMonthlyRank, rank);
      if (isTop10) board.monthlyTop10Count += 1;
    }
    seasons[seasonKey] = { ...chapter, [boardKey]: board };
  }

  return {
    ...career,
    summary,
    seasons,
    periodSeen: seen,
    updatedAtMs: opts.nowMs ?? Date.now(),
    source: "period",
  };
}

export function applyGroupBattleRankToCareer(
  career: UserCareerDoc,
  opts: {
    battleId: string;
    period: "weekly" | "monthly";
    label: string;
    rank: number;
    nowMs?: number;
  }
): UserCareerDoc {
  const rank = Math.floor(opts.rank);
  if (!Number.isFinite(rank) || rank < 1) return career;
  const key = `gb:${opts.battleId}:${opts.period}:${opts.label}`;
  const seen = { ...(career.groupBattleSeen ?? {}) };
  if (seen[key] != null) {
    return {
      ...career,
      summary: {
        ...career.summary,
        bestGroupBattleRank: betterRank(
          career.summary.bestGroupBattleRank,
          rank
        ),
      },
    };
  }
  seen[key] = rank;
  return {
    ...career,
    summary: {
      ...career.summary,
      bestGroupBattleRank: betterRank(
        career.summary.bestGroupBattleRank,
        rank
      ),
    },
    groupBattleSeen: seen,
    updatedAtMs: opts.nowMs ?? Date.now(),
    source: "group_battle",
  };
}

export function applySettleToCareer(
  career: UserCareerDoc,
  opts: {
    seasonKey: string;
    board: "regular" | "playoffs";
    isWin: boolean;
    exactHit: boolean;
    activeWinStreak: number;
    nowMs?: number;
  }
): UserCareerDoc {
  const seasons = { ...career.seasons };
  const chapter = seasons[opts.seasonKey] ?? {
    regular: emptyCareerBoardStats(),
    playoffs: emptyCareerBoardStats(),
  };
  const board = { ...chapter[opts.board] };
  board.predictions += 1;
  if (opts.isWin) board.hits += 1;
  if (opts.exactHit) board.exactHits += 1;
  board.winRatePct =
    board.predictions > 0
      ? Math.round((board.hits / board.predictions) * 1000) / 10
      : 0;
  board.maxWinStreak = maxStreak(board.maxWinStreak, opts.activeWinStreak);
  seasons[opts.seasonKey] = { ...chapter, [opts.board]: board };

  const summary = { ...career.summary };
  summary.predictions += 1;
  if (opts.isWin) summary.hits += 1;
  if (opts.exactHit) summary.exactHits += 1;
  summary.winRatePct =
    summary.predictions > 0
      ? Math.round((summary.hits / summary.predictions) * 1000) / 10
      : 0;
  summary.maxWinStreak = maxStreak(summary.maxWinStreak, opts.activeWinStreak);

  return {
    ...career,
    summary,
    seasons,
    updatedAtMs: opts.nowMs ?? Date.now(),
    source: "settle",
  };
}

export function applySkinUnlockCountToCareer(
  career: UserCareerDoc,
  unlockedSkinCount: number,
  nowMs?: number
): UserCareerDoc {
  return {
    ...career,
    summary: {
      ...career.summary,
      unlockedSkinCount: Math.max(
        career.summary.unlockedSkinCount,
        safeInt(unlockedSkinCount)
      ),
    },
    updatedAtMs: nowMs ?? Date.now(),
    source: "skin",
  };
}

export function applyUnitsEarnedToCareer(
  career: UserCareerDoc,
  amount: number,
  nowMs?: number
): UserCareerDoc {
  const add = safeInt(amount);
  if (add <= 0) return career;
  const prev = career.summary.lifetimeUnitsEarned ?? 0;
  return {
    ...career,
    summary: {
      ...career.summary,
      lifetimeUnitsEarned: prev + add,
    },
    updatedAtMs: nowMs ?? Date.now(),
    source: "units",
  };
}
