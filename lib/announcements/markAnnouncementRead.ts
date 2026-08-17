import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { addLocalAnnouncementReadId } from "@/lib/announcements/localAnnouncementReads";
import { notifyAnnouncementReadsChanged } from "@/lib/announcements/loadAnnouncementReadIds";

/**
 * お知らせを既読にする。
 * ログイン時: users/{uid}/reads
 * ゲスト: localStorage（端末内）
 */
export function markAnnouncementRead(
  uid: string | null | undefined,
  announcementId: string
): void {
  if (!announcementId) return;
  if (uid) {
    const ref = doc(db, `users/${uid}/reads`, announcementId);
    void setDoc(ref, { at: serverTimestamp() }, { merge: true }).then(() => {
      notifyAnnouncementReadsChanged(uid);
    });
  } else {
    addLocalAnnouncementReadId(announcementId);
  }
}
