/**
 * Web `lib/announcements/inAppEventAnnouncement.ts` と同等（`@/` 依存を避け Metro で解決可能にする）。
 */
import { Timestamp } from "firebase/firestore";
import {
  liveSyntheticEventNotices,
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

function buildListItemNative(
  e: ReturnType<typeof liveSyntheticEventNotices>[number]
): AnnouncementListShapeNative {
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
  return liveSyntheticEventNotices().some((e) => !firestoreIds.has(e.id));
}

export function buildSyntheticEventAnnouncementItemNative(): AnnouncementListShapeNative {
  const e = liveSyntheticEventNotices()[0];
  if (!e) {
    return {
      id: "",
      title: "",
      type: "event",
      postedAt: null,
      pinned: false,
    };
  }
  return buildListItemNative(e);
}

export function mergeSyntheticEventIntoAnnouncementsNative<
  T extends AnnouncementListShapeNative,
>(items: T[]): T[] {
  const ids = new Set(items.map((i) => i.id));
  const toAdd: AnnouncementListShapeNative[] = [];
  for (const e of liveSyntheticEventNotices()) {
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
