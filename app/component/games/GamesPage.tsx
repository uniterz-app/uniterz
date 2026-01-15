"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import LeagueTabs from "./LeagueTabs";
import MonthHeader from "./MonthHeader";
import DayStrip from "./DayStrip";
import ScheduleList from "./ScheduleList";
import usePageSwipe from "./usePageSwipe";
import { useGamesByDate } from "./useGamesByDate";
import { useGameDays } from "./useGameDays";
import Link from "next/link";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import type { League } from "@/lib/leagues";
import { useRouter, useSearchParams } from "next/navigation";

/* =========================
   Date Utils（唯一の真実）
========================= */
function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ★ 指定した月の最初の試合日
function findMonthFirstGame(gameDays: Date[], baseDate: Date, offset: number) {
  const baseKey = toDateKey(baseDate).slice(0, 7); // yyyy-mm
  const targetMonth =
    offset === 0
      ? baseKey
      : (() => {
          const d = new Date(baseDate);
          d.setMonth(d.getMonth() + offset);
          return toDateKey(d).slice(0, 7);
        })();

  return gameDays.find((d) => toDateKey(d).startsWith(targetMonth)) ?? null;
}

export default function GamesPage({ dense = false }: { dense?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  /* =========================
     League
  ========================= */
  const [league, setLeague] = useState<League>("nba");

  const [leagueReady, setLeagueReady] = useState(false);

  /* =========================
     初期リーグ決定フラグ
  ========================= */
  const didInitLeague = useRef(false);

  /* =========================
     ユーザーの投稿数から初期リーグ決定
  ========================= */
 useEffect(() => {
  const resolveInitialLeague = async () => {
    if (didInitLeague.current) return;

    const user = auth.currentUser;
    if (!user) {
      // 未ログイン時も league を確定させる
      didInitLeague.current = true;
      setLeague("nba");
      setLeagueReady(true);
      return;
    }

    const snap = await getDoc(doc(db, "user_stats_v2", user.uid));
    if (!snap.exists()) {
      didInitLeague.current = true;
      setLeague("nba");
      setLeagueReady(true);
      return;
    }

    const data = snap.data();
    const leaguePosts: Record<League, number> = {
      nba: data?.leagues?.nba?.posts ?? 0,
      pl: data?.leagues?.pl?.posts ?? 0,
      bj: data?.leagues?.bj?.posts ?? 0,
      j1: data?.leagues?.j1?.posts ?? 0,
    };

    const sorted = (Object.entries(leaguePosts) as [League, number][])
      .sort((a, b) => b[1] - a[1]);

    const [topLeague, topCount] = sorted[0];

    didInitLeague.current = true;
    setLeague(topCount > 0 ? topLeague : "nba");
    setLeagueReady(true);
  };

  resolveInitialLeague();
}, []);

  /* =========================
     Game days
  ========================= */
  const { gameDays, loading: loadingDays } = useGameDays(league);

  /* =========================
     League ごとの選択日
  ========================= */
  const [selectedByLeague, setSelectedByLeague] = useState<
    Partial<Record<League, Date>>
  >({});

  const selected = selectedByLeague[league] ?? null;

/* =========================
   Today（key）15:00ルール
========================= */
const todayKey = useMemo(() => {
  // JST に固定
  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" })
  );

  const base = new Date(now);
  base.setHours(0, 0, 0, 0);

  // 15:00以降は翌日
  if (now.getHours() >= 15) {
    base.setDate(base.getDate() + 1);
  }

  return toDateKey(base);
}, []);

  /* =========================
     初期位置決定（唯一のロジック）
  ========================= */
  useEffect(() => {
  if (!leagueReady) return;          // ★ 追加
  if (selectedByLeague[league]) return;
  if (!gameDays.length) return;

  const sorted = [...gameDays].sort(
    (a, b) => toDateKey(a).localeCompare(toDateKey(b))
  );

  const initial =
    sorted.find((d) => toDateKey(d) >= todayKey) ??
    sorted[sorted.length - 1];

  setSelectedByLeague((prev) => ({
    ...prev,
    [league]: initial,
  }));

  router.replace(`?date=${toDateKey(initial)}`, { scroll: false });
}, [league, leagueReady, gameDays, todayKey, selectedByLeague, router]);

  /* =========================
     selected + URL 同期
  ========================= */
  const setSelectedAndSync = (d: Date) => {
    setSelectedByLeague((prev) => ({ ...prev, [league]: d }));
    router.replace(`?date=${toDateKey(d)}`, { scroll: false });
  };

  /* =========================
     Swipe
  ========================= */
  const pageRef = useRef<HTMLDivElement>(null);

  const moveToPrevDay = () => {
    if (!selected) return;
    const key = toDateKey(selected);
    const idx = gameDays.findIndex((d) => toDateKey(d) === key);
    if (idx > 0) setSelectedAndSync(gameDays[idx - 1]);
  };

  const moveToNextDay = () => {
    if (!selected) return;
    const key = toDateKey(selected);
    const idx = gameDays.findIndex((d) => toDateKey(d) === key);
    if (idx >= 0 && idx < gameDays.length - 1) {
      setSelectedAndSync(gameDays[idx + 1]);
    }
  };

  usePageSwipe(pageRef, {
    onSwipeRight: moveToPrevDay,
    onSwipeLeft: moveToNextDay,
    lockAxis: "x",
    threshold: 24,
  });

  /* =========================
     Games
  ========================= */
  const safeDate = selected ?? new Date();
  const { loading, games } = useGamesByDate(league, safeDate);

  /* =========================
     全試合終了判定
  ========================= */
  const allFinished = useMemo(() => {
    if (!games) return false;
    if (games.length === 0) return true;
    return games.every((g: any) => g.status === "final");
  }, [games]);

  /* =========================
     次の試合日
  ========================= */
  const nextGameDay = useMemo(() => {
    if (!selected) return null;
    const key = toDateKey(selected);
    return gameDays.find((d) => toDateKey(d) > key) ?? null;
  }, [gameDays, selected]);

  /* =========================
     auto advance
  ========================= */
  const didAutoAdvance = useRef<Partial<Record<League, boolean>>>({});

  useEffect(() => {
    if (!selected) return;
    if (toDateKey(selected) !== todayKey) return;
    if (!allFinished) return;
    if (!nextGameDay) return;
    if (didAutoAdvance.current[league]) return;

    didAutoAdvance.current[league] = true;
    setSelectedAndSync(nextGameDay);
  }, [selected, todayKey, allFinished, nextGameDay, league]);

  /* =========================
     UI
  ========================= */
  const visibleCount = dense ? 7 : 10;
  const pagePad = dense ? "px-3" : "px-4 md:px-6";

  /* =========================
     Profile
  ========================= */
  const [myProfileHref, setMyProfileHref] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        const handle = snap.data()?.handle || snap.data()?.slug;
        if (handle) setMyProfileHref(`/web/u/${encodeURIComponent(handle)}`);
      }
    };
    load();
  }, []);

  return (
    <div
      ref={pageRef}
      className={[
        "min-h-[100svh] overflow-y-auto overscroll-x-contain",
        pagePad,
        "pt-2 pb-4 text-white",
      ].join(" ")}
      style={{ touchAction: "pan-y" }}
    >
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[var(--color-app-bg,#0b2126)]/85 backdrop-blur-md">
        <div className="relative h-11 flex items-center justify-between px-3 md:px-8">
          <Link href={myProfileHref ?? "#"} className="w-9 h-9" />
          <div className="absolute left-1/2 -translate-x-1/2">
            <img src="/logo/logo.png" alt="Uniterz Logo" className="w-10 h-auto" />
          </div>
          <div className="w-9 h-9" />
        </div>
      </header>

      <div className="flex items-center justify-between mb-2 mt-3">
        <LeagueTabs value={league} onChange={setLeague} size={dense ? "md" : "lg"} />
      </div>

      <MonthHeader
        month={selected ? new Date(selected.getFullYear(), selected.getMonth(), 1) : null}
        onPrev={() => {
          if (!selected) return;
          const prev = findMonthFirstGame(gameDays, selected, -1);
          if (prev) setSelectedAndSync(prev);
        }}
        onNext={() => {
          if (!selected) return;
          const next = findMonthFirstGame(gameDays, selected, 1);
          if (next) setSelectedAndSync(next);
        }}
        className="mb-2"
      />

      {loadingDays || !selected ? (
        <div className="text-center text-white/60 my-4">読み込み中...</div>
      ) : (
        <DayStrip
          dates={gameDays}
          selectedDate={selected}
          onSelect={setSelectedAndSync}
          size={dense ? "md" : "lg"}
          visibleCount={visibleCount}
          autoScrollOnInit={false}
          className="mb-4"
        />
      )}

      {loading ? (
        <div className="grid gap-6 px-4 md:px-6 lg:px-8">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <ScheduleList games={games} dense={dense} />
      )}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 animate-pulse">
      <div className="h-4 w-40 rounded bg-white/10 mx-auto mb-3" />
    </div>
  );
}
