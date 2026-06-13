/** ナビタブ通知：最後にランキング／リザルトを見た時点（ユーザー別 localStorage） */
const RANKING_SEEN_KEY = "uniterz:navSeen:rankingUpdatedAtMs:v1";
const RESULT_SEEN_KEY = "uniterz:navSeen:resultSettledAtMs:v1";

export const NAV_TAB_NOTIFICATION_SEEN_CHANGED_EVENT =
  "uniterz-nav-tab-notification-seen-changed";

function rankingStorageKey(uid: string): string {
  return `${RANKING_SEEN_KEY}:${uid}`;
}

function resultStorageKey(uid: string): string {
  return `${RESULT_SEEN_KEY}:${uid}`;
}

export function isRankingsRoute(
  pathname: string,
  prefix: "/web" | "/mobile"
): boolean {
  const base = `${prefix}/rankings`;
  return pathname === base || pathname.startsWith(`${base}/`);
}

export function isResultRoute(
  pathname: string,
  prefix: "/web" | "/mobile"
): boolean {
  const base = `${prefix}/result`;
  return pathname === base || pathname.startsWith(`${base}/`);
}

export function readNavRankingSeenMs(uid: string): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(rankingStorageKey(uid));
    if (raw == null) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export function readNavResultSeenMs(uid: string): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(resultStorageKey(uid));
    if (raw == null) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export function markNavRankingSeen(uid: string, updatedAtMs: number): void {
  if (typeof window === "undefined") return;
  if (!Number.isFinite(updatedAtMs)) return;
  try {
    const key = rankingStorageKey(uid);
    const prev = window.localStorage.getItem(key);
    const next = String(Math.floor(updatedAtMs));
    if (prev === next) {
      notifyNavTabNotificationSeenChanged();
      return;
    }
    window.localStorage.setItem(key, next);
    notifyNavTabNotificationSeenChanged();
  } catch {
    // 容量超過などは握りつぶす
  }
}

export function markNavResultSeen(uid: string, settledAtMs: number): void {
  if (typeof window === "undefined") return;
  if (!Number.isFinite(settledAtMs)) return;
  try {
    const key = resultStorageKey(uid);
    const prev = window.localStorage.getItem(key);
    const next = String(Math.floor(settledAtMs));
    if (prev === next) {
      notifyNavTabNotificationSeenChanged();
      return;
    }
    window.localStorage.setItem(key, next);
    notifyNavTabNotificationSeenChanged();
  } catch {
    // 容量超過などは握りつぶす
  }
}

function notifyNavTabNotificationSeenChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(NAV_TAB_NOTIFICATION_SEEN_CHANGED_EVENT));
  queueMicrotask(() => {
    window.dispatchEvent(new CustomEvent(NAV_TAB_NOTIFICATION_SEEN_CHANGED_EVENT));
  });
}
