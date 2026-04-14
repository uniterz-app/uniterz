// app/component/profile/useProfile.ts
"use client";

import { useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  limit,
} from "firebase/firestore";

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

const BASE_PROFILE: Omit<Profile, "handle"> & { handle?: string } = {
  displayName: "Chiki",
  bio: "",
  avatarUrl: "",
  counts: EMPTY_COUNTS,
  currentStreak: 0,
  maxStreak: 0,
  plan: "free",
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
        const qref = query(
          collection(db, "users"),
          where("handle", "==", decodedHandle),
          limit(1)
        );
        const snap = await getDocs(qref);

        if (cancelled) return;

        if (snap.empty) {
          setState({
            loading: false,
            targetUid: null,
            user: null,
            counts: EMPTY_COUNTS,
          });
          return;
        }

        const docSnap = snap.docs[0];
        const d = docSnap.data() as any;

        const rawPlan = d.plan;
        const plan: "free" | "pro" = rawPlan === "pro" ? "pro" : "free";

        setState({
          loading: false,
          targetUid: docSnap.id,
          counts: {
            posts: d.counts?.posts ?? 0,
          },
          user: {
            displayName: d.displayName ?? "",
            handle: d.handle ?? decodedHandle,
            bio: d.bio ?? "",
            photoURL: d.photoURL ?? "",
            currentStreak: d.currentStreak ?? 0,
            maxStreak: d.maxStreak ?? 0,
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

    return {
      displayName: placeholder
        ? decodedHandle
        : u.displayName || BASE_PROFILE.displayName,
      handle: u.handle || decodedHandle,
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
