"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import LeagueTabs from "./LeagueTabs";
import MonthHeader from "./MonthHeader";
import DayStrip from "./DayStrip";
import ScheduleList from "./ScheduleList";
import usePageSwipe from "./usePageSwipe";
import { useRouter, useSearchParams } from "next/navigation";
import { useGamesByDate } from "./useGamesByDate";
import { useGameDays } from "./useGameDays";
import type { League } from "@/app/component/games/MatchCard";
import Link from "next/link";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

// ---- Utils ----
function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// ★ 指定した月の最初の試合日
function findMonthFirstGame(gameDays: Date[], baseDate: Date, offset: number) {
  const targetYear = baseDate.getFullYear();
  const targetMonth = baseDate.getMonth() + offset;

  return (
    gameDays.find(
      (d) => d.getFullYear() === targetYear && d.getMonth() === targetMonth
    ) || null
  );
}

export default function GamesPage({ dense = false }: { dense?: boolean }) {
  const router = useRouter();
  const search = useSearchParams();

  // ---------- League ----------
  const initLg = (search.get("lg") === "j" ? "j" : "bj") as League;
  const [league, setLeague] = useState<League>(initLg);

  useEffect(() => {
    const current = search.get("lg");
    if (current !== league) {
      router.replace(`?lg=${league}`, { scroll: false });
    }
  }, [league, search, router]);

  // ---------- 試合日一覧 ----------
  const { gameDays, loading: loadingDays } = useGameDays(league);

  // ---------- 初期選択日 ----------
  const initialSelected = useMemo(() => {
    if (gameDays.length === 0) return null;
    const today = new Date().setHours(0, 0, 0, 0);

    return gameDays.reduce((best, d) => {
      const dist = Math.abs(d.getTime() - today);
      return dist < Math.abs(best.getTime() - today) ? d : best;
    }, gameDays[0]);
  }, [gameDays]);

  const [selected, setSelected] = useState<Date | null>(null);

  useEffect(() => {
    if (initialSelected) setSelected(initialSelected);
  }, [initialSelected]);

  // ---------- スワイプ ----------
  const pageRef = useRef<HTMLDivElement>(null);

  const moveToPrevDay = () => {
    if (!selected) return;
    const idx = gameDays.findIndex((d) => isSameDay(d, selected));
    if (idx > 0) setSelected(gameDays[idx - 1]);
  };

  const moveToNextDay = () => {
    if (!selected) return;
    const idx = gameDays.findIndex((d) => isSameDay(d, selected));
    if (idx >= 0 && idx < gameDays.length - 1) {
      setSelected(gameDays[idx + 1]);
    }
  };

  usePageSwipe(pageRef, {
    onSwipeRight: moveToPrevDay,
    onSwipeLeft: moveToNextDay,
    lockAxis: "x",
    threshold: 24,
  });

  // ---------- 試合データ ----------
  const safeDate = selected ?? new Date(2099, 0, 1);
  const { loading, error, games } = useGamesByDate(league, safeDate);

  const visibleCount = dense ? 7 : 10;
  const pagePad = dense ? "px-3" : "px-4 md:px-6";

  // ---------- 自分のプロフィール（左リンク） ----------
  const [myProfileHref, setMyProfileHref] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        const handle = snap.data()?.handle || snap.data()?.slug;
        if (handle) {
          setMyProfileHref(`/web/u/${encodeURIComponent(handle)}`);
        }
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
      {/* ---------------------------------
          🔥 ヘッダー：MobileTrendPage と完全統一
      ---------------------------------- */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[var(--color-app-bg,#0b2126)]/85 backdrop-blur-md ">
        <div className="relative h-11 flex items-center justify-between px-3 md:px-8">

          {/* 左：プロフィールリンク（中身なしでOK） */}
          <Link href={myProfileHref ?? "#"} className="w-9 h-9" />

          {/* 中央ロゴ */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <img
              src="/logo/logo.png"
              alt="Uniterz Logo"
              className="w-10 h-auto select-none"
            />
          </div>

          {/* 右：スペース（ロゴ中央維持のため） */}
          <div className="w-9 h-9" />
        </div>
      </header>

      {/* -------- League Tabs -------- */}
      <div className="flex items-center justify-between mb-2">
        <LeagueTabs value={league} onChange={setLeague} size={dense ? "md" : "lg"} />
      </div>

      {/* -------- Month Header -------- */}
      <MonthHeader
        month={
          selected
            ? new Date(selected.getFullYear(), selected.getMonth(), 1)
            : null
        }
        onPrev={() => {
          if (!selected) return;
          const prev = findMonthFirstGame(gameDays, selected, -1);
          if (prev) setSelected(prev);
        }}
        onNext={() => {
          if (!selected) return;
          const next = findMonthFirstGame(gameDays, selected, 1);
          if (next) setSelected(next);
        }}
        className="mb-2"
      />

      {/* -------- DayStrip -------- */}
      {loadingDays || !selected ? (
        <div className="text-center text-white/60 my-4">読み込み中...</div>
      ) : (
        <DayStrip
          dates={gameDays}
          selectedDate={selected}
          onSelect={setSelected}
          size={dense ? "md" : "lg"}
          visibleCount={visibleCount}
          autoScrollOnInit={false}
          className="mb-4"
        />
      )}

      {/* -------- 試合一覧 -------- */}
      {error && (
        <div className="text-center text-red-300 border border-red-500/30 bg-red-500/10 rounded-xl p-4 mb-4">
          試合データの取得に失敗しました：{error}
        </div>
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

/* ---------------- Skeleton ---------------- */
function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 animate-pulse">
      <div className="h-4 w-40 rounded bg-white/10 mx-auto mb-3" />
      <div className="grid grid-cols-3 items-center gap-2">
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded bg-white/10" />
          <div className="h-3 w-20 rounded bg-white/10" />
        </div>
        <div className="h-8 w-24 rounded bg-white/10 mx-auto" />
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded bg-white/10" />
          <div className="h-3 w-20 rounded bg-white/10" />
        </div>
      </div>
    </div>
  );
}
