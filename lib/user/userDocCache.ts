"use client";

import { doc, getDoc, type DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebase";

const USER_DOC_CACHE_TTL_MS = 60 * 1000;

type CacheEntry = {
  data: DocumentData | null;
  expiresAt: number;
};

const userDocCache = new Map<string, CacheEntry>();
const userDocInFlight = new Map<string, Promise<DocumentData | null>>();

export async function getUserDocDataCached(
  uid: string,
  options?: { force?: boolean }
): Promise<DocumentData | null> {
  const force = options?.force === true;
  const now = Date.now();

  if (!force) {
    const cached = userDocCache.get(uid);
    if (cached && cached.expiresAt > now) return cached.data;
  }

  const existing = userDocInFlight.get(uid);
  if (existing) return existing;

  const task = (async () => {
    const snap = await getDoc(doc(db, "users", uid));
    const data = snap.exists() ? snap.data() : null;
    userDocCache.set(uid, {
      data,
      expiresAt: Date.now() + USER_DOC_CACHE_TTL_MS,
    });
    return data;
  })();

  userDocInFlight.set(uid, task);
  try {
    return await task;
  } finally {
    userDocInFlight.delete(uid);
  }
}

export function invalidateUserDocCache(uid?: string) {
  if (uid) {
    userDocCache.delete(uid);
    userDocInFlight.delete(uid);
    return;
  }
  userDocCache.clear();
  userDocInFlight.clear();
}

