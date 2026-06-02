// app/component/profile/useProfile.ts
"use client";

import { useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  query,
  where,
  getDocs,
  limit,
} from "firebase/firestore";
import { looksLikeFirestoreUid } from "@/lib/profile/profilePathKey";
import {
  parseUserProfileFields,
  profileDisplayFromUser,
} from "@/lib/profile/parseUserProfileFields";

export type Profile = {
  displayName: string;
  handle: string;
  bio: string;
  avatarUrl: string;
  counts: { posts: number };
  currentStreak: number;
  maxStreak: number;
  plan: "free" | "pro";
};

type Counts = {
  posts: number;
};

type UserState = {
  displayName?: string;
  handle?: string;
  bio?: string;
  photoURL?: string;
  currentStreak?: number;
  maxStreak?: number;
  plan?: "free" | "pro";
} | null;

const EMPTY_COUNTS: Counts = {
  posts: 0,
};

type ProfileLoadState = {
  loading: boolean;
  targetUid: string | null;
  user: UserState;
  counts: Counts;
};

const initialLoadState: ProfileLoadState = {
  loading: true,
  targetUid: null,
  user: null,
  counts: EMPTY_COUNTS,
};

async function fetchUserDocByRouteKey(
  decodedHandle: string
): Promise<{ id: string; data: Record<string, unknown> } | null> {
  if (looksLikeFirestoreUid(decodedHandle)) {
    const byUid = await getDoc(doc(db, "users", decodedHandle));
    if (byUid.exists()) {
      return { id: byUid.id, data: byUid.data() as Record<string, unknown> };
    }
  }

  const snap = await getDocs(
    query(
      collection(db, "users"),
      where("handle", "==", decodedHandle),
      limit(1)
    )
  );
  if (!snap.empty) {
    const d = snap.docs[0]!;
    return { id: d.id, data: d.data() as Record<string, unknown> };
  }

  if (!looksLikeFirestoreUid(decodedHandle)) {
    const byUid = await getDoc(doc(db, "users", decodedHandle));
    if (byUid.exists()) {
      return { id: byUid.id, data: byUid.data() as Record<string, unknown> };
    }
  }

  return null;
}

export function useProfile(handle: string) {
  const decodedHandle = useMemo(() => decodeURIComponent(handle), [handle]);

  const [state, setState] = useState<ProfileLoadState>(initialLoadState);

  useEffect(() => {
    let cancelled = false;

    setState({
      ...initialLoadState,
      loading: true,
    });

    (async () => {
      try {
        const docSnap = await fetchUserDocByRouteKey(decodedHandle);

        if (cancelled) return;

        if (!docSnap) {
          setState({
            loading: false,
            targetUid: null,
            user: null,
            counts: EMPTY_COUNTS,
          });
          return;
        }

        const d = docSnap.data;
        const { displayName, handle: userHandle } = parseUserProfileFields(d);

        const rawPlan = d.plan;
        const plan: "free" | "pro" = rawPlan === "pro" ? "pro" : "free";
        const countsRaw = d.counts as { posts?: number } | undefined;

        setState({
          loading: false,
          targetUid: docSnap.id,
          counts: {
            posts: countsRaw?.posts ?? 0,
          },
          user: {
            displayName,
            handle: userHandle,
            bio: typeof d.bio === "string" ? d.bio : "",
            photoURL: typeof d.photoURL === "string" ? d.photoURL : "",
            currentStreak:
              typeof d.currentStreak === "number" ? d.currentStreak : 0,
            maxStreak: typeof d.maxStreak === "number" ? d.maxStreak : 0,
            plan,
          },
        });
      } catch {
        if (!cancelled) {
          setState((prev) => ({ ...prev, loading: false }));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [decodedHandle]);

  const { user, counts, targetUid, loading } = state;

  const profile: Profile = useMemo(() => {
    const u = user ?? {};
    const placeholder = loading && user === null;
    const { displayName, handle: profileHandle } = profileDisplayFromUser(
      u,
      decodedHandle,
      placeholder
    );

    return {
      displayName,
      handle: profileHandle,
      bio: u.bio ?? "",
      avatarUrl: u.photoURL && u.photoURL.trim() ? u.photoURL : "",
      counts,
      currentStreak: u.currentStreak ?? 0,
      maxStreak: u.maxStreak ?? 0,
      plan: u.plan ?? "free",
    };
  }, [user, decodedHandle, counts, loading]);

  return {
    profile,
    loading,
    counts,
    targetUid,
  };
}
