/**
 * Web `lib/announcements/inAppEventAnnouncement.ts` と同等（`@/` 依存を避け Metro で解決可能にする）。
 */
import { Timestamp } from "firebase/firestore";
import { CURRENT_EVENT } from "../../../../../../lib/events/currentEvent";

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

export function shouldInjectSyntheticEventAnnouncementNative(
  firestoreIds: Set<string>
): boolean {
  if (!CURRENT_EVENT.listInAnnouncements) return false;
  if (firestoreIds.has(CURRENT_EVENT.id)) return false;
  return true;
}

export function buildSyntheticEventAnnouncementItemNative(): AnnouncementListShapeNative {
  const e = CURRENT_EVENT;
  return {
    id: e.id,
    title: e.title,
    heroImageURL: e.heroImageURL,
    type: "event",
    postedAt: Timestamp.fromMillis(e.postedAtMs),
    pinned: e.pinned,
  };
}

export function mergeSyntheticEventIntoAnnouncementsNative<
  T extends AnnouncementListShapeNative,
>(items: T[]): T[] {
  const ids = new Set(items.map((i) => i.id));
  if (!shouldInjectSyntheticEventAnnouncementNative(ids)) {
    return items;
  }
  const synthetic = buildSyntheticEventAnnouncementItemNative() as unknown as T;
  const merged = [...items, synthetic];
  merged.sort((a, b) => {
    const pa = a.pinned ? 1 : 0;
    const pb = b.pinned ? 1 : 0;
    if (pa !== pb) return pb - pa;
    return postedAtMillis(b.postedAt) - postedAtMillis(a.postedAt);
  });
  return merged;
}

export function isInAppEventAnnouncementDetailNative(announcementId: string): boolean {
  return (
    !!CURRENT_EVENT.listInAnnouncements && announcementId === CURRENT_EVENT.id
  );
}
