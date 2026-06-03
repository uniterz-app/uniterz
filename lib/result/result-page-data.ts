import type { PredictionPostV2 } from "@/types/prediction-post-v2";
import type { Language } from "@/lib/i18n/language";
import { LEAGUES, type League } from "@/lib/leagues";

/** リザルト一覧のリーグタブ（NBA / ワールドカップ） */
export const RESULT_LIST_LEAGUE_TABS = [LEAGUES.NBA, LEAGUES.WC] as const;
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

export function formatResultDateLabel(
  ms: number | null | undefined,
  lang: Language
): string {
  if (!ms) return lang === "en" ? "Unknown" : "不明";
  const d = new Date(ms);
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
}

/** 日付見出し・日別グループの基準。試合キックオフ日（startAt）。未取得のときだけ投稿日にフォールバック。 */
export function getGroupDateMillis(post: PostWithMillis): number {
  return post.startAtMillis ?? post.createdAtMillis ?? 0;
}

export function isFinalResultPost(post: PostWithMillis): boolean {
  return post.status === "final" && !!post.settledAtMillis;
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
    // リザルトは「結果を入力した順」に揃える（settledAtMillis 基準）。
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

/** リザルト一覧のリーグタブ用（日付グループ・並び順は維持） */
export function filterResultDayGroupsByLeague(
  groups: readonly ResultDayGroup[],
  league: League
): ResultDayGroup[] {
  return groups
    .map((day) => ({
      ...day,
      pending: day.pending.filter((p) => p.league === league),
      final: day.final.filter((p) => p.league === league),
    }))
    .filter((day) => day.pending.length + day.final.length > 0);
}

/**
 * 3D 表示（テーブル・ヘリックス共通）に含める「試合日」の最大数（一覧は新しい日が上のため、直近の日は先頭からこの件数）。
 */
export const RESULT_CSS3D_MAX_DAY_GROUPS = 5;

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
    for (const p of day.pending) out.push(p);
    for (const p of day.final) out.push(p);
  }
  return out;
}

/** リザルト一覧（NBA / WC タブ）：1回あたりの取得件数 */
export const RESULT_TAB_PAGE_SIZE = 10;

/** @deprecated タブ別取得に移行。互換のため残す */
export const RESULT_INITIAL_PAGE_SIZE = RESULT_TAB_PAGE_SIZE;
/** @deprecated タブ別取得に移行 */
export const RESULT_NEXT_PAGE_SIZE = RESULT_TAB_PAGE_SIZE;
