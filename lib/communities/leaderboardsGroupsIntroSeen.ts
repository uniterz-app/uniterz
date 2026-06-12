/** localStorage: リーダーボードのグループ機能告知を一度見たらバッジ・モーダルを出さない */
const STORAGE_KEY = "uniterz:leaderboardsGroupsIntroSeen:v1";

export const LEADERBOARDS_GROUPS_INTRO_SEEN_CHANGED_EVENT =
  "uniterz-leaderboards-groups-intro-seen-changed";

export function isLeaderboardsRoute(
  pathname: string,
  prefix: "/web" | "/mobile"
): boolean {
  const base = `${prefix}/leaderboards`;
  return pathname === base || pathname.startsWith(`${base}/`);
}

export function shouldShowLeaderboardsGroupsIntroBadge(
  pathname: string,
  prefix: "/web" | "/mobile"
): boolean {
  if (isLeaderboardsRoute(pathname, prefix)) return false;
  return !readLeaderboardsGroupsIntroSeen();
}

export function readLeaderboardsGroupsIntroSeen(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function markLeaderboardsGroupsIntroSeen(): void {
  if (typeof window === "undefined") return;
  try {
    if (window.localStorage.getItem(STORAGE_KEY) === "1") {
      notifyLeaderboardsGroupsIntroSeenChanged();
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, "1");
    notifyLeaderboardsGroupsIntroSeenChanged();
  } catch {
    // 容量超過などは握りつぶす
  }
}

function notifyLeaderboardsGroupsIntroSeenChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(LEADERBOARDS_GROUPS_INTRO_SEEN_CHANGED_EVENT)
  );
  // NavBar の effect より先に mark された場合の取りこぼし防止
  queueMicrotask(() => {
    window.dispatchEvent(
      new CustomEvent(LEADERBOARDS_GROUPS_INTRO_SEEN_CHANGED_EVENT)
    );
  });
}
