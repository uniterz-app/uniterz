import { Timestamp } from "firebase/firestore";
import {
  SYNTHETIC_EVENT_NOTICES,
  getSyntheticEventById,
} from "@/lib/events/syntheticEventNotices";
import type { EventNoticeContent } from "@/lib/events/eventNoticeTypes";

export type AnnouncementListShape = {
  id: string;
  title: string;
  heroImageURL?: string;
  type?: string;
  postedAt?: Timestamp | Date | null;
  pinned?: boolean;
};

function postedAtMillis(
  v: Timestamp | Date | null | undefined
): number {
  if (!v) return 0;
  if (v instanceof Timestamp) return v.toMillis();
  return v.getTime();
}

function buildListItem(e: EventNoticeContent): AnnouncementListShape {
  return {
    id: e.id,
    title: e.title,
    heroImageURL: e.heroImageURL,
    type: "event",
    postedAt: Timestamp.fromMillis(e.postedAtMs),
    pinned: e.pinned,
  };
}

/** @deprecated 複数合成に対応した merge を使う */
export function shouldInjectSyntheticEventAnnouncement(
  firestoreIds: Set<string>
): boolean {
  return SYNTHETIC_EVENT_NOTICES.some(
    (e) => e.listInAnnouncements && !firestoreIds.has(e.id)
  );
}

/** 未読カウント用: 一覧に出る合成 ID を Firestore 可視 ID に足す */
export function mergeSyntheticIdsIntoVisibleSet(
  firestoreTopIds: Set<string>
): Set<string> {
  const out = new Set(firestoreTopIds);
  for (const e of SYNTHETIC_EVENT_NOTICES) {
    if (!e.listInAnnouncements) continue;
    if (firestoreTopIds.has(e.id)) continue;
    out.add(e.id);
  }
  return out;
}

/** @deprecated 複数合成に対応した merge を使う */
export function buildSyntheticEventAnnouncementItem(): AnnouncementListShape {
  const e = SYNTHETIC_EVENT_NOTICES[0]!;
  return buildListItem(e);
}

/** 合成アイテムをマージし pinned / postedAt でソート（クエリと同じ順） */
export function mergeSyntheticEventIntoAnnouncements<
  T extends AnnouncementListShape,
>(items: T[]): T[] {
  const ids = new Set(items.map((i) => i.id));
  const toAdd: AnnouncementListShape[] = [];
  for (const e of SYNTHETIC_EVENT_NOTICES) {
    if (!e.listInAnnouncements) continue;
    if (ids.has(e.id)) continue;
    toAdd.push(buildListItem(e));
    ids.add(e.id);
  }
  if (toAdd.length === 0) return items;
  const merged = [...items, ...(toAdd as unknown as T[])];
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
  return getSyntheticEventById(announcementId) !== undefined;
}

export { getSyntheticEventById };
