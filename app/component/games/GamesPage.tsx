"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";
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
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import {
  TIMEZONE_ET,
  TIMEZONE_JST,
  getTodayKeyInTimeZone,
  parseDateKeyInTimeZone,
  toDateKeyInTimeZone,
} from "@/lib/time/zonedTime";
import { bracketMarketTeamTypography } from "@/lib/games/teamDisplayTypography";

const GAMES_CONTENT_EASE = [0.22, 1, 0.36, 1] as const;
/** 日付ピックのあと試合リストの入場を少しずらす（秒） */
const GAMES_LIST_STAGGER_SEC = 0.12;

/* =========================
   Date Utils
========================= */
const pad2 = (n: number) => String(n).padStart(2, "0");

function findMonthFirstGame(
  gameDays: Date[],
  baseDate: Date,
  offset: number,
  timeZone: string
) {
  const baseKey = toDateKeyInTimeZone(baseDate, timeZone);
  const [yStr, mStr] = baseKey.slice(0, 7).split("-");
  const y = Number(yStr);
  const m0 = Number(mStr) - 1;

  const target = new Date(Date.UTC(y, m0 + offset, 1));
  const targetMonthKey = `${target.getUTCFullYear()}-${pad2(
    target.getUTCMonth() + 1
  )}`;

  return (
    gameDays.find((d) =>
      toDateKeyInTimeZone(d, timeZone).startsWith(targetMonthKey)
    ) ?? null
  );
}

function findInitialGameDay(params: {
  gameDays: Date[];
  stateSelected: Date | null;
  urlDate: string | null;
  todayKey: string;
  timeZone: string;
}): Date | null {
  const { gameDays, stateSelected, urlDate, todayKey, timeZone } = params;

  if (!gameDays.length) return null;

  if (stateSelected) {
    const hit = gameDays.find(
      (d) =>
        toDateKeyInTimeZone(d, timeZone) ===
        toDateKeyInTimeZone(stateSelected, timeZone)
    );
    if (hit) return hit;
  }

  const parsedUrlDate = parseDateKeyInTimeZone(urlDate ?? "", timeZone);
  if (parsedUrlDate) {
    const hit = gameDays.find(
      (d) =>
        toDateKeyInTimeZone(d, timeZone) ===
        toDateKeyInTimeZone(parsedUrlDate, timeZone)
    );
    if (hit) return hit;
  }

  const sorted = [...gameDays].sort((a, b) => a.getTime() - b.getTime());

  return (
    sorted.find((d) => toDateKeyInTimeZone(d, timeZone) >= todayKey) ??
    sorted[sorted.length - 1] ??
    null
  );
}

export default function GamesPage({ dense = false }: { dense?: boolean }) {
  const reduceMotion = useReducedMotion();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const season = searchParams.get("season") ?? getCurrentPlayoffSeason();
  const dateParam = searchParams.get("date");

  const { fUser: user } = useFirebaseUser();
  const { language } = useUserLanguage(user?.uid ?? null);
  const isEn = language === "en";
  const dayTimeZone = isEn ? TIMEZONE_ET : TIMEZONE_JST;

  /* =========================
     League
  ========================= */
  const [league, setLeague] = useState<League>("nba");
  const didInitLeague = useRef(false);

  // user_stats は後追いのみ。初回描画をブロックしない（試合カレンダーと並列で速く見せる）
  useEffect(() => {
    let alive = true;

    const resolveInitialLeague = async () => {
      if (didInitLeague.current) return;

      const user = auth.currentUser;
      if (!user) {
        if (!alive) return;
        didInitLeague.current = true;
        return;
      }

      try {
        const snap = await getDoc(doc(db, "user_stats_v2", user.uid));
        if (!alive) return;

        didInitLeague.current = true;

        if (!snap.exists()) {
          return;
        }

        const data = snap.data();
        const leaguePosts: Record<League, number> = {
          nba: data?.leagues?.nba?.posts ?? 0,
          pl: data?.leagues?.pl?.posts ?? 0,
          bj: data?.leagues?.bj?.posts ?? 0,
          j1: data?.leagues?.j1?.posts ?? 0,
        };

        const sorted = (Object.entries(leaguePosts) as [League, number][]).sort(
          (a, b) => b[1] - a[1]
        );

        const [, topCount] = sorted[0];
        if (topCount > 0) {
          setLeague(sorted[0][0]);
        }
      } catch {
        if (!alive) return;
        didInitLeague.current = true;
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
  const { gameDays, loading: loadingDays } = useGameDays(league, dayTimeZone);

  /* =========================
     League ごとの選択日
  ========================= */
  const [selectedByLeague, setSelectedByLeague] = useState<
    Partial<Record<League, Date>>
  >({});

  const todayKey = useMemo(
    () => getTodayKeyInTimeZone(dayTimeZone),
    [dayTimeZone]
  );

  /* =========================
     初期選択日を render 中に確定
  ========================= */
  const selected = useMemo(() => {
    return findInitialGameDay({
      gameDays,
      stateSelected: selectedByLeague[league] ?? null,
      urlDate: dateParam,
      todayKey,
      timeZone: dayTimeZone,
    });
  }, [gameDays, selectedByLeague, league, dateParam, todayKey, dayTimeZone]);

  /* =========================
     state に保存
  ========================= */
  useEffect(() => {
    if (!selected) return;
    if (selectedByLeague[league]) return;

    setSelectedByLeague((prev) => ({
      ...prev,
      [league]: selected,
    }));
  }, [selected, selectedByLeague, league]);

  /* =========================
     URL同期
  ========================= */
  useEffect(() => {
    if (!selected) return;

    const nextDateKey = toDateKeyInTimeZone(selected, dayTimeZone);
    const currentDateKey = searchParams.get("date");

    if (currentDateKey === nextDateKey) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set("date", nextDateKey);
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [selected, router, searchParams]);

  const setSelectedAndSync = useCallback(
    (d: Date) => {
      setSelectedByLeague((prev) => ({ ...prev, [league]: d }));

      const nextDateKey = toDateKeyInTimeZone(d, dayTimeZone);
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
      sorted.find((d) => toDateKeyInTimeZone(d, dayTimeZone) >= todayKey) ??
      sorted[sorted.length - 1];

    if (!target) return;
    setSelectedAndSync(target);
  }, [gameDays, todayKey, dayTimeZone, setSelectedAndSync]);

  /* =========================
     Swipe
  ========================= */
  const pageRef = useRef<HTMLDivElement>(null);

  const moveToPrevDay = useCallback(() => {
    if (!selected) return;
    const key = toDateKeyInTimeZone(selected, dayTimeZone);
    const idx = gameDays.findIndex(
      (d) => toDateKeyInTimeZone(d, dayTimeZone) === key
    );
    if (idx > 0) setSelectedAndSync(gameDays[idx - 1]);
  }, [selected, gameDays, dayTimeZone, setSelectedAndSync]);

  const moveToNextDay = useCallback(() => {
    if (!selected) return;
    const key = toDateKeyInTimeZone(selected, dayTimeZone);
    const idx = gameDays.findIndex(
      (d) => toDateKeyInTimeZone(d, dayTimeZone) === key
    );
    if (idx >= 0 && idx < gameDays.length - 1) {
      setSelectedAndSync(gameDays[idx + 1]);
    }
  }, [selected, gameDays, dayTimeZone, setSelectedAndSync]);

  usePageSwipe(pageRef, {
    onSwipeRight: moveToPrevDay,
    onSwipeLeft: moveToNextDay,
    lockAxis: "x",
    threshold: 24,
  });

  /* =========================
     Games
  ========================= */
  const { loading, games } = useGamesByDate(league, selected, dayTimeZone);

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
    const key = toDateKeyInTimeZone(selected, dayTimeZone);
    return (
      gameDays.find((d) => toDateKeyInTimeZone(d, dayTimeZone) > key) ?? null
    );
  }, [gameDays, selected, dayTimeZone]);

  /* =========================
     auto advance
  ========================= */
  const didAutoAdvance = useRef<Partial<Record<League, boolean>>>({});

  useEffect(() => {
    if (!selected) return;
    if (toDateKeyInTimeZone(selected, dayTimeZone) !== todayKey) return;
    if (!allFinished) return;
    if (!nextGameDay) return;
    if (didAutoAdvance.current[league]) return;

    didAutoAdvance.current[league] = true;
    setSelectedAndSync(nextGameDay);
  }, [
    selected,
    todayKey,
    allFinished,
    nextGameDay,
    league,
    dayTimeZone,
    setSelectedAndSync,
  ]);

  /* =========================
     UI
  ========================= */
  const visibleCount = dense ? 7 : 10;
  const pagePad = dense ? "px-3" : "px-4 md:px-6";
  const isInitialLoading = loadingDays || !selected;
const isSwitchingDate = !!selected && loading;

  /* =========================
     Paths
  ========================= */
  const isMobile = Boolean(
    pathname?.startsWith("/mobile") || pathname?.startsWith("/m/")
  );
  const playoffHref = isMobile ? "/mobile/playoff" : "/web/playoff";
  const playoffViewHref = isMobile
    ? "/mobile/playoff-bracket/view"
    : "/web/playoff-bracket/view";
  async function handleBracketClick() {
    const user = auth.currentUser;

    if (!user) return;

    const saved = await loadPlayoffBracket(user.uid, season);

    if (saved) {
      router.push(`${playoffViewHref}?season=${encodeURIComponent(season)}`);
      return;
    }

    router.push(`${playoffHref}?season=${encodeURIComponent(season)}`);
  }

  const monthValue = selected ?? null;

  const selectedDayKey = useMemo(
    () => (selected ? toDateKeyInTimeZone(selected, dayTimeZone) : ""),
    [selected, dayTimeZone]
  );

  return (
    <div
      ref={pageRef}
      className={[
        "min-h-svh overflow-y-auto overscroll-x-contain",
        pagePad,
        "pt-2 pb-bottom-nav text-white",
      ].join(" ")}
      style={{ touchAction: "pan-y" }}
    >
      <div className="mb-2 mt-3 flex items-center justify-between gap-3">
        <LeagueTabs
          value={league}
          onChange={setLeague}
          size={dense ? "md" : "lg"}
          layoutMobile={isMobile}
        />

        {league === "nba" && (
          <button
            type="button"
            onClick={handleBracketClick}
            style={bracketMarketTeamTypography(isMobile)}
            className={[
              dense
                ? "rounded-lg px-3 py-1.5 text-sm"
                : "rounded-xl px-4 py-2 text-base",
              "shrink-0 border border-[#1f6feb]/35 bg-[#1f6feb]/12 font-bold uppercase tracking-normal text-[#6ea8ff] transition hover:bg-[#1f6feb]/18",
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
          const prev = findMonthFirstGame(
            gameDays,
            selected,
            -1,
            dayTimeZone
          );
          if (prev) setSelectedAndSync(prev);
        }}
        onNext={() => {
          if (!selected) return;
          const next = findMonthFirstGame(gameDays, selected, 1, dayTimeZone);
          if (next) setSelectedAndSync(next);
        }}
        onCenterClick={moveToToday}
        timeZone={dayTimeZone}
        isEn={isEn}
        className="mb-2"
      />

{isInitialLoading ? (
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
    <motion.div
      key={`day-strip-${league}`}
      className="mb-4"
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0 : 0.42,
        ease: GAMES_CONTENT_EASE,
      }}
    >
      <DayStrip
        dates={gameDays}
        selectedDate={selected}
        onSelect={setSelectedAndSync}
        size={dense ? "md" : "lg"}
        visibleCount={visibleCount}
        autoScrollOnInit={false}
        timeZone={dayTimeZone}
        isEn={isEn}
      />
    </motion.div>

    <motion.div
      key={`sched-${selectedDayKey}-${loading ? "l" : "d"}`}
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0 : 0.42,
        delay: reduceMotion ? 0 : GAMES_LIST_STAGGER_SEC,
        ease: GAMES_CONTENT_EASE,
      }}
    >
      <div
        className={[
          "transition-opacity duration-150",
          isSwitchingDate ? "opacity-85" : "opacity-100",
        ].join(" ")}
      >
        <ScheduleList games={games} dense={dense} loading={loading} />
      </div>
    </motion.div>
  </>
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