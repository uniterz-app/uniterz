"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import Link from "next/link";
import PredictionPostCard from "@/app/component/post/PredictionPostCardV2";
import SearchTabModal from "@/app/component/timeline/SearchTabModal";

import { useFollowingFeed } from "./useFollowingFeed";
import { useJLeagueFeed } from "./useJLeagueFeed";
import { useBLeagueFeed } from "./useBLeagueFeed";
import { useNBAFeed } from "./useNBAFeed";

import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

type Tab = "nba" | "bj" | "following";

export default function HomeTimeline({ variant = "mobile" }) {
  const [tab, setTab] = useState<Tab>("nba");

  // 🔥 Hooks は必ずトップレベルで呼ぶ
  const nbaFeed = useNBAFeed();
  const bjFeed = useBLeagueFeed();
  const followingFeed = useFollowingFeed();

  // タブごとに feed を切り替える
  const feed =
  tab === "nba"
    ? nbaFeed
    : tab === "bj"
    ? bjFeed
    : followingFeed;

  /* -----------------------------------------
     Search モーダル
  ----------------------------------------- */
  const [searchOpen, setSearchOpen] = useState(false);

  /* -----------------------------------------
     プロフィール情報
  ----------------------------------------- */
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [myProfileHref, setMyProfileHref] = useState<string | null>(null);

  useEffect(() => {
    const loadUserPhoto = async () => {
      const user = auth.currentUser;
      if (!user) return;

      if (user.photoURL) setUserPhoto(user.photoURL);

      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        const avatar = data?.avatarUrl || data?.photoURL;
        if (avatar) setUserPhoto(avatar);

        const handle = data?.handle || data?.slug;
        const prefix = variant === "mobile" ? "/mobile" : "/web";

        setMyProfileHref(
          handle ? `${prefix}/u/${encodeURIComponent(handle)}` : `${prefix}/login`
        );
      }
    };

    const unsub = auth.onAuthStateChanged(() => loadUserPhoto());
    loadUserPhoto();

    return () => unsub();
  }, [variant]);

  /* -----------------------------------------
     無限スクロール（Observer の張り直し防止）
  ----------------------------------------- */
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const target = sentinelRef.current;
    if (!target) return;

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          feed.loadMore?.();
        }
      },
      { rootMargin: "200px" }
    );

    io.observe(target);
    return () => io.disconnect();
  }, [tab]); // ← feed.loadMore は固定化されたので不要

  /* -----------------------------------------
     Pull-to-refresh
  ----------------------------------------- */
  const pullStartY = useRef<number | null>(null);
  const pullDistance = useRef(0);
  const [isPulling, setIsPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY !== 0) return;
    pullStartY.current = e.touches[0].clientY;
    pullDistance.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (pullStartY.current === null) return;
    const diff = e.touches[0].clientY - pullStartY.current;
    if (diff > 0) {
      pullDistance.current = diff;
      setIsPulling(true);
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling) {
      pullStartY.current = null;
      return;
    }

    setIsPulling(false);

    if (pullDistance.current > 70) {
      setRefreshing(true);
      await feed.refresh();
      setRefreshing(false);
    }

    pullDistance.current = 0;
    pullStartY.current = null;
  };

  const wrapW = variant === "web" ? "max-w-5xl" : "max-w-[680px]";
  const headerH = "h-11";
  const padX = "px-3 md:px-8";

  /* -----------------------------------------
     UI（ここから下は1pxも変更なし）
  ----------------------------------------- */
  return (
    <div
      className="min-h-screen bg-[var(--color-app-bg,#0b2126)] text-white"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull UI */}
      {isPulling && (
        <div
          className="text-center text-white/70 transition-all"
          style={{
            height: Math.min(pullDistance.current, 60),
            lineHeight: `${Math.min(pullDistance.current, 60)}px`,
          }}
        >
          ↓ 引っ張って更新
        </div>
      )}
      {refreshing && (
        <div className="text-center text-white/70 py-2">更新中...</div>
      )}

      {/* HEADER */}
      <header className="pt-2 sticky top-0 z-30 border-b border-white/10 bg-[var(--color-app-bg,#0b2126)]/80 backdrop-blur-md">
        <div
          className={`relative mx-auto ${wrapW} ${headerH} ${padX} flex items-center justify-between`}
        >
          <Link href={myProfileHref ?? "#"} className="shrink-0 pl-3">
            {userPhoto ? (
              <img
                src={userPhoto}
                alt="me"
                className="h-9 w-9 rounded-full object-cover ring-2 ring-[#072027]"
              />
            ) : (
              <div className="h-9 w-9 rounded-full ring-2 ring-[#072027] bg-white/0" />
            )}
          </Link>

          <div className="absolute left-1/2 -translate-x-1/2">
            <img src="/logo/logo.png" className="w-10 select-none" />
          </div>

          <div className="h-9 w-9" />
        </div>

        {/* Search bar */}
        <div className={`mx-auto ${wrapW} ${padX} pb-2 pt-3`}>
          <button
            onClick={() => setSearchOpen(true)}
            className="w-full h-11 rounded-2xl px-4 bg-white/10 border border-white/10 text-left text-white/70 flex items-center gap-3"
          >
            <svg
              className="h-5 w-5 opacity-70"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z"
              />
            </svg>
            ユーザーを検索
          </button>
        </div>

        {/* ★ 3タブ UI */}
        <nav className={`mx-auto ${wrapW} ${padX}`}>
          <div className="grid grid-cols-4 gap-1 rounded-xl bg-white/5 p-1">
            <TabButton active={tab === "nba"} onClick={() => setTab("nba")}>
  NBA
</TabButton>

<TabButton active={tab === "bj"} onClick={() => setTab("bj")}>
  Bリーグ
</TabButton>

<TabButton active={tab === "following"} onClick={() => setTab("following")}>
  フォロー中
</TabButton>
          </div>
        </nav>
      </header>

      {/* MAIN */}
      <main className={`mx-auto ${wrapW} ${padX} pb-20`}>
        <section className="mt-3 space-y-4">
          {/* 初回ロード時のみスケルトンを表示 */}
          {feed.loading && feed.posts.length === 0 && (
            <>
              <SkeletonPostCard />
              <SkeletonPostCard />
              <SkeletonPostCard />
            </>
          )}

          {!feed.loading &&
            feed.posts.length > 0 &&
            feed.posts.map((post) => (
              <PredictionPostCard key={post.id} post={post} />
            ))}

          {!feed.loading && feed.posts.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-white/80">
              投稿はまだありません。
            </div>
          )}

          <div ref={sentinelRef} className="h-14" />
        </section>
      </main>

      <SearchTabModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}

/* ===== タブボタン ===== */
function TabButton({ active, onClick, children }: any) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "h-10 rounded-lg text-sm font-bold transition",
        active ? "bg-white text-black" : "bg-transparent text-white/80 hover:bg-white/10",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

/* ===== スケルトン ===== */
function SkeletonPostCard() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 rounded-full bg-white/10" />
        <div className="flex-1 space-y-3">
          <div className="h-4 w-40 rounded bg-white/10" />
          <div className="h-3 w-24 rounded bg-white/10" />
          <div className="h-24 w-full rounded-xl bg-white/10" />
        </div>
      </div>
    </div>
  );
}
