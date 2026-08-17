/** Pro レポート配信オーバーレイの既読（端末ローカル）。 */

export const REPORT_OVERLAY_SEEN_LS_KEY = "uniterz:reportOverlaySeen:v1";

export function reportOverlaySeenStorageKey(uid: string): string {
  return `${REPORT_OVERLAY_SEEN_LS_KEY}:${uid}`;
}

export function parseReportOverlaySeenIds(raw: string | null): Set<string> {
  if (!raw) return new Set();
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((x): x is string => typeof x === "string"));
  } catch {
    return new Set();
  }
}

export function serializeReportOverlaySeenIds(ids: Set<string>): string {
  return JSON.stringify([...ids]);
}

export function markReportOverlaySeenInSet(
  ids: Set<string>,
  reportId: string
): Set<string> {
  if (!reportId || ids.has(reportId)) return ids;
  const next = new Set(ids);
  next.add(reportId);
  return next;
}
