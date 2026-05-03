"use client";

import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { motion, useReducedMotion } from "framer-motion";
import LeagueTabs from "./LeagueTabs";
import GamesTeamFilterPanel from "./GamesTeamFilterPanel";
import MonthHeader from "./MonthHeader";
import DayStrip from "./DayStrip";
import ScheduleList from "./ScheduleList";
import usePageSwipe from "./usePageSwipe";
import {
  gameRowStartDateKeyInTimeZone,
  useGamesByDate,
} from "./useGamesByDate";
import { useGameDays, monthRowsToSortedGameDays } from "./useGameDays";
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
  shiftCalendarMonthStart,
} from "@/lib/time/zonedTime";
import { bracketMarketTeamTypography } from "@/lib/games/teamDisplayTypography";
import {
  GAMES_CYBER_EASE,
  GAMES_DAY_SWITCH_EASE,
  GAMES_LIST_AFTER_DAY_STRIP_SEC,
  GAMES_SCHEDULE_SHELL_DURATION_SEC,
} from "./cyberMotion";
import { fetchMonthHasGames } from "@/lib/games/fetchMonthHasGames";
import { fetchNextGameDayAfterLocalDay } from "@/lib/games/fetchNextGameDayAfter";
import {
  gameInvolvesAnyTeam,
  gameIsHeadToHeadBetween,
  parseTeamFilterMode,
  parseTeamFilterParam,
  serializeTeamFilterParam,
  type TeamFilterMatchMode,
} from "@/lib/games/gameTeamFilter";
import { useScheduleTeams } from "@/lib/games/useScheduleTeams";
import {
  gameMatchesMarginBounds,
  parseMarginBoundParam,
} from "@/lib/games/marginFilter";
import { toStatus } from "@/lib/games/transform";

function isFinalGameRow(row: Record<string, unknown>): boolean {
  if (row.final === true || row.final === 1) return true;
  return toStatus(row.status) === "final";
}

/* =========================
   Date Utils
========================= */
function findInitialGameDay(params: {
  gameDays: Date[];
  stateSelected: Date | null;
  todayKey: string;
  timeZone: string;
}): Date | null {
  const { gameDays, stateSelected, todayKey, timeZone } = params;

  if (!gameDays.length) return null;

  if (stateSelected) {
    const wantedKey = toDateKeyInTimeZone(stateSelected, timeZone);
    const hit = gameDays.find(
      (d) => toDateKeyInTimeZone(d, timeZone) === wantedKey
    );
    if (hit) return hit;
    const monthPrefix = wantedKey.slice(0, 7);
    const inMonth = gameDays
      .filter((d) =>
        toDateKeyInTimeZone(d, timeZone).startsWith(monthPrefix)
      )
      .sort((a, b) => a.getTime() - b.getTime());
    if (inMonth.length) return inMonth[0];
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
          const top = sorted[0][0];
          /** B リーグタブ非表示中は初期リーグに bj を選ばない */
          if (top === "bj") {
            const fallback = sorted.find(([k, c]) => k !== "bj" && c > 0);
            if (fallback) setLeague(fallback[0]);
          } else {
            setLeague(top);
          }
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

  /** B リーグタブ非表示中は bj を選べない。状態が bj のままなら NBA に戻す */
  useLayoutEffect(() => {
    if (league !== "bj") return;
    setLeague("nba");
  }, [league]);

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

  /** 日付ストリップ・暦月の試合一括取得の基準日：選択中 → 今日（初期位置を今日基準に固定） */
  const anchorForGameDays = useMemo(() => {
    const stored = selectedByLeague[league];
    if (stored) return stored;
    return parseDateKeyInTimeZone(todayKey, dayTimeZone) ?? new Date();
  }, [dayTimeZone, league, selectedByLeague, todayKey]);

  /* =========================
     Game days（アンカー日の暦日±3日＝計7日分を取得しストリップ用）
  ========================= */
  const { gameDays, monthRows, peerRowsForSeriesInference, loading: loadingDays } =
    useGameDays(league, dayTimeZone, anchorForGameDays);

  const { teams, nameById } = useScheduleTeams(league);

  const teamFilterIds = useMemo(
    () => parseTeamFilterParam(searchParams.get("team")),
    [searchParams],
  );

  const teamFilterMatchMode: TeamFilterMatchMode = useMemo(() => {
    if (teamFilterIds.length < 2) return "any";
    return parseTeamFilterMode(searchParams.get("team_mode"));
  }, [teamFilterIds, searchParams]);

  const marginMin = useMemo(() => {
    const a = parseMarginBoundParam(searchParams.get("margin_min"));
    if (a != null) return a;
    const legacy = parseMarginBoundParam(searchParams.get("margin"));
    return legacy;
  }, [searchParams]);

  const marginMax = useMemo(() => {
    const b = parseMarginBoundParam(searchParams.get("margin_max"));
    if (b != null) return b;
    const legacy = parseMarginBoundParam(searchParams.get("margin"));
    if (
      legacy != null &&
      searchParams.get("margin_min") == null &&
      searchParams.get("margin_max") == null
    ) {
      return legacy;
    }
    return null;
  }, [searchParams]);

  const teamFilterKey = useMemo(
    () =>
      [
        serializeTeamFilterParam(teamFilterIds) ?? "all",
        teamFilterIds.length === 2 ? teamFilterMatchMode : "na",
        marginMin ?? "x",
        marginMax ?? "x",
      ].join("-"),
    [teamFilterIds, teamFilterMatchMode, marginMin, marginMax],
  );

  useEffect(() => {
    if (teamFilterIds.length >= 2) return;
    if (!searchParams.has("team_mode")) return;
    const params = new URLSearchParams(searchParams.toString());
    params.delete("team_mode");
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [teamFilterIds.length, searchParams, router]);

  const setTeamFilterIds = useCallback(
    (next: string[]) => {
      const params = new URLSearchParams(searchParams.toString());
      const s = serializeTeamFilterParam(next);
      if (s) params.set("team", s);
      else params.delete("team");
      if (next.length < 2) params.delete("team_mode");
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const setTeamFilterMatchMode = useCallback(
    (mode: TeamFilterMatchMode) => {
      const params = new URLSearchParams(searchParams.toString());
      if (teamFilterIds.length === 2 && mode === "h2h") {
        params.set("team_mode", "h2h");
      } else {
        params.delete("team_mode");
      }
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams, teamFilterIds.length],
  );

  const setMarginMinMax = useCallback(
    (nextMin: number | null, nextMax: number | null) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("margin");
      if (nextMin == null) params.delete("margin_min");
      else params.set("margin_min", String(nextMin));
      if (nextMax == null) params.delete("margin_max");
      else params.set("margin_max", String(nextMax));
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const clearAllTeamAndMarginFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("team");
    params.delete("team_mode");
    params.delete("margin");
    params.delete("margin_min");
    params.delete("margin_max");
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  const passesTeamFilterRow = useCallback(
    (game: Record<string, unknown>) => {
      if (!teamFilterIds.length) return true;
      if (teamFilterIds.length === 2 && teamFilterMatchMode === "h2h") {
        return gameIsHeadToHeadBetween(game, teamFilterIds, nameById);
      }
      return gameInvolvesAnyTeam(game, teamFilterIds, nameById);
    },
    [teamFilterIds, teamFilterMatchMode, nameById],
  );

  /** 日付ストリップ用。チーム・点差の両方を反映 */
  const gameDaysForStrip = useMemo(() => {
    const needTeam = teamFilterIds.length > 0;
    const needMargin = marginMin != null || marginMax != null;
    if (!needTeam && !needMargin) return gameDays;

    const filteredRows = monthRows.filter((g) => {
      const game = g as Record<string, unknown>;
      if (needTeam && !passesTeamFilterRow(game)) return false;
      if (needMargin && !gameMatchesMarginBounds(game, marginMin, marginMax)) {
        return false;
      }
      return true;
    });
    return monthRowsToSortedGameDays(filteredRows, dayTimeZone);
  }, [
    teamFilterIds.length,
    passesTeamFilterRow,
    marginMin,
    marginMax,
    monthRows,
    gameDays,
    dayTimeZone,
  ]);

  /* =========================
     初期選択日を render 中に確定
  ========================= */
  const selected = useMemo(() => {
    const stored = selectedByLeague[league] ?? null;
    if (!gameDaysForStrip.length) {
      return stored;
    }
    return findInitialGameDay({
      gameDays: gameDaysForStrip,
      stateSelected: stored,
      todayKey,
      timeZone: dayTimeZone,
    });
  }, [
    gameDaysForStrip,
    selectedByLeague,
    league,
    todayKey,
    dayTimeZone,
  ]);

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

  /** 隣接暦月に試合があるか（月送りの可否） */
  const [adjacentMonthHasGames, setAdjacentMonthHasGames] = useState<{
    prev: boolean;
    next: boolean;
    loading: boolean;
  }>({ prev: true, next: true, loading: true });

  useEffect(() => {
    if (!selected) {
      setAdjacentMonthHasGames({ prev: false, next: false, loading: false });
      return;
    }
    let cancelled = false;
    setAdjacentMonthHasGames((s) => ({ ...s, loading: true }));
    const prevAnchor = shiftCalendarMonthStart(selected, -1, dayTimeZone);
    const nextAnchor = shiftCalendarMonthStart(selected, 1, dayTimeZone);
    Promise.all([
      fetchMonthHasGames({
        league,
        monthAnchor: prevAnchor,
        timeZone: dayTimeZone,
      }),
      fetchMonthHasGames({
        league,
        monthAnchor: nextAnchor,
        timeZone: dayTimeZone,
      }),
    ])
      .then(([hasPrev, hasNext]) => {
        if (!cancelled) {
          setAdjacentMonthHasGames({
            prev: hasPrev,
            next: hasNext,
            loading: false,
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAdjacentMonthHasGames({ prev: true, next: true, loading: false });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [selected, league, dayTimeZone]);

  /* =========================
     today へ戻す（試合のある日のみ。今日以降で最も近い日、なければ最終日）
  ========================= */
  const moveToToday = useCallback(() => {
    if (!gameDaysForStrip.length) return;
    const sorted = [...gameDaysForStrip].sort(
      (a, b) => a.getTime() - b.getTime(),
    );
    const pick =
      sorted.find(
        (d) => toDateKeyInTimeZone(d, dayTimeZone) >= todayKey
      ) ?? sorted[sorted.length - 1];
    if (pick) setSelectedAndSync(pick);
  }, [gameDaysForStrip, todayKey, dayTimeZone, setSelectedAndSync]);

  /* =========================
     Swipe
  ========================= */
  const pageRef = useRef<HTMLDivElement>(null);

  const moveToPrevDay = useCallback(() => {
    if (!selected) return;
    const key = toDateKeyInTimeZone(selected, dayTimeZone);
    const idx = gameDaysForStrip.findIndex(
      (d) => toDateKeyInTimeZone(d, dayTimeZone) === key
    );
    if (idx > 0) setSelectedAndSync(gameDaysForStrip[idx - 1]);
  }, [selected, gameDaysForStrip, dayTimeZone, setSelectedAndSync]);

  const moveToNextDay = useCallback(() => {
    if (!selected) return;
    const key = toDateKeyInTimeZone(selected, dayTimeZone);
    const idx = gameDaysForStrip.findIndex(
      (d) => toDateKeyInTimeZone(d, dayTimeZone) === key
    );
    if (idx >= 0 && idx < gameDaysForStrip.length - 1) {
      setSelectedAndSync(gameDaysForStrip[idx + 1]);
    }
  }, [selected, gameDaysForStrip, dayTimeZone, setSelectedAndSync]);

  usePageSwipe(pageRef, {
    onSwipeRight: moveToPrevDay,
    onSwipeLeft: moveToNextDay,
    lockAxis: "x",
    threshold: 24,
  });

  /* =========================
     Games（選択日の1日分を取得）
  ========================= */
  const { games, loading: loadingDayQuery } = useGamesByDate(
    league,
    selected,
    dayTimeZone,
    !!selected,
  );

  const loading =
    loadingDays ||
    (!!selected && loadingDayQuery);

  const gamesAfterTeamFilter = useMemo(() => {
    const raw = games ?? [];
    if (!teamFilterIds.length) return raw;
    if (
      teamFilterIds.length === 2 &&
      teamFilterMatchMode === "h2h"
    ) {
      return raw.filter((g: Record<string, unknown>) =>
        gameIsHeadToHeadBetween(g, teamFilterIds, nameById),
      );
    }
    return raw.filter((g: Record<string, unknown>) =>
      gameInvolvesAnyTeam(g, teamFilterIds, nameById),
    );
  }, [games, teamFilterIds, teamFilterMatchMode, nameById]);

  const filteredGames = useMemo(() => {
    if (marginMin == null && marginMax == null) return gamesAfterTeamFilter;
    return gamesAfterTeamFilter.filter((g: Record<string, unknown>) =>
      gameMatchesMarginBounds(g, marginMin, marginMax),
    );
  }, [gamesAfterTeamFilter, marginMin, marginMax]);

  const selectedDayKey = useMemo(
    () => (selected ? toDateKeyInTimeZone(selected, dayTimeZone) : ""),
    [selected, dayTimeZone]
  );

  /**
   * Firestore 取得が1フレーム遅れると selected だけ翌日に進み games が前日のまま残る。
   * その間は一覧をローディング扱いにして当日カードのフラッシュを出さない。
   */
  const gamesMatchSelectedDay = useMemo(() => {
    if (!selectedDayKey) return true;
    const g = games ?? [];
    if (g.length === 0) return true;
    return g.every((row: Record<string, unknown>) => {
      const dk = gameRowStartDateKeyInTimeZone(row, dayTimeZone);
      if (dk == null) return true;
      return dk === selectedDayKey;
    });
  }, [games, selectedDayKey, dayTimeZone]);

  const listLoading = loading || !gamesMatchSelectedDay;

  const hasAnyListFilter =
    teamFilterIds.length > 0 || marginMin != null || marginMax != null;

  const scheduleEmptyHint =
    hasAnyListFilter && !listLoading && filteredGames.length === 0
      ? isEn
        ? teamFilterIds.length === 2 && teamFilterMatchMode === "h2h"
          ? "No head-to-head between these teams on this date."
          : teamFilterIds.length > 0
            ? "No games for the selected team(s) on this date."
            : "No games match the score margin range on this date."
        : teamFilterIds.length === 2 && teamFilterMatchMode === "h2h"
          ? "この日は、この2チームの直接対決はありません。"
          : teamFilterIds.length > 0
            ? "この日は、選択したチームの試合がありません。"
            : "この日付では、指定した点差の範囲に合う試合はありません。"
      : null;

  /* =========================
     全試合終了判定
  ========================= */
  const allFinished = useMemo(() => {
    if (!selected) return false;
    if (!games) return false;
    if (games.length === 0) return false;
    return games.every((g: Record<string, unknown>) => {
      return isFinalGameRow(g);
    });
  }, [selected, games]);

  /* =========================
     次の試合日
  ========================= */
  const nextGameDay = useMemo(() => {
    if (!selected) return null;
    const key = toDateKeyInTimeZone(selected, dayTimeZone);
    return (
      gameDaysForStrip.find(
        (d) => toDateKeyInTimeZone(d, dayTimeZone) > key,
      ) ?? null
    );
  }, [gameDaysForStrip, selected, dayTimeZone]);

  /* =========================
     auto advance
  ========================= */
  const didAutoAdvance = useRef<Partial<Record<League, boolean>>>({});

  /** ストリップ上に次の試合日があるときはペイント前に送る（useEffect だと当日が1フレーム残る） */
  useLayoutEffect(() => {
    if (!selected) return;
    if (toDateKeyInTimeZone(selected, dayTimeZone) !== todayKey) return;
    if (!allFinished) return;
    if (didAutoAdvance.current[league]) return;
    if (!nextGameDay) return;

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

  /** ストリップ外の次の試合日だけ非同期で取る（上記 layout では触らない） */
  useEffect(() => {
    if (!selected) return;
    if (toDateKeyInTimeZone(selected, dayTimeZone) !== todayKey) return;
    if (!allFinished) return;
    if (didAutoAdvance.current[league]) return;
    if (nextGameDay) return;

    let cancelled = false;
    fetchNextGameDayAfterLocalDay({
      league,
      timeZone: dayTimeZone,
      day: selected,
    })
      .then((d) => {
        if (cancelled) return;
        didAutoAdvance.current[league] = true;
        if (d) setSelectedAndSync(d);
      })
      .catch(() => {
        if (!cancelled) didAutoAdvance.current[league] = true;
      });

    return () => {
      cancelled = true;
    };
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
     Paths（pagePad より先に必要）
  ========================= */
  const isMobile = Boolean(
    pathname?.startsWith("/mobile") || pathname?.startsWith("/m/")
  );
  /** 試合一覧・ヘッダの入場（`/mobile` 含む。`prefers-reduced-motion` のみオフ） */
  const webGamesMotion = !reduceMotion;

  /* =========================
     UI
  ========================= */
  /** DayStrip の1行に割り当てるマス数（多いほど同時に見える日が増える） */
  const visibleCount = dense ? 6 : 10;
  /** モバイル試合一覧はカード横幅を広げるため左右を詰める */
  const pagePad =
    dense && isMobile ? "px-0" : dense ? "px-3" : "px-4 md:px-6";
  const isInitialLoading = loadingDays || !selected;
  const isSwitchingDate = !!selected && listLoading;
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

  /** 初回だけリッチなリスト入場。日付変更・一定時間後はシンプルに */
  const [playRichScheduleIntro, setPlayRichScheduleIntro] = useState(true);
  const lastScheduleDayKeyRef = useRef<string | null>(null);

  useEffect(() => {
    setPlayRichScheduleIntro(true);
    lastScheduleDayKeyRef.current = null;
  }, [league]);

  useEffect(() => {
    if (!selectedDayKey || isInitialLoading) return;
    const prev = lastScheduleDayKeyRef.current;
    lastScheduleDayKeyRef.current = selectedDayKey;
    if (prev !== null && prev !== selectedDayKey) {
      setPlayRichScheduleIntro(false);
    }
  }, [selectedDayKey, isInitialLoading]);

  useEffect(() => {
    if (isInitialLoading || !selectedDayKey || !playRichScheduleIntro) return;
    const id = window.setTimeout(() => setPlayRichScheduleIntro(false), 900);
    return () => window.clearTimeout(id);
  }, [isInitialLoading, selectedDayKey, playRichScheduleIntro]);

  const richScheduleMotion = playRichScheduleIntro && !reduceMotion;

  /** 一覧の listShellIntro はブロック再マウント時だけ更新（900ms だけ変わると Framer が再入場しがち） */
  const scheduleBlockKey = useMemo(
    () => `${league}|${selectedDayKey}|${teamFilterKey}`,
    [league, selectedDayKey, teamFilterKey],
  );

  const playRichIntroRef = useRef(playRichScheduleIntro);
  playRichIntroRef.current = playRichScheduleIntro;
  const reduceMotionRef = useRef(reduceMotion);
  reduceMotionRef.current = reduceMotion;

  const prevScheduleBlockKeyRef = useRef<string | null>(null);

  const [listShellIntroLocked, setListShellIntroLocked] = useState<
    "page" | "daySwitch"
  >(() => (reduceMotion ? "daySwitch" : "page"));

  useLayoutEffect(() => {
    if (prevScheduleBlockKeyRef.current === scheduleBlockKey) return;
    const prev = prevScheduleBlockKeyRef.current;
    prevScheduleBlockKeyRef.current = scheduleBlockKey;

    const splitKey = (k: string) => k.split("|");
    const prevLeague = prev == null ? null : splitKey(prev)[0];
    const nextParts = splitKey(scheduleBlockKey);
    const nextLeague = nextParts[0];
    const prevDay = prev == null ? null : splitKey(prev)[1] ?? "";
    const nextDay = nextParts[1] ?? "";

    if (prev !== null && prevLeague !== nextLeague) {
      setListShellIntroLocked(reduceMotionRef.current ? "daySwitch" : "page");
      return;
    }
    if (prev !== null && prevDay !== nextDay) {
      setListShellIntroLocked("daySwitch");
      return;
    }

    setListShellIntroLocked(
      playRichIntroRef.current && !reduceMotionRef.current
        ? "page"
        : "daySwitch",
    );
  }, [scheduleBlockKey]);

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
        <motion.div
          initial={webGamesMotion ? { opacity: 0, x: -16 } : false}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            duration: webGamesMotion ? 0.32 : 0,
            ease: GAMES_CYBER_EASE,
          }}
        >
          <LeagueTabs
            value={league}
            onChange={(next) => {
              setLeague(next);
              const params = new URLSearchParams(searchParams.toString());
              params.delete("team");
              params.delete("team_mode");
              params.delete("margin");
              params.delete("margin_min");
              params.delete("margin_max");
              router.replace(`?${params.toString()}`, { scroll: false });
            }}
            size={dense ? "md" : "lg"}
            layoutMobile={isMobile}
          />
        </motion.div>

        <div className="flex shrink-0 items-center gap-2">
          <motion.div
            initial={webGamesMotion ? { opacity: 0, x: 12 } : false}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: webGamesMotion ? 0.28 : 0,
              delay: webGamesMotion ? 0.04 : 0,
              ease: GAMES_CYBER_EASE,
            }}
          >
            <GamesTeamFilterPanel
              teams={teams}
              selectedIds={teamFilterIds}
              onChange={setTeamFilterIds}
              matchMode={teamFilterMatchMode}
              onMatchModeChange={setTeamFilterMatchMode}
              marginMin={marginMin}
              marginMax={marginMax}
              onMarginMinMaxChange={setMarginMinMax}
              onClearAllFilters={clearAllTeamAndMarginFilters}
              dense={dense}
              isEn={isEn}
              layoutMobile={isMobile}
            />
          </motion.div>

          {league === "nba" && (
            <motion.div
              initial={webGamesMotion ? { opacity: 0, x: 18 } : false}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: webGamesMotion ? 0.32 : 0,
                delay: webGamesMotion ? 0.05 : 0,
                ease: GAMES_CYBER_EASE,
              }}
            >
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
            </motion.div>
          )}
        </div>
      </div>

      <motion.div
        initial={webGamesMotion ? { opacity: 0, y: -10, scale: 0.985 } : false}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          duration: webGamesMotion ? 0.34 : 0,
          delay: webGamesMotion ? 0.04 : 0,
          ease: GAMES_CYBER_EASE,
        }}
        className="mb-1"
      >
      <MonthHeader
        month={monthValue}
        onPrev={() => {
          if (!selected) return;
          if (adjacentMonthHasGames.loading || !adjacentMonthHasGames.prev) {
            return;
          }
          setSelectedAndSync(
            shiftCalendarMonthStart(selected, -1, dayTimeZone)
          );
        }}
        onNext={() => {
          if (!selected) return;
          if (adjacentMonthHasGames.loading || !adjacentMonthHasGames.next) {
            return;
          }
          setSelectedAndSync(
            shiftCalendarMonthStart(selected, 1, dayTimeZone)
          );
        }}
        onCenterDoubleClick={moveToToday}
        canPrev={adjacentMonthHasGames.prev}
        canNext={adjacentMonthHasGames.next}
        navBusy={adjacentMonthHasGames.loading}
        centerDisabled={!gameDaysForStrip.length}
        timeZone={dayTimeZone}
        isEn={isEn}
        className="mb-0"
      />
      </motion.div>

{isInitialLoading ? (
  <>
    <div className="mb-2">
      <div className="h-14 rounded-2xl border border-white/10 bg-white/5 animate-pulse" />
    </div>

    <div
      className={
        dense && isMobile
          ? "grid gap-2.5 px-0"
          : "grid gap-6 px-4 md:px-6 lg:px-8"
      }
    >
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  </>
) : (
  <>
    <motion.div
      key={`day-strip-${league}-${teamFilterKey}`}
      className="mb-2"
      initial={webGamesMotion ? { opacity: 0 } : false}
      animate={{ opacity: 1 }}
      transition={{
        duration: webGamesMotion ? 0.24 : 0,
        delay: webGamesMotion ? 0.06 : 0,
        ease: GAMES_CYBER_EASE,
      }}
    >
      <DayStrip
        dates={gameDaysForStrip}
        selectedDate={selected}
        onSelect={setSelectedAndSync}
        size={dense ? "md" : "lg"}
        visibleCount={visibleCount}
        autoScrollOnInit={false}
        snapSelectOnScroll={isMobile}
        timeZone={dayTimeZone}
        a11yLocale={isEn ? "en-US" : "ja-JP"}
        wideItemGap={isMobile}
        compactWebGap={!isMobile}
      />
    </motion.div>

    <motion.div
      key={`sched-${scheduleBlockKey}`}
      initial={
        webGamesMotion
          ? richScheduleMotion
            ? { opacity: 0, y: 10 }
            : { opacity: 0 }
          : false
      }
      animate={
        webGamesMotion
          ? richScheduleMotion
            ? { opacity: 1, y: 0 }
            : { opacity: 1 }
          : { opacity: 1 }
      }
      transition={
        webGamesMotion
          ? richScheduleMotion
            ? {
                duration: GAMES_SCHEDULE_SHELL_DURATION_SEC,
                delay: GAMES_LIST_AFTER_DAY_STRIP_SEC,
                ease: GAMES_CYBER_EASE,
              }
            : {
                duration: 0.46,
                delay: 0.06,
                ease: GAMES_DAY_SWITCH_EASE,
              }
          : { duration: 0 }
      }
    >
      <div
        className={[
          "transition-opacity duration-300 ease-out",
          isSwitchingDate ? "opacity-85" : "opacity-100",
        ].join(" ")}
      >
        <ScheduleList
          games={filteredGames}
          extraPeerGamesForSeriesInference={peerRowsForSeriesInference}
          dense={dense}
          loading={listLoading}
          league={league}
          emptyHint={scheduleEmptyHint}
          listShellIntro={listShellIntroLocked}
        />
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