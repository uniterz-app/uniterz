/** サイドメニューから router.push したあと、戻るボタン表示用 */
export const SIDE_MENU_ORIGIN_KEY = "uniterz_from_side_menu_v1";
/** プロフィール到達時にサイドメニューを開く */
export const OPEN_PROFILE_DRAWER_KEY = "uniterz_open_profile_drawer_v1";

export function markNavigatedFromSideMenu(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(SIDE_MENU_ORIGIN_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function clearSideMenuOrigin(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(SIDE_MENU_ORIGIN_KEY);
  } catch {
    /* ignore */
  }
}

export function hasSideMenuOrigin(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(SIDE_MENU_ORIGIN_KEY) === "1";
  } catch {
    return false;
  }
}

export function requestOpenProfileSideMenu(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(OPEN_PROFILE_DRAWER_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function consumeOpenProfileSideMenu(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (sessionStorage.getItem(OPEN_PROFILE_DRAWER_KEY) === "1") {
      sessionStorage.removeItem(OPEN_PROFILE_DRAWER_KEY);
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}
