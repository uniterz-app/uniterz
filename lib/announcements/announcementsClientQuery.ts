import {
  collection,
  limit,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

/** Firestore は複合インデックスなしで取れる上限（その後クライアントで pinned / postedAt ソート） */
export const VISIBLE_ANNOUNCEMENTS_FETCH_LIMIT = 100;

export type AnnouncementSortRow = {
  id: string;
  pinned?: boolean;
  postedAt?: Timestamp | Date | null;
};

function postedAtMillis(
  v: Timestamp | Date | null | undefined
): number {
  if (!v) return 0;
  if (v instanceof Timestamp) return v.toMillis();
  return v.getTime();
}

/** 一覧・未読フックで共通（pinned 降順 → postedAt 降順） */
export function sortAnnouncementsByPinnedThenPosted<
  T extends AnnouncementSortRow,
>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const pa = a.pinned ? 1 : 0;
    const pb = b.pinned ? 1 : 0;
    if (pa !== pb) return pb - pa;
    return postedAtMillis(b.postedAt) - postedAtMillis(a.postedAt);
  });
}

/**
 * visible==true のみ（orderBy なし）→ 単一フィールドでインデックス不要。
 * 件数が FETCH_LIMIT を超える運用は想定しない。
 */
export function queryVisibleAnnouncementsNoOrder(limitN: number) {
  return query(
    collection(db, "announcements"),
    where("visible", "==", true),
    limit(limitN)
  );
}
