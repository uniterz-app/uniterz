import {
  RESULT_LIST_LEAGUE_TABS,
  type ResultListLeagueTab,
} from "@/lib/result/result-page-data";

/** localStorage キー：リザルト一覧で直近に選んだリーグタブ */
const STORAGE_KEY = "uniterz:resultLastLeagueTab:v1";

/**
 * 直近のリーグタブを返す。
 * これを初期タブに使うことで、フラグ取得（users/{uid}）を待たずに
 * 投稿取得を開始でき、初回表示のウォーターフォールを短縮できる。
 */
export function readLastResultLeagueTab(): ResultListLeagueTab | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return (RESULT_LIST_LEAGUE_TABS as readonly string[]).includes(raw)
      ? (raw as ResultListLeagueTab)
      : null;
  } catch {
    return null;
  }
}

export function writeLastResultLeagueTab(tab: ResultListLeagueTab): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, tab);
  } catch {
    // 容量超過などは握りつぶす
  }
}
