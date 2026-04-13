import { Timestamp } from "firebase/firestore";
import { CURRENT_EVENT } from "@/lib/events/currentEvent";
import type { EventNoticeContent } from "@/lib/events/eventNoticeTypes";

export type AnnouncementListShape = {
  id: string;
  title: string;
  heroImageURL?: string;
  type?: string;
  postedAt?: Timestamp | Date | null;
  pinned?: boolean;
};

/** Firestore に同名ドキュメントが無く、合成が有効なときだけ true */
export function shouldInjectSyntheticEventAnnouncement(
  firestoreIds: Set<string>
): boolean {
  if (!CURRENT_EVENT.listInAnnouncements) return false;
  if (firestoreIds.has(CURRENT_EVENT.id)) return false;
  return true;
}

/** 一覧用の仮想アイテム（Firestore 行と同型） */
export function buildSyntheticEventAnnouncementItem(): AnnouncementListShape {
  const e: EventNoticeContent = CURRENT_EVENT;
  return {
    id: e.id,
    title: e.title,
    heroImageURL: e.heroImageURL,
    type: "event",
    postedAt: Timestamp.fromMillis(e.postedAtMs),
    pinned: e.pinned,
  };
}

function postedAtMillis(
  v: Timestamp | Date | null | undefined
): number {
  if (!v) return 0;
  if (v instanceof Timestamp) return v.toMillis();
  return v.getTime();
}

/** 合成アイテムをマージし pinned / postedAt でソート（クエリと同じ順） */
export function mergeSyntheticEventIntoAnnouncements<
  T extends AnnouncementListShape,
>(items: T[]): T[] {
  const ids = new Set(items.map((i) => i.id));
  if (!shouldInjectSyntheticEventAnnouncement(ids)) {
    return items;
  }
  const synthetic = buildSyntheticEventAnnouncementItem() as unknown as T;
  const merged = [...items, synthetic];
  merged.sort((a, b) => {
    const pa = a.pinned ? 1 : 0;
    const pb = b.pinned ? 1 : 0;
    if (pa !== pb) return pb - pa;
    return postedAtMillis(b.postedAt) - postedAtMillis(a.postedAt);
  });
  return merged;
}

/** 詳細ページで Firestore が無いときにイベント本文を出すか */
export function isInAppEventAnnouncementDetail(announcementId: string): boolean {
  return (
    CURRENT_EVENT.listInAnnouncements &&
    announcementId === CURRENT_EVENT.id
  );
}
