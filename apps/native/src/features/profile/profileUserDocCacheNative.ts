/**
 * users/{uid} — プロフィール初回表示用（共有メモリ + Native Firestore）。
 */
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import {
  clearUserDocMemoryInflight,
  getUserDocMemoryInflight,
  invalidateUserDocMemory,
  peekUserDocMemory,
  peekUserDocMemoryEntry,
  setUserDocMemory,
  setUserDocMemoryInflight,
} from "../../../../../lib/user/userDocMemoryCache";

export function peekProfileUserDocNative(
  uid: string
): Record<string, unknown> | null | undefined {
  return peekUserDocMemory(uid);
}

export function invalidateProfileUserDocNative(uid: string): void {
  invalidateUserDocMemory(uid);
}

export async function loadProfileUserDocNative(
  uid: string
): Promise<{ exists: boolean; data: Record<string, unknown> } | null> {
  const safeUid = uid.trim();
  if (!safeUid) return null;

  const hit = peekUserDocMemoryEntry(safeUid);
  if (hit) {
    return { exists: hit.exists, data: hit.data };
  }

  const existing = getUserDocMemoryInflight(safeUid);
  if (existing) return existing;

  const promise = getDoc(doc(db, "users", safeUid))
    .then((snap) => {
      const entry = {
        exists: snap.exists(),
        data: snap.exists()
          ? (snap.data() as Record<string, unknown>)
          : {},
      };
      setUserDocMemory(safeUid, entry);
      return entry;
    })
    .catch(() => null)
    .finally(() => {
      clearUserDocMemoryInflight(safeUid);
    });

  setUserDocMemoryInflight(safeUid, promise);
  return promise;
}
