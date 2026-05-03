/**
 * Web `markAnnouncementRead` のネイティブ版（ログイン: Firestore / 未ログイン: AsyncStorage）。
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";

const ANNOUNCEMENT_READ_IDS_STORAGE_KEY = "uniterz_announcement_read_ids_v1";

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

async function addLocalAnnouncementReadId(announcementId: string): Promise<void> {
  const raw = await AsyncStorage.getItem(ANNOUNCEMENT_READ_IDS_STORAGE_KEY);
  const s = parseIds(raw);
  if (s.has(announcementId)) return;
  s.add(announcementId);
  await AsyncStorage.setItem(ANNOUNCEMENT_READ_IDS_STORAGE_KEY, JSON.stringify([...s]));
}

export function markAnnouncementReadNative(
  uid: string | null | undefined,
  announcementId: string
): void {
  if (!announcementId) return;
  if (uid) {
    const ref = doc(db, `users/${uid}/reads`, announcementId);
    void setDoc(ref, { at: serverTimestamp() }, { merge: true });
  } else {
    void addLocalAnnouncementReadId(announcementId);
  }
}
