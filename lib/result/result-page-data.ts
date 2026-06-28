import type { PredictionPostV2 } from "@/types/prediction-post-v2";
import type { Language } from "@/lib/i18n/language";
import { LEAGUES, resolvePostListLeague, type League } from "@/lib/leagues";
import {
  TIMEZONE_ET,
  TIMEZONE_JST,
  getZonedYMD,
} from "@/lib/time/zonedTime";
import { compareResultPostsForDayList } from "@/lib/result/resultPostDaySort";

/** リザルト一覧のリーグタブ（ワールドカップ / NBA） */
export const RESULT_LIST_LEAGUE_TABS = [LEAGUES.WC, LEAGUES.NBA] as const;
export type ResultListLeagueTab = (typeof RESULT_LIST_LEAGUE_TABS)[number];

export type PostWithMillis = PredictionPostV2 & {
  createdAtMillis?: number | null;
  settledAtMillis?: number | null;
};

export type ResultDayGroup = {
  dateLabel: string;
  dateMs: number;
  pending: PostWithMillis[];
  final: PostWithMillis[];
};

export function toCreatedAtMillis(p: unknown): number | null {
  const o = p as Record<string, unknown> | null | undefined;
  if (typeof o?.createdAtMillis === "number") return o.createdAtMillis;

  const t = o?.createdAt as { toMillis?: () => number; seconds?: number } | undefined;
  if (t?.toMillis) return t.toMillis();
  if (t?.seconds) return t.seconds * 1000;
  return null;
}

export function toSettledAtMillis(p: unknown): number | null {
  const o = p as Record<string, unknown> | null | undefined;
  if (typeof o?.settledAtMillis === "number") return o.settledAtMillis;

  const t = o?.settledAt as { toMillis?: () => number; seconds?: number } | undefined;
  if (t?.toMillis) return t.toMillis();
  if (t?.seconds) return t.seconds * 1000;
  return null;
}

/** 試合キックオフ時刻（JST 基準の Timestamp が多い） */
export function toStartAtMillis(p: unknown): number | null {
  const o = p as Record<string, unknown> | null | undefined;
  if (typeof o?.startAtMillis === "number" && Number.isFinite(o.startAtMillis)) {
    return o.startAtMillis;
  }
  const t = (o?.startAtJst ?? o?.startAt) as
    | { toMillis?: () => number; seconds?: number }
    | undefined;
  if (t?.toMillis) return t.toMillis();
  if (t?.seconds) return t.seconds * 1000;
  return null;
}

/**
 * リザルト一覧の「キックオフ前のみ一覧から除外」が可能か。
 * 開始時刻が取れない投稿は除外操作不可（誤消去防止）。
 */
export function canDismissResultListPostNow(
  post: PostWithMillis,
  nowMs: number = Date.now()
): boolean {
  const start = post.startAtMillis;
  if (typeof start !== "number" || !Number.isFinite(start)) return false;
  return nowMs < start;
}

/**
 * キックオフ済みの投稿は除外セットから外す（試合後にカードを再表示する）。
 */
export function pruneDismissedResultListPostIds(
  ids: Set<string>,
  posts: readonly PostWithMillis[],
  nowMs: number
): Set<string> {
  const byId = new Map(posts.map((p) => [p.id, p] as const));
  const next = new Set<string>();
  for (const id of ids) {
    const p = byId.get(id);
    if (!p) {
      next.add(id);
      continue;
    }
    if (canDismissResultListPostNow(p, nowMs)) next.add(id);
  }
  return next;
}

/** リザルト一覧の日付見出し用 TZ（試合一覧の dayTimeZone と揃える） */
export function resultListTimeZoneForLanguage(lang: Language): string {
  return lang === "en" ? TIMEZONE_ET : TIMEZONE_JST;
}

export function formatResultDateLabel(
  ms: number | null | undefined,
  lang: Language,
  timeZone?: string
): string {
  if (!ms) return lang === "en" ? "Unknown" : "不明";
  const tz = timeZone ?? resultListTimeZoneForLanguage(lang);
  const { year, month, day } = getZonedYMD(new Date(ms), tz);
  return `${year}.${month}.${day}`;
}

/** 日付フィルター用 YYYY-MM-DD（formatResultDateLabel と同じ TZ） */
export function resultListLocalDayKeyFromMs(
  ms: number,
  lang: Language,
  timeZone?: string
): string {
  const tz = timeZone ?? resultListTimeZoneForLanguage(lang);
  const { year, month, day } = getZonedYMD(new Date(ms), tz);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** 日付見出し・日別グループの基準。試合キックオフ日（startAt）。未取得のときだけ投稿日にフォールバック。 */
export function getGroupDateMillis(post: PostWithMillis): number {
  return post.startAtMillis ?? post.createdAtMillis ?? 0;
}

export function isFinalResultPost(post: PostWithMillis): boolean {
  return post.status === "final" && !!post.settledAtMillis;
}

export function resultPostKickoffMillis(post: PostWithMillis): number {
  return post.startAtMillis ?? post.createdAtMillis ?? 0;
}

/** 試合カード `compareGamesByKickoffAsc` と同系のタイブレーク用 ID（gameId 優先） */
export function resultPostTieBreakId(post: PostWithMillis): string {
  const gameId = post.gameId;
  if (typeof gameId === "string" && gameId.length > 0) return gameId;
  return post.id;
}

/**
 * 同一日付内: 試合一覧（早い→上）の逆 — 遅いキックオフを上、早いを下。
 * キックオフ同時刻は試合カードの id 昇順を反転（gameId 優先）。
 */
export function compareResultPostsByKickoffDesc(
  a: PostWithMillis,
  b: PostWithMillis
): number {
  const diff = resultPostKickoffMillis(b) - resultPostKickoffMillis(a);
  if (diff !== 0) return diff;
  return resultPostTieBreakId(b).localeCompare(resultPostTieBreakId(a), "en");
}

/** pending / final をキックオフ降順で1列に並べる（一覧表示用） */
export function mergeResultDayPostsByKickoff(
  day: Pick<ResultDayGroup, "pending" | "final">
): PostWithMillis[] {
  return [...day.pending, ...day.final].sort(compareResultPostsByKickoffDesc);
}

/** Firestore 行から PostWithMillis を組み立て */
export function mapDocToPostWithMillis(id: string, raw: unknown): PostWithMillis {
  const r = raw as Record<string, unknown>;
  const createdAtMillis = toCreatedAtMillis(raw);
  const settledAtMillis = toSettledAtMillis(raw);
  const startAtMillis = toStartAtMillis(raw);

  return {
    id,
    ...r,
    createdAtMillis: createdAtMillis ?? (r.createdAtMillis as number | null) ?? null,
    settledAtMillis: settledAtMillis ?? (r.settledAtMillis as number | null) ?? null,
    startAtMillis: startAtMillis ?? (r.startAtMillis as number | null) ?? null,
  } as PostWithMillis;
}

export function groupPostsByResultDay(
  posts: PostWithMillis[],
  language: Language
): ResultDayGroup[] {
  const dayMap = new Map<
    string,
    {
      dateLabel: string;
      dateMs: number;
      pending: PostWithMillis[];
      final: PostWithMillis[];
    }
  >();

  posts.forEach((post) => {
    const groupMs = getGroupDateMillis(post);
    const dateLabel = formatResultDateLabel(groupMs, language);

    if (!dayMap.has(dateLabel)) {
      dayMap.set(dateLabel, {
        dateLabel,
        dateMs: groupMs,
        pending: [],
        final: [],
      });
    }

    const bucket = dayMap.get(dateLabel)!;

    if (isFinalResultPost(post)) {
      bucket.final.push(post);
    } else {
      bucket.pending.push(post);
    }
  });

  /* 一覧・3D とも「上＝新しい試合日」（降順） */
  const days = Array.from(dayMap.values()).sort((a, b) => b.dateMs - a.dateMs);

  days.forEach((day) => {
    day.pending.sort(compareResultPostsForDayList);
    day.final.sort(compareResultPostsForDayList);
  });

  return days;
}

/** リザルト一覧のリーグタブ用（日付グループ・並び順は維持） */
export function filterResultDayGroupsByLeague(
  groups: readonly ResultDayGroup[],
  league: League
): ResultDayGroup[] {
  return groups
    .map((day) => ({
      ...day,
      pending: day.pending.filter((p) => resolvePostListLeague(p) === league),
      final: day.final.filter((p) => resolvePostListLeague(p) === league),
    }))
    .filter((day) => day.pending.length + day.final.length > 0);
}

/**
 * リザルト一覧の初回読み込みで載せる試合日グループ数（古い日は無限スクロールで追加）。
 */
export const RESULT_LIST_INITIAL_MAX_DAY_GROUPS = 5;

/**
 * 3D 表示（テーブル・ヘリックス共通）に含める「試合日」の最大数（一覧は新しい日が上のため、直近の日は先頭からこの件数）。
 */
export const RESULT_CSS3D_MAX_DAY_GROUPS = RESULT_LIST_INITIAL_MAX_DAY_GROUPS;

/** 投稿群に含まれる試合日グループ数（キックオフ日基準） */
export function countResultDayGroups(
  posts: readonly PostWithMillis[],
  language: Language
): number {
  return groupPostsByResultDay([...posts], language).length;
}

/** 直近 maxDayGroups 試合日分の投稿だけ残す（新しい日が上） */
export function trimPostsToMaxDayGroups(
  posts: readonly PostWithMillis[],
  language: Language,
  maxDayGroups: number
): { posts: PostWithMillis[]; trimmed: boolean } {
  const groups = groupPostsByResultDay([...posts], language);
  if (groups.length <= maxDayGroups) {
    return { posts: [...posts], trimmed: false };
  }
  return {
    posts: flattenResultDayGroups(groups.slice(0, maxDayGroups)),
    trimmed: true,
  };
}

/**
 * リスト・3D 共通: 「1 試合日」あたりに載せるカードの上限（pending→final の順で数える）。
 * 一覧の仮想化・メモリ負荷用。グリッド（2×3 等）で1画面に収まる枚数に合わせる。
 */
export const RESULT_LIST_MAX_POSTS_PER_DAY = 6;

/** リザルト一覧でメモリ上に保持する投稿の上限（超えた分は破棄。無限スクロールの負荷軽減） */
export const RESULT_POSTS_MAX_CACHED = 400;

/** 1 試合日の表示を上限で切ったとき、pending を優先してから final を詰める */
export function sliceDayPostsForListRender(
  day: ResultDayGroup,
  maxTotal: number
): {
  pending: PostWithMillis[];
  final: PostWithMillis[];
  omittedCount: number;
} {
  const { pending, final } = day;
  const total = pending.length + final.length;
  if (total <= maxTotal) {
    return { pending, final, omittedCount: 0 };
  }
  const pendingShown = pending.slice(0, Math.min(pending.length, maxTotal));
  const remaining = maxTotal - pendingShown.length;
  const finalShown = final.slice(0, Math.max(0, remaining));
  const omittedCount =
    total - pendingShown.length - finalShown.length;
  return {
    pending: pendingShown,
    final: finalShown,
    omittedCount,
  };
}

/** 一覧の「その日」の合計用。各投稿の総合得点（pointsV3）を足す */
export function sumDayPointsV3(posts: readonly PostWithMillis[]): number {
  let s = 0;
  for (const p of posts) {
    const v = p.stats?.pointsV3 ?? p.stats?.pointsV3Detail?.totalPoints;
    if (typeof v === "number" && Number.isFinite(v)) s += v;
  }
  return s;
}

/** 日付行の合計表示に使う前に、各確定投稿へ得点が書き込まれているか（0 点も記録済み） */
export function hasPointsV3Recorded(post: PostWithMillis): boolean {
  const stats = post.stats;
  if (!stats) return false;
  const pv3 = stats.pointsV3;
  if (typeof pv3 === "number" && Number.isFinite(pv3)) return true;
  const tp = stats.pointsV3Detail?.totalPoints;
  return typeof tp === "number" && Number.isFinite(tp);
}

export function flattenResultDayGroups(
  groups: readonly ResultDayGroup[]
): PostWithMillis[] {
  const out: PostWithMillis[] = [];
  for (const day of groups) {
    out.push(...mergeResultDayPostsByKickoff(day));
  }
  return out;
}

/** リザルト一覧（NBA / WC タブ）：1回あたりの取得件数 */
export const RESULT_TAB_PAGE_SIZE = 10;

/** @deprecated タブ別取得に移行。互換のため残す */
export const RESULT_INITIAL_PAGE_SIZE = RESULT_TAB_PAGE_SIZE;
/** @deprecated タブ別取得に移行 */
export const RESULT_NEXT_PAGE_SIZE = RESULT_TAB_PAGE_SIZE;
