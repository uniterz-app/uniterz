/** 未ログイン時のお知らせ既読 ID（端末ローカル） */
export const ANNOUNCEMENT_READ_IDS_STORAGE_KEY =
  "uniterz_announcement_read_ids_v1";

export const ANNOUNCEMENT_READS_CHANGED_EVENT = "uniterz-announcement-reads-changed";

function parseIds(raw: string | null): Set<string> {
  if (!raw) return new Set();
  try {
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.filter((x): x is string => typeof x === "string"));
  } catch {
    return new Set();
  }
}

export function getLocalAnnouncementReadIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  return parseIds(localStorage.getItem(ANNOUNCEMENT_READ_IDS_STORAGE_KEY));
}

/** 既読を保存し、購読側へ通知 */
export function addLocalAnnouncementReadId(announcementId: string): void {
  if (!announcementId || typeof window === "undefined") return;
  const s = getLocalAnnouncementReadIds();
  if (s.has(announcementId)) {
    window.dispatchEvent(new CustomEvent(ANNOUNCEMENT_READS_CHANGED_EVENT));
    return;
  }
  s.add(announcementId);
  localStorage.setItem(
    ANNOUNCEMENT_READ_IDS_STORAGE_KEY,
    JSON.stringify([...s])
  );
  window.dispatchEvent(new CustomEvent(ANNOUNCEMENT_READS_CHANGED_EVENT));
}
