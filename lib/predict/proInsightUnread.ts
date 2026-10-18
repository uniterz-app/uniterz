/**
 * 予想画面 INSIGHT タブの未読マーク（黄色の点）。
 * Pro Insight は前日の初版・tip 1h 前の完全版などで作り直されるので、生成時刻（API の updatedAt）を更新番号にし、
 * その試合の INSIGHT を最後に開いたときの番号（端末保存・試合ごと）と違えば未読。
 */

export const PRO_INSIGHT_SEEN_STORAGE_KEY = "uniterz:pro-insight-seen-versions";

/** 端末に残す試合数（古い試合から捨てる） */
const MAX_SEEN_GAMES = 80;

export type ProInsightSeenMap = Record<string, string>;

export function parseProInsightSeenMap(raw: string | null | undefined): ProInsightSeenMap {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const out: ProInsightSeenMap = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof v === "string") out[k] = v;
    }
    return out;
  } catch {
    return {};
  }
}

/** 挿入順を保ったまま最新 MAX_SEEN_GAMES 件だけ残す */
export function withProInsightSeen(
  map: ProInsightSeenMap,
  gameId: string,
  version: string
): ProInsightSeenMap {
  const next: ProInsightSeenMap = {};
  const keys = Object.keys(map).filter((k) => k !== gameId);
  for (const k of keys.slice(-(MAX_SEEN_GAMES - 1))) next[k] = map[k];
  next[gameId] = version;
  return next;
}

export function isProInsightUnread(opts: {
  version: string | null;
  seen: string | null | undefined;
}): boolean {
  return opts.version != null && opts.version !== (opts.seen ?? null);
}
