/** localStorage: Games ドロワーで W杯タブを一度開いたら告知バッジを出さない */
const STORAGE_KEY = "uniterz:gamesWcTabAnnouncementSeen:v1";

export function readWcGamesTabAnnouncementSeen(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function markWcGamesTabAnnouncementSeen(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // 容量超過などは握りつぶす
  }
}
