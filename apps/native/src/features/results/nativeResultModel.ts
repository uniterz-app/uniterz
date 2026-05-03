/**
 * Web `lib/result/result-page-data.ts` と同一ロジック（ネイティブは `@/` 解決を避けて自己完結）
 */
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

function formatResultDateLabel(ms: number | null | undefined, lang: "ja" | "en"): string {
  if (!ms) return lang === "en" ? "Unknown" : "不明";
  const d = new Date(ms);
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
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
    const byResultInputOrder = (a: PostWithMillis, b: PostWithMillis): number => {
      const ae = a.settledAtMillis ?? a.createdAtMillis ?? a.startAtMillis ?? 0;
      const be = b.settledAtMillis ?? b.createdAtMillis ?? b.startAtMillis ?? 0;
      return be - ae;
    };
    day.pending.sort(byResultInputOrder);
    day.final.sort(byResultInputOrder);
  });

  return days;
}
