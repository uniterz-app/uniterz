/**
 * Web `lib/announcements/inAppEventAnnouncement.ts` と同等（`@/` 依存を避け Metro で解決可能にする）。
 */
import { Timestamp } from "firebase/firestore";
import {
  SYNTHETIC_EVENT_NOTICES,
  getSyntheticEventById,
} from "../../../../../../lib/events/syntheticEventNotices";

export type AnnouncementListShapeNative = {
  id: string;
  title: string;
  heroImageURL?: string;
  type?: string;
  postedAt?: Timestamp | Date | null;
  pinned?: boolean;
};

function postedAtMillis(v: Timestamp | Date | null | undefined): number {
  if (!v) return 0;
  if (v instanceof Timestamp) return v.toMillis();
  return v.getTime();
}

function buildListItemNative(e: (typeof SYNTHETIC_EVENT_NOTICES)[number]): AnnouncementListShapeNative {
  return {
    id: e.id,
    title: e.title,
    heroImageURL: e.heroImageURL,
    type: "event",
    postedAt: Timestamp.fromMillis(e.postedAtMs),
    pinned: e.pinned,
  };
}

export function shouldInjectSyntheticEventAnnouncementNative(
  firestoreIds: Set<string>
): boolean {
  return SYNTHETIC_EVENT_NOTICES.some(
    (e) => e.listInAnnouncements && !firestoreIds.has(e.id)
  );
}

export function buildSyntheticEventAnnouncementItemNative(): AnnouncementListShapeNative {
  return buildListItemNative(SYNTHETIC_EVENT_NOTICES[0]!);
}

export function mergeSyntheticEventIntoAnnouncementsNative<
  T extends AnnouncementListShapeNative,
>(items: T[]): T[] {
  const ids = new Set(items.map((i) => i.id));
  const toAdd: AnnouncementListShapeNative[] = [];
  for (const e of SYNTHETIC_EVENT_NOTICES) {
    if (!e.listInAnnouncements) continue;
    if (ids.has(e.id)) continue;
    toAdd.push(buildListItemNative(e));
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

export function isInAppEventAnnouncementDetailNative(announcementId: string): boolean {
  return getSyntheticEventById(announcementId) !== undefined;
}

export { getSyntheticEventById };
