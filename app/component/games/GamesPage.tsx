"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import LeagueTabs from "./LeagueTabs";
import MonthHeader from "./MonthHeader";
import DayStrip from "./DayStrip";
import ScheduleList from "./ScheduleList";
import usePageSwipe from "./usePageSwipe";
import { useGamesByDate } from "./useGamesByDate";
import { useGameDays } from "./useGameDays";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import type { League } from "@/lib/leagues";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { loadPlayoffBracket } from "@/lib/playoff-bracket-firestore";
import { getCurrentPlayoffSeason } from "@/lib/playoff-bracket-config";

/* =========================
   Date Utils
========================= */
function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseDateKey(dateKey: string | null): Date | null {
  if (!dateKey) return null;

  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!m) return null;

  const y = Number(m[1]);
  const mm = Number(m[2]);
  const d = Number(m[3]);

  if (!y || !mm || !d) return null;

  const parsed = new Date(y, mm - 1, d);
  if (Number.isNaN(parsed.getTime())) return null;

  return parsed;
}

function findMonthFirstGame(gameDays: Date[], baseDate: Date, offset: number) {
  const target = new Date(baseDate);
  target.setMonth(target.getMonth() + offset);
  const targetMonthKey = toDateKey(target).slice(0, 7);

  return gameDays.find((d) => toDateKey(d).startsWith(targetMonthKey)) ?? null;
}

function getTodayKey(): string {
  const nowJst = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" })
  );

  const base = new Date(nowJst);
  base.setHours(0, 0, 0, 0);

  return toDateKey(base);
}

function findInitialGameDay(params: {
  gameDays: Date[];
  stateSelected: Date | null;
  urlDate: string | null;
  todayKey: string;
}): Date | null {
  const { gameDays, stateSelected, urlDate, todayKey } = params;

  if (!gameDays.length) return null;

  if (stateSelected) {
    const hit = gameDays.find((d) => toDateKey(d) === toDateKey(stateSelected));
    if (hit) return hit;
  }

  const parsedUrlDate = parseDateKey(urlDate);
  if (parsedUrlDate) {
    const hit = gameDays.find((d) => toDateKey(d) === toDateKey(parsedUrlDate));
    if (hit) return hit;
  }

  const sorted = [...gameDays].sort((a, b) => a.getTime() - b.getTime());

  return (
    sorted.find((d) => toDateKey(d) >= todayKey) ??
    sorted[sorted.length - 1] ??
    null
  );
}

export default function GamesPage({ dense = false }: { dense?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const season = searchParams.get("season") ?? getCurrentPlayoffSeason();
  const dateParam = searchParams.get("date");

  /* =========================
     League
  ========================= */
  const [league, setLeague] = useState<League>("nba");
  const [leagueReady, setLeagueReady] = useState(false);
  const didInitLeague = useRef(false);

  useEffect(() => {
    let alive = true;

    const resolveInitialLeague = async () => {
      if (didInitLeague.current) return;

      const user = auth.currentUser;
      if (!user) {
        if (!alive) return;
        didInitLeague.current = true;
        setLeague("nba");
        setLeagueReady(true);
        return;
      }

      try {
        const snap = await getDoc(doc(db, "user_stats_v2", user.uid));
        if (!alive) return;

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
      } catch {
        if (!alive) return;
        didInitLeague.current = true;
        setLeague("nba");
        setLeagueReady(true);
      }
    };

    resolveInitialLeague();

    return () => {
      alive = false;
    };
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

  const todayKey = useMemo(() => getTodayKey(), []);

  /* =========================
     初期選択日を render 中に確定
  ========================= */
  const selected = useMemo(() => {
    if (!leagueReady) return null;

    return findInitialGameDay({
      gameDays,
      stateSelected: selectedByLeague[league] ?? null,
      urlDate: dateParam,
      todayKey,
    });
  }, [leagueReady, gameDays, selectedByLeague, league, dateParam, todayKey]);

  /* =========================
     state に保存
  ========================= */
  useEffect(() => {
    if (!leagueReady) return;
    if (!selected) return;
    if (selectedByLeague[league]) return;

    setSelectedByLeague((prev) => ({
      ...prev,
      [league]: selected,
    }));
  }, [leagueReady, selected, selectedByLeague, league]);

  /* =========================
     URL同期
  ========================= */
  useEffect(() => {
    if (!selected) return;

    const nextDateKey = toDateKey(selected);
    const currentDateKey = searchParams.get("date");

    if (currentDateKey === nextDateKey) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set("date", nextDateKey);
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [selected, router, searchParams]);

  const setSelectedAndSync = useCallback(
    (d: Date) => {
      setSelectedByLeague((prev) => ({ ...prev, [league]: d }));

      const nextDateKey = toDateKey(d);
      const currentDateKey = searchParams.get("date");
      if (currentDateKey === nextDateKey) return;

      const params = new URLSearchParams(searchParams.toString());
      params.set("date", nextDateKey);
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [league, router, searchParams]
  );

  /* =========================
     today へ戻す
  ========================= */
  const moveToToday = useCallback(() => {
    if (!gameDays.length) return;

    const sorted = [...gameDays].sort((a, b) => a.getTime() - b.getTime());
    const target =
      sorted.find((d) => toDateKey(d) >= todayKey) ??
      sorted[sorted.length - 1];

    if (!target) return;
    setSelectedAndSync(target);
  }, [gameDays, todayKey, setSelectedAndSync]);

  /* =========================
     Swipe
  ========================= */
  const pageRef = useRef<HTMLDivElement>(null);

  const moveToPrevDay = useCallback(() => {
    if (!selected) return;
    const key = toDateKey(selected);
    const idx = gameDays.findIndex((d) => toDateKey(d) === key);
    if (idx > 0) setSelectedAndSync(gameDays[idx - 1]);
  }, [selected, gameDays, setSelectedAndSync]);

  const moveToNextDay = useCallback(() => {
    if (!selected) return;
    const key = toDateKey(selected);
    const idx = gameDays.findIndex((d) => toDateKey(d) === key);
    if (idx >= 0 && idx < gameDays.length - 1) {
      setSelectedAndSync(gameDays[idx + 1]);
    }
  }, [selected, gameDays, setSelectedAndSync]);

  usePageSwipe(pageRef, {
    onSwipeRight: moveToPrevDay,
    onSwipeLeft: moveToNextDay,
    lockAxis: "x",
    threshold: 24,
  });

  /* =========================
     Games
  ========================= */
  const { loading, games } = useGamesByDate(league, selected);

  /* =========================
     全試合終了判定
  ========================= */
  const allFinished = useMemo(() => {
    if (!selected) return false;
    if (!games) return false;
    if (games.length === 0) return false;
    return games.every((g: any) => g.status === "final");
  }, [selected, games]);

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
  }, [selected, todayKey, allFinished, nextGameDay, league, setSelectedAndSync]);

  /* =========================
     UI
  ========================= */
  const visibleCount = dense ? 7 : 10;
  const pagePad = dense ? "px-3" : "px-4 md:px-6";
  const isPageLoading = loadingDays || loading || !selected;

  /* =========================
     Paths
  ========================= */
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const isMobile = pathname?.startsWith("/mobile");
  const playoffHref = isMobile ? "/mobile/playoff" : "/web/playoff";
  const playoffViewHref = isMobile
    ? "/mobile/playoff-bracket/view"
    : "/web/playoff-bracket/view";
  const signupHref = isMobile ? "/mobile/signup" : "/web/signup";

  async function handleBracketClick() {
    const user = auth.currentUser;

    if (!user) {
      setLoginModalOpen(true);
      return;
    }

    const saved = await loadPlayoffBracket(user.uid, season);

    if (saved) {
      router.push(`${playoffViewHref}?season=${encodeURIComponent(season)}`);
      return;
    }

    router.push(`${playoffHref}?season=${encodeURIComponent(season)}`);
  }

  function handleGoSignup() {
    setLoginModalOpen(false);
    router.push(signupHref);
  }

  const monthValue = selected
    ? new Date(selected.getFullYear(), selected.getMonth(), 1)
    : null;

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
      <div className="mb-2 mt-3 flex items-center justify-between gap-3">
        <LeagueTabs
          value={league}
          onChange={setLeague}
          size={dense ? "md" : "lg"}
        />

        {league === "nba" && (
          <button
            type="button"
            onClick={handleBracketClick}
            className={[
              dense
                ? "rounded-lg px-3 py-1.5 text-sm"
                : "rounded-xl px-4 py-2 text-base",
              "shrink-0 border border-[#1f6feb]/35 bg-[#1f6feb]/12 font-semibold text-[#6ea8ff] transition hover:bg-[#1f6feb]/18",
            ].join(" ")}
          >
            Bracket
          </button>
        )}
      </div>

      <MonthHeader
        month={monthValue}
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
        onCenterClick={moveToToday}
        className="mb-2"
      />

      {isPageLoading ? (
        <>
          <div className="mb-4">
            <div className="h-14 rounded-2xl border border-white/10 bg-white/5 animate-pulse" />
          </div>

          <div className="grid gap-6 px-4 md:px-6 lg:px-8">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </>
      ) : (
        <>
          <DayStrip
            dates={gameDays}
            selectedDate={selected}
            onSelect={setSelectedAndSync}
            size={dense ? "md" : "lg"}
            visibleCount={visibleCount}
            autoScrollOnInit={false}
            className="mb-4"
          />

          <ScheduleList games={games} dense={dense} />
        </>
      )}

      {loginModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
          <button
            type="button"
            aria-label="Close modal"
            onClick={() => setLoginModalOpen(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
          />

          <div className="relative z-[201] w-full max-w-sm rounded-2xl border border-white/10 bg-[#0d1015] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
            <div className="text-[18px] font-semibold text-white">
              ログインしてください
            </div>

            <div className="mt-4 space-y-2 text-[14px] leading-relaxed text-white/78">
              <p>ブラケット機能を使うにはアカウントが必要です。</p>
              <p>アカウント作成後にブラケットを作成できます。</p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setLoginModalOpen(false)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/10"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleGoSignup}
                className="rounded-xl bg-[#163a5f] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1d4c78]"
              >
                アカウント作成
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mx-auto mb-3 h-4 w-40 rounded bg-white/10" />
    </div>
  );
}