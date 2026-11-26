import type {
  DocumentData,
  Firestore,
  Query,
} from "firebase-admin/firestore";
import { Timestamp } from "firebase-admin/firestore";
import type { Language } from "@/lib/i18n/language";
import { resolvePostListLeague } from "@/lib/leagues";
import { resolveWcStageFromGame } from "@/lib/games/resolveWcStageFromGame";
import { nbaSlateDayRange } from "@/lib/games/latestNbaSlate";
import type { ScheduleMyPostEntry, ScheduleMyPostsMap } from "@/lib/games/scheduleMyPostsCache";
import type { SettledPostRow } from "@/lib/profile/profileStreakPostsCompute";
import {
  postMatchesProfileStreakScope,
  resolveProfileStreakScopeKey,
  type ProfileStatsStreakContext,
} from "@/lib/profile/profileStreakScope";
import {
  formatResultDateLabel,
  mapDocToPostWithMillis,
  RESULT_INITIAL_PAGE_SIZE,
  RESULT_NEXT_PAGE_SIZE,
  RESULT_POSTS_MAX_CACHED,
  type PostWithMillis,
} from "@/lib/result/result-page-data";
import { sortResultPostsForDisplay } from "@/lib/result/resultPostDaySort";

/** リザルトカードに必要な項目。likes サブコレや作者アバターは一覧に出さない */
export const POST_RESULT_SELECT_FIELDS = [
  "schemaVersion",
  "authorUid",
  "gameId",
  "league",
  "seasonPhase",
  "playoffRound",
  "seasonRound",
  "roundLabel",
  "wcStage",
  "knockout",
  "isPickup",
  "pickupWeekKey",
  "home",
  "away",
  "status",
  "startAt",
  "startAtJst",
  "startAtMillis",
  "startAtIso",
  "prediction",
  "comment",
  "result",
  "stats",
  "marketMeta",
  "matchGoalScorers",
  "pkScore",
  "createdAt",
  "updatedAt",
  "settledAt",
] as const;

const POST_MINE_SELECT_FIELDS = [
  "gameId",
  "prediction",
  "comment",
  "updatedAt",
  "stats",
  "schemaVersion",
] as const;

const POST_WIN_SELECT_FIELDS = ["stats", "settledAt", "schemaVersion"] as const;

const IN_LIMIT = 30;
const MINE_MAX_IDS = 60;
const SLATE_FETCH_LIMIT = 48;
const RESULT_OPEN_MAX_PAGES = 8;

export type ResultPostsCursor = {
  createdAtMs: number;
  id: string;
};

function toMillis(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "object") {
    const t = v as {
      toMillis?: () => number;
      seconds?: number;
      _seconds?: number;
    };
    if (typeof t.toMillis === "function") return t.toMillis();
    if (typeof t.seconds === "number") return t.seconds * 1000;
    if (typeof t._seconds === "number") return t._seconds * 1000;
  }
  return null;
}

function jsonSafe(value: unknown): unknown {
  if (value == null) return value;
  if (typeof value !== "object") return value;
  const ms = toMillis(value);
  if (ms != null && (typeof (value as { toMillis?: unknown }).toMillis === "function" ||
    typeof (value as { seconds?: unknown }).seconds === "number" ||
    typeof (value as { _seconds?: unknown })._seconds === "number")) {
    return ms;
  }
  if (Array.isArray(value)) return value.map(jsonSafe);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[k] = jsonSafe(v);
  }
  return out;
}

export function serializePostForClient(
  id: string,
  data: DocumentData
): PostWithMillis {
  const createdAtMillis = toMillis(data.createdAt) ?? toMillis(data.createdAtMillis);
  const settledAtMillis = toMillis(data.settledAt) ?? toMillis(data.settledAtMillis);
  const startAtMillis =
    toMillis(data.startAtMillis) ??
    toMillis(data.startAtJst) ??
    toMillis(data.startAt);
  const rest = jsonSafe(data) as Record<string, unknown>;
  delete rest.createdAt;
  delete rest.settledAt;
  delete rest.startAt;
  delete rest.startAtJst;
  return mapDocToPostWithMillis(id, {
    ...rest,
    createdAtMillis,
    settledAtMillis,
    startAtMillis,
  });
}

function cursorFromPosts(posts: PostWithMillis[]): ResultPostsCursor | null {
  const last = posts[posts.length - 1];
  const ms = last?.createdAtMillis;
  if (!last || typeof ms !== "number" || !Number.isFinite(ms)) return null;
  return { createdAtMs: ms, id: last.id };
}

function resultDayLabel(post: PostWithMillis, language: Language): string {
  const start = post.startAtMillis;
  const created = post.createdAtMillis;
  const ms =
    typeof start === "number" && Number.isFinite(start) && start > 0
      ? start
      : typeof created === "number" && Number.isFinite(created)
        ? created
        : 0;
  return formatResultDateLabel(ms, language);
}

export async function loadMyResultPosts(
  db: Firestore,
  input: {
    uid: string;
    league: string;
    pageLimit: number;
    beforeMs?: number;
    fillDays?: number;
    language: Language;
  }
): Promise<{
  posts: PostWithMillis[];
  hasMore: boolean;
  nextCursor: ResultPostsCursor | null;
}> {
  const fillDays = input.fillDays != null && input.fillDays > 0 ? input.fillDays : 0;
  const labels = new Set<string>();
  const merged: PostWithMillis[] = [];
  const seen = new Set<string>();
  let beforeMs = input.beforeMs;
  let hasMore = false;
  const maxPages = fillDays > 0 ? RESULT_OPEN_MAX_PAGES : 1;

  for (let page = 0; page < maxPages && merged.length < RESULT_POSTS_MAX_CACHED; page += 1) {
    const pageLimit =
      fillDays > 0
        ? page === 0
          ? RESULT_INITIAL_PAGE_SIZE
          : RESULT_NEXT_PAGE_SIZE
        : input.pageLimit;
    let q: Query = db
      .collection("posts")
      .where("authorUid", "==", input.uid)
      .where("league", "==", input.league);
    if (beforeMs != null) {
      q = q.where("createdAt", "<", Timestamp.fromMillis(beforeMs));
    }
    const snap = await q
      .orderBy("createdAt", "desc")
      .select(...POST_RESULT_SELECT_FIELDS)
      .limit(pageLimit)
      .get();
    let crossedDay = false;
    for (const doc of snap.docs) {
      const post = serializePostForClient(doc.id, doc.data());
      if (fillDays > 0) {
        const label = resultDayLabel(post, input.language);
        if (!labels.has(label) && labels.size >= fillDays) {
          crossedDay = true;
          break;
        }
        if (!seen.has(post.id)) {
          seen.add(post.id);
          labels.add(label);
          merged.push(post);
        }
      } else if (!seen.has(post.id)) {
        seen.add(post.id);
        merged.push(post);
      }
    }
    const fullPage = snap.docs.length === pageLimit;
    hasMore = (crossedDay || fullPage) && merged.length < RESULT_POSTS_MAX_CACHED;
    const lastMs = merged[merged.length - 1]?.createdAtMillis;
    if (typeof lastMs === "number" && Number.isFinite(lastMs)) beforeMs = lastMs;
    if (fillDays <= 0) break;
    if (crossedDay || !fullPage || snap.docs.length === 0) break;
    if (labels.size < fillDays) continue;
  }

  const posts =
    merged.length > RESULT_POSTS_MAX_CACHED
      ? merged.slice(0, RESULT_POSTS_MAX_CACHED)
      : merged;
  if (posts.length < merged.length) hasMore = false;
  return { posts, hasMore, nextCursor: cursorFromPosts(posts) };
}

function mineEntryFromDoc(
  id: string,
  data: DocumentData
): ScheduleMyPostEntry | null {
  const gameId = String(data.gameId ?? "");
  if (!gameId) return null;
  const pred = data.prediction as
    | { winner?: unknown; score?: { home?: unknown; away?: unknown }; goalScorer?: unknown }
    | undefined;
  const winnerRaw = pred?.winner;
  const homeRaw = pred?.score?.home;
  const awayRaw = pred?.score?.away;
  return {
    postId: id,
    winner:
      winnerRaw === "home" || winnerRaw === "away" || winnerRaw === "draw"
        ? winnerRaw
        : undefined,
    score:
      typeof homeRaw === "number" && typeof awayRaw === "number"
        ? { home: homeRaw, away: awayRaw }
        : undefined,
    comment: typeof data.comment === "string" ? data.comment : "",
    updatedAt: toMillis(data.updatedAt),
    goalScorer: pred?.goalScorer ?? null,
    postStats:
      data.stats && typeof data.stats === "object"
        ? (jsonSafe(data.stats) as Record<string, unknown>)
        : null,
  };
}

export async function loadMyPostsForGameIds(
  db: Firestore,
  uid: string,
  gameIds: string[]
): Promise<ScheduleMyPostsMap> {
  const ids = [...new Set(gameIds.map((id) => id.trim()).filter(Boolean))].slice(
    0,
    MINE_MAX_IDS
  );
  const found: ScheduleMyPostsMap = {};
  if (ids.length === 0) return found;
  for (let i = 0; i < ids.length; i += IN_LIMIT) {
    const chunk = ids.slice(i, i + IN_LIMIT);
    const snap = await db
      .collection("posts")
      .where("authorUid", "==", uid)
      .where("gameId", "in", chunk)
      .where("schemaVersion", "==", 2)
      .select(...POST_MINE_SELECT_FIELDS)
      .get();
    for (const doc of snap.docs) {
      const entry = mineEntryFromDoc(doc.id, doc.data());
      const gameId = String(doc.get("gameId") ?? "");
      if (entry && gameId) found[gameId] = entry;
    }
  }
  return found;
}

export async function loadLatestSettledAtMs(
  db: Firestore,
  uid: string
): Promise<number | null> {
  const snap = await db
    .collection("posts")
    .where("authorUid", "==", uid)
    .where("schemaVersion", "==", 2)
    .orderBy("settledAt", "desc")
    .select("settledAt")
    .limit(1)
    .get();
  if (snap.empty) return null;
  return toMillis(snap.docs[0]?.get("settledAt"));
}

export async function loadRecentWinFlags(
  db: Firestore,
  uid: string,
  sinceMs: number,
  limitN: number
): Promise<boolean[]> {
  const snap = await db
    .collection("posts")
    .where("authorUid", "==", uid)
    .where("schemaVersion", "==", 2)
    .where("settledAt", ">=", Timestamp.fromMillis(sinceMs))
    .orderBy("settledAt", "desc")
    .select(...POST_WIN_SELECT_FIELDS)
    .limit(limitN)
    .get();
  const out: boolean[] = [];
  for (const d of snap.docs) {
    const isWin = (d.get("stats") as { isWin?: unknown } | undefined)?.isWin;
    if (typeof isWin === "boolean") out.push(isWin);
  }
  return out;
}

function isSettledPostInSlate(
  post: { status?: unknown; settledAtMillis?: number | null; startAtMillis?: number | null },
  range: { start: Date; end: Date }
): boolean {
  if (post.status !== "final" || post.settledAtMillis == null) return false;
  const startMs = post.startAtMillis;
  if (typeof startMs !== "number" || !Number.isFinite(startMs)) return false;
  return startMs >= range.start.getTime() && startMs < range.end.getTime();
}

function filterSettledRowsForScope(
  rows: readonly SettledPostRow[],
  ctx: ProfileStatsStreakContext
): SettledPostRow[] {
  const scope = resolveProfileStreakScopeKey(ctx);
  return rows.filter((row) => postMatchesProfileStreakScope(row, scope));
}

function settledRowFromPost(post: PostWithMillis): SettledPostRow | null {
  const raw = post as PostWithMillis & Record<string, unknown>;
  const settledAtMs = post.settledAtMillis;
  const isWin = post.stats?.isWin;
  if (typeof settledAtMs !== "number" || !Number.isFinite(settledAtMs)) return null;
  if (typeof isWin !== "boolean") return null;
  return {
    postId: post.id,
    gameId: typeof post.gameId === "string" ? post.gameId : null,
    settledAtMs,
    isWin,
    league: post.league,
    seasonPhase: raw.seasonPhase,
    wcStage: raw.wcStage,
  };
}

function needsGameLookup(row: SettledPostRow): boolean {
  if (!row.gameId) return false;
  const league = resolvePostListLeague({
    league: row.league,
    gameId: row.gameId,
  });
  if (league === "wc") return row.wcStage == null || row.wcStage === "";
  if (league === "nba") return row.seasonPhase == null || row.seasonPhase === "";
  return false;
}

async function enrichSettledRowsAdmin(
  db: Firestore,
  rows: SettledPostRow[]
): Promise<SettledPostRow[]> {
  const gameIds = [
    ...new Set(
      rows
        .filter(needsGameLookup)
        .map((r) => r.gameId)
        .filter((id): id is string => typeof id === "string" && id.length > 0)
    ),
  ];
  if (gameIds.length === 0) return rows;
  const snaps = await db.getAll(
    ...gameIds.map((id) => db.collection("games").doc(id)),
    { fieldMask: ["seasonPhase", "wcStage", "league", "knockout", "roundLabel"] }
  );
  const meta = new Map<
    string,
    { seasonPhase: unknown; wcStage: unknown; league: unknown }
  >();
  for (const snap of snaps) {
    if (!snap.exists) continue;
    const data = (snap.data() ?? {}) as Record<string, unknown>;
    const resolvedWcStage = resolveWcStageFromGame({
      knockout: data.knockout as boolean | null | undefined,
      roundLabel: data.roundLabel as string | null | undefined,
      wcStage: data.wcStage as string | null | undefined,
    });
    meta.set(snap.id, {
      seasonPhase: data.seasonPhase ?? null,
      wcStage: resolvedWcStage ?? data.wcStage ?? null,
      league: data.league ?? null,
    });
  }
  return rows.map((row) => {
    if (!row.gameId) return row;
    const g = meta.get(row.gameId);
    if (!g) return row;
    return {
      ...row,
      league: resolvePostListLeague({
        league: row.league ?? g.league,
        gameId: row.gameId,
      }),
      seasonPhase: row.seasonPhase ?? g.seasonPhase,
      wcStage: row.wcStage ?? g.wcStage,
    };
  });
}

export async function loadSettledTodayPosts(
  db: Firestore,
  uid: string,
  slateDateKey: string,
  ctx: ProfileStatsStreakContext
): Promise<PostWithMillis[]> {
  const range = nbaSlateDayRange(slateDateKey);
  if (!range) return [];
  const snap = await db
    .collection("posts")
    .where("authorUid", "==", uid)
    .where("schemaVersion", "==", 2)
    .where("settledAt", ">=", Timestamp.fromDate(range.start))
    .orderBy("settledAt", "desc")
    .select(...POST_RESULT_SELECT_FIELDS)
    .limit(SLATE_FETCH_LIMIT)
    .get();
  const posts = snap.docs
    .map((d) => serializePostForClient(d.id, d.data()))
    .filter((p) => isSettledPostInSlate(p, range));
  const rowCandidates = posts
    .map(settledRowFromPost)
    .filter((row): row is SettledPostRow => row != null);
  const enrichedRows = await enrichSettledRowsAdmin(db, rowCandidates);
  const visibleIds = new Set(
    filterSettledRowsForScope(enrichedRows, ctx).map((row) => row.postId)
  );
  return sortResultPostsForDisplay(posts.filter((post) => visibleIds.has(post.id)));
}

export { MINE_MAX_IDS };
