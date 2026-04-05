// app/component/profile/useProfile.ts
"use client";

import { useEffect, useMemo, useState } from "react";
import { db, auth } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  limit,
} from "firebase/firestore";
import { getIsFollowing } from "@/lib/follow";

export type Profile = {
  displayName: string;
  handle: string;
  bio: string;
  avatarUrl: string;
  counts: { posts: number; followers: number; following: number };
  currentStreak: number;
  maxStreak: number;
  plan: "free" | "pro";
};

type Counts = {
  posts: number;
  followers: number;
  following: number;
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
  followers: 0,
  following: 0,
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

export function useProfile(handle: string) {
  const decodedHandle = useMemo(() => decodeURIComponent(handle), [handle]);

  const [user, setUser] = useState<UserState>(null);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<Counts>(EMPTY_COUNTS);
  const [isFollowing, setIsFollowing] = useState(false);
  const [targetUid, setTargetUid] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);

        const qref = query(
          collection(db, "users"),
          where("handle", "==", decodedHandle),
          limit(1)
        );
        const snap = await getDocs(qref);

        if (cancelled) return;

        if (snap.empty) {
          setTargetUid(null);
          setUser(null);
          setCounts(EMPTY_COUNTS);
          setIsFollowing(false);
          return;
        }

        const docSnap = snap.docs[0];
        const d = docSnap.data() as any;

        setTargetUid(docSnap.id);

        setCounts(
          d.counts
            ? {
                posts: d.counts.posts ?? 0,
                followers: d.counts.followers ?? 0,
                following: d.counts.following ?? 0,
              }
            : EMPTY_COUNTS
        );

        const rawPlan = d.plan;
        const plan: "free" | "pro" =
          rawPlan === "pro" ? "pro" : "free";

        setUser({
          displayName: d.displayName ?? "",
          handle: d.handle ?? decodedHandle,
          bio: d.bio ?? "",
          photoURL: d.photoURL ?? "",
          currentStreak: d.currentStreak ?? 0,
          maxStreak: d.maxStreak ?? 0,
          plan,
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [decodedHandle]);

  useEffect(() => {
    if (!targetUid) {
      setIsFollowing(false);
      return;
    }

    const me = auth.currentUser;
    if (!me) {
      setIsFollowing(false);
      return;
    }

    let mounted = true;

    getIsFollowing(targetUid)
      .then((v) => {
        if (mounted) setIsFollowing(v);
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, [targetUid]);

  const profile: Profile = useMemo(() => {
    const u = user ?? {};

    return {
      displayName: u.displayName || BASE_PROFILE.displayName,
      handle: u.handle || decodedHandle,
      bio: u.bio ?? "",
      avatarUrl: u.photoURL && u.photoURL.trim() ? u.photoURL : "",
      counts,
      currentStreak: u.currentStreak ?? 0,
      maxStreak: u.maxStreak ?? 0,
      plan: u.plan ?? "free",
    };
  }, [user, decodedHandle, counts]);

  return {
    profile,
    loading,
    counts,
    isFollowing,
    setIsFollowing,
    targetUid,
  };
}