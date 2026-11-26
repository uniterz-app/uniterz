import { auth } from "./firebase";
import { getUniterzApiBaseUrl } from "../features/games/submitPredictionApi";
import type { ScheduleMyPostsMap } from "../../../../lib/games/scheduleMyPostsCache";
import type { PostWithMillis } from "../../../../lib/result/result-page-data";
import type { ResultPostsListCursor } from "../../../../lib/result/resultPostsListCache";
import type { Language } from "../../../../lib/i18n/language";

async function authHeader(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) throw new Error("unauthorized");
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

function requireBase(): string {
  const base = getUniterzApiBaseUrl();
  if (!base) {
    throw new Error("EXPO_PUBLIC_UNITERZ_API_BASE_URL が未設定です。");
  }
  return base;
}

async function getJson(path: string): Promise<Record<string, unknown>> {
  const res = await fetch(`${requireBase()}${path}`, {
    headers: await authHeader(),
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const err = typeof json.error === "string" ? json.error : `HTTP ${res.status}`;
    throw new Error(err);
  }
  return json;
}

export async function fetchMyResultPostsNative(input: {
  league: string;
  lang: Language;
  limit: number;
  beforeMs?: number;
  fillDays?: number;
}): Promise<{
  posts: PostWithMillis[];
  hasMore: boolean;
  nextCursor: ResultPostsListCursor | null;
}> {
  const q = new URLSearchParams({
    view: "result",
    league: input.league,
    lang: input.lang,
    limit: String(input.limit),
  });
  if (input.beforeMs != null) q.set("beforeMs", String(input.beforeMs));
  if (input.fillDays != null && input.fillDays > 0) {
    q.set("fillDays", String(input.fillDays));
  }
  const json = await getJson(`/api/me/posts?${q.toString()}`);
  const posts = Array.isArray(json.posts) ? (json.posts as PostWithMillis[]) : [];
  const next = json.nextCursor as ResultPostsListCursor | null | undefined;
  return {
    posts,
    hasMore: json.hasMore === true,
    nextCursor:
      next && typeof next.createdAtMs === "number" && typeof next.id === "string"
        ? { createdAtMs: next.createdAtMs, id: next.id }
        : null,
  };
}

export async function fetchMyPostsForGameIdsNative(
  gameIds: string[]
): Promise<ScheduleMyPostsMap> {
  if (gameIds.length === 0) return {};
  const json = await getJson(
    `/api/me/posts?view=mine&gameIds=${encodeURIComponent(gameIds.join(","))}`
  );
  const posts = json.posts;
  if (!posts || typeof posts !== "object" || Array.isArray(posts)) return {};
  return posts as ScheduleMyPostsMap;
}

export async function fetchLatestSettledAtMsNative(): Promise<number | null> {
  const json = await getJson("/api/me/posts?view=latestSettled");
  return typeof json.settledAtMs === "number" && Number.isFinite(json.settledAtMs)
    ? json.settledAtMs
    : null;
}

export async function fetchRecentWinFlagsNative(
  sinceMs: number,
  limitN: number
): Promise<boolean[]> {
  const json = await getJson(
    `/api/me/posts?view=recentWins&sinceMs=${sinceMs}&limit=${limitN}`
  );
  return Array.isArray(json.wins)
    ? json.wins.filter((v): v is boolean => typeof v === "boolean")
    : [];
}

export async function fetchSettledTodayPostsNative(input: {
  slate: string;
  wcStage?: string;
}): Promise<PostWithMillis[]> {
  const q = new URLSearchParams({
    view: "settledToday",
    slate: input.slate,
  });
  if (input.wcStage) q.set("wcStage", input.wcStage);
  const json = await getJson(`/api/me/posts?${q.toString()}`);
  return Array.isArray(json.posts) ? (json.posts as PostWithMillis[]) : [];
}

export async function fetchMyPostExistsForGameNative(
  gameId: string
): Promise<boolean> {
  const map = await fetchMyPostsForGameIdsNative([gameId]);
  return Boolean(map[gameId]?.postId);
}
