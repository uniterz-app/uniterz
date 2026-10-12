/**
 * TODAY UNITERZ の未読マーク（黄色の点）。
 * 試合が 1 つ確定するたびにランキングが変わるので「試合日 + 確定試合数」を更新番号にし、
 * UNITERZ タブを最後に見たときの番号（端末保存）と違えば未読。
 */

export const TODAY_UNITERZ_SEEN_STORAGE_KEY = "uniterz:today-uniterz-seen-version";

export const TODAY_UNITERZ_DOT_COLOR = "#F5C518";

/** Games 画面にいる間の取り直し間隔（API は CDN 60 秒キャッシュ） */
export const TODAY_UNITERZ_POLL_MS = 3 * 60 * 1000;

export const TODAY_UNITERZ_VERSION_PATH = "/api/uniterz/daily-leaders?division=standard";

/** 確定試合が無い（まだ順位が出ていない）日は null */
export function todayUniterzVersion(
  meta: { dateKey?: unknown; finalCount?: unknown } | null | undefined
): string | null {
  const dateKey = typeof meta?.dateKey === "string" ? meta.dateKey : "";
  const finalCount = Number(meta?.finalCount ?? 0);
  if (!dateKey || !(finalCount > 0)) return null;
  return `${dateKey}:${finalCount}`;
}

export function isTodayUniterzUnread(
  latest: string | null,
  seen: string | null
): boolean {
  return latest != null && latest !== seen;
}
