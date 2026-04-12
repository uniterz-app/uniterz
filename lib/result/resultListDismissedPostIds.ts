/** localStorage キー：リザルト一覧からキックオフ前に除外した投稿 ID */
const STORAGE_KEY = "uniterz:resultListDismissedPostIds:v1";

export function readDismissedResultPostIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(
      parsed.filter((x): x is string => typeof x === "string" && x.length > 0)
    );
  } catch {
    return new Set();
  }
}

export function writeDismissedResultPostIds(ids: Set<string>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // 容量超過などは握りつぶす
  }
}
