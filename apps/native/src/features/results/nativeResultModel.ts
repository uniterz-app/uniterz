/**
 * Web `lib/result/result-page-data.ts` と同一ロジック（ネイティブは `@/` 解決を避けて自己完結）
 */
import {
  TIMEZONE_ET,
  TIMEZONE_JST,
  getZonedYMD,
} from "../../../../../lib/time/zonedTime";
import { compareResultPostsForDayList } from "../../../../../lib/result/resultPostDaySort";
export type PostWithMillis = Record<string, unknown> & {
  id: string;
  createdAtMillis?: number | null;
  settledAtMillis?: number | null;
  startAtMillis?: number | null;
  status?: string;
};

export type ResultDayGroup = {
  dateLabel: string;
  dateMs: number;
  pending: PostWithMillis[];
  final: PostWithMillis[];
};

export const RESULT_INITIAL_PAGE_SIZE = 20;
export const RESULT_NEXT_PAGE_SIZE = 10;
export const RESULT_POSTS_MAX_CACHED = 400;

function toCreatedAtMillis(p: unknown): number | null {
  const o = p as Record<string, unknown> | null | undefined;
  if (typeof o?.createdAtMillis === "number") return o.createdAtMillis;

  const t = o?.createdAt as { toMillis?: () => number; seconds?: number } | undefined;
  if (t?.toMillis) return t.toMillis();
  if (t?.seconds) return t.seconds * 1000;
  return null;
}

function toSettledAtMillis(p: unknown): number | null {
  const o = p as Record<string, unknown> | null | undefined;
  if (typeof o?.settledAtMillis === "number") return o.settledAtMillis;

  const t = o?.settledAt as { toMillis?: () => number; seconds?: number } | undefined;
  if (t?.toMillis) return t.toMillis();
  if (t?.seconds) return t.seconds * 1000;
  return null;
}

function toStartAtMillis(p: unknown): number | null {
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

function resultListTimeZoneForLanguage(lang: "ja" | "en"): string {
  return lang === "en" ? TIMEZONE_ET : TIMEZONE_JST;
}

function formatResultDateLabel(ms: number | null | undefined, lang: "ja" | "en"): string {
  if (!ms) return lang === "en" ? "Unknown" : "不明";
  const tz = resultListTimeZoneForLanguage(lang);
  const { year, month, day } = getZonedYMD(new Date(ms), tz);
  return `${year}.${month}.${day}`;
}

/** カード中央ラベル用：開催日を優先し、無ければ投稿作成日 */
export function formatResultPostCardDateLabel(
  post: Record<string, unknown>,
  lang: "ja" | "en"
): string {
  const start = post.startAtMillis;
  const created = post.createdAtMillis;
  const ms =
    typeof start === "number" && Number.isFinite(start)
      ? start
      : typeof created === "number" && Number.isFinite(created)
        ? created
        : null;
  return formatResultDateLabel(ms, lang);
}

function getGroupDateMillis(post: PostWithMillis): number {
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

/**
 * Web `canDismissResultListPostNow` と同一：キックオフ前のみ一覧からの削除 UI を出す。
 * `startAtMillis` が無い投稿は誤操作防止のため不可。
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
 * Web `GET /api/posts_v2/:id` の `editable` と同一条件。
 * 試合ドキュメントではなく投稿の `startAtMillis` で判定する（データ不整合時も API と一致させる）。
 */
export function isPostPredictionEditableForViewer(
  post: PostWithMillis,
  viewerUid: string | null | undefined,
  nowMs: number = Date.now()
): boolean {
  if (!viewerUid) return false;
  const author =
    typeof post.authorUid === "string" ? post.authorUid : String(post.authorUid ?? "");
  if (!author || author !== viewerUid) return false;
  if (Number(post.schemaVersion) !== 2) return false;
  const start = post.startAtMillis;
  if (typeof start !== "number" || !Number.isFinite(start)) return false;
  return nowMs < start;
}

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
  language: "ja" | "en"
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

  const days = Array.from(dayMap.values()).sort((a, b) => b.dateMs - a.dateMs);

  days.forEach((day) => {
    day.pending.sort(compareResultPostsForDayList);
    day.final.sort(compareResultPostsForDayList);
  });

  return days;
}
