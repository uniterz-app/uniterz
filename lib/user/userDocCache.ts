"use client";

import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  clearUserDocMemoryInflight,
  getUserDocMemoryInflight,
  invalidateUserDocMemory,
  peekUserDocMemoryEntry,
  setUserDocMemory,
  setUserDocMemoryInflight,
} from "@/lib/user/userDocMemoryCache";

export async function getUserDocDataCached(
  uid: string,
  options?: { force?: boolean }
): Promise<Record<string, unknown> | null> {
  const safeUid = uid.trim();
  if (!safeUid) return null;
  const force = options?.force === true;

  if (!force) {
    const cached = peekUserDocMemoryEntry(safeUid);
    if (cached) return cached.exists ? cached.data : null;
  }

  const existing = getUserDocMemoryInflight(safeUid);
  if (existing) {
    const loaded = await existing;
    return loaded?.exists ? loaded.data : null;
  }

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
  const loaded = await promise;
  return loaded?.exists ? loaded.data : null;
}

export function invalidateUserDocCache(uid?: string) {
  invalidateUserDocMemory(uid);
}
