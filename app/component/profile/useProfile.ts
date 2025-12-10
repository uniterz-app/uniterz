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
  doc,
  onSnapshot,
} from "firebase/firestore";
import { getIsFollowing } from "@/lib/follow";

export type Profile = {
  displayName: string;
  handle: string; // 先頭に @ を付けた表示用
  bio: string;
  avatarUrl: string;
  counts: { posts: number; followers: number; following: number };
  currentStreak: number;
  maxStreak: number;
};

const BASE_PROFILE: Omit<Profile, "handle"> & { handle?: string } = {
  displayName: "Chiki",
  bio: "",
  avatarUrl:
    "https://images.unsplash.com/photo-1541614101341-1b1c1f1a1c87?q=80&w=400&auto=format&fit=crop",
  counts: { posts: 128, followers: 2450, following: 311 },
  currentStreak: 0,
  maxStreak: 0,
};

export function useProfile(handle: string) {
  // URL の handle を decode して固定
  const decodedHandle = useMemo(() => decodeURIComponent(handle), [handle]);

  const [user, setUser] = useState<{
    displayName?: string;
    handle?: string;
    bio?: string;
    photoURL?: string;
    currentStreak?: number;
  maxStreak?: number;
  } | null>(null);

  const [loading, setLoading] = useState(true);

  type Counts = { posts: number; followers: number; following: number };
  const [counts, setCounts] = useState<Counts>({
    posts: 0,
    followers: 0,
    following: 0,
  });

  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [targetUid, setTargetUid] = useState<string | null>(null);

  /* ---------------------------------------------------------
   * 1) handle からユーザーを1回解決
   * --------------------------------------------------------- */
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

        if (!cancelled && !snap.empty) {
          const docSnap = snap.docs[0];
          const d = docSnap.data() as any;

          setTargetUid(docSnap.id);

          setCounts(d.counts ?? {
            posts: 0,
            followers: 0,
            following: 0,
          });

          setUser({
            displayName: d.displayName ?? "",
            handle: d.handle ?? decodedHandle,
            bio: d.bio ?? "",
            photoURL: d.photoURL ?? "",
            currentStreak: d.currentStreak ?? 0,
  maxStreak: d.maxStreak ?? 0,
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [decodedHandle]);

  /* ---------------------------------------------------------
   * 2) users/{uid} をリアルタイム購読（ログアウト時は購読しない）
   * --------------------------------------------------------- */
  useEffect(() => {
    if (!targetUid) return;

    const me = auth.currentUser;
    if (!me) {
      // 🔒 ログアウト状態では購読を開始しない（permission-denied防止）
      return;
    }

    const ref = doc(db, "users", targetUid);

    const unsub = onSnapshot(ref, (snap) => {
      const d = snap.data() as any;
      if (!d) return;

      setUser({
        displayName: d.displayName ?? "",
        handle: d.handle ?? decodedHandle,
        bio: d.bio ?? "",
        photoURL: d.photoURL ?? "",
        currentStreak: d.currentStreak ?? 0,
  maxStreak: d.maxStreak ?? 0,
      });

      if (d.counts) {
        setCounts({
          posts: d.counts.posts ?? 0,
          followers: d.counts.followers ?? 0,
          following: d.counts.following ?? 0,
        });
      }
    });

    return () => unsub();

  }, [targetUid, decodedHandle, auth.currentUser]); // ★ ログアウト時に再評価されて購読しない

  /* ---------------------------------------------------------
   * 3) フォロー状態チェック（ログアウト時は実行しない）
   * --------------------------------------------------------- */
  useEffect(() => {
    let mounted = true;
    if (!targetUid) return;

    const me = auth.currentUser;
    if (!me) return; // 🔒 ログアウト中は実行しない

    getIsFollowing(targetUid)
      .then((v) => mounted && setIsFollowing(v))
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, [targetUid, auth.currentUser]);

  /* ---------------------------------------------------------
   * 4) 表示用プロフィールを整形
   * --------------------------------------------------------- */
  const profile: Profile = useMemo(() => {
    const u = user ?? {};
    return {
      displayName: u.displayName || BASE_PROFILE.displayName,
      handle: u.handle || decodedHandle,   // ← @ を付けない
      bio: u.bio ?? "",
      avatarUrl:
        u.photoURL && u.photoURL.trim()
          ? u.photoURL
          : BASE_PROFILE.avatarUrl,
      counts,
      currentStreak: (u as any).currentStreak ?? 0,
    maxStreak: (u as any).maxStreak ?? 0,
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
