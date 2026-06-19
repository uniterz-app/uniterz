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
import GamesDrawerMenu from "./GamesDrawerMenu";
import SideMenuDrawer from "@/app/component/common/SideMenuDrawer";
import CyberMenuButton from "@/app/component/ui/CyberMenuButton";
import {
  gamesHeaderControlButtonClass,
  gamesHeaderControlHeightClass,
  gamesHeaderControlWrapClass,
  gamesHeaderFilterWrapClass,
  gamesHeaderMenuButtonSize,
  gamesHeaderMobileShellClass,
  gamesHeaderMobileSideLeftClass,
  gamesHeaderMobileSideRightClass,
  gamesHeaderMobileTitleRowClass,
  gamesHeaderDesktopSideLeftClass,
  gamesHeaderDesktopSideRightClass,
  gamesHeaderRowClass,
  gamesHeaderShellClass,
  gamesHeaderTitleCenterClass,
} from "@/lib/ui/gamesHeaderBar";
import { RankingsPageTitleCyber } from "@/app/component/rankings/RankingsPageTitleCyber";
import { LEAGUE_DISPLAY } from "@/lib/leagues";
import GamesTeamFilterPanel from "./GamesTeamFilterPanel";
import MonthHeader from "./MonthHeader";
import DayStrip from "./DayStrip";
import ScheduleList from "./ScheduleList";
import usePageSwipe from "./usePageSwipe";
import { gameRowStartDateKeyInTimeZone } from "./useGamesByDate";
import { useGameDays, monthRowsToSortedGameDays } from "./useGameDays";
import { auth } from "@/lib/firebase";
import type { League } from "@/lib/leagues";
import { useUserPreferredLeague } from "@/lib/hooks/useUserPreferredLeague";
import { preferredLeagueToGamesLeague } from "@/lib/user/preferredLeague";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { loadPlayoffBracket } from "@/lib/playoff-bracket-firestore";
import { getCurrentPlayoffSeason } from "@/lib/playoff-bracket-config";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import { t } from "@/lib/i18n/t";
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
import {
  markWcGamesTabAnnouncementSeen,
  readWcGamesTabAnnouncementSeen,
} from "@/lib/games/wcTabAnnouncementSeen";
import {
  fetchNextGameDayAfterLocalDay,
  fetchPreviousGameDayBeforeLocalDay,
} from "@/lib/games/fetchNextGameDayAfter";
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
  /** 入場アニメが万一途中で止まっても、一定時間後は強制的に表示する保険 */
  const [entryAnimationsExpired, setEntryAnimationsExpired] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setEntryAnimationsExpired(true), 1400);
    return () => window.clearTimeout(id);
  }, []);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const season = searchParams.get("season") ?? getCurrentPlayoffSeason();
  const dateParam = searchParams.get("date");

  const { fUser: user } = useFirebaseUser();
  const { language } = useUserLanguage(user?.uid ?? null);
  const m = t(language);
  const dayTimeZone = language === "en" ? TIMEZONE_ET : TIMEZONE_JST;

  /* =========================
     League
  ========================= */
  const [league, setLeague] = useState<League>("wc");
  const [gamesDrawerOpen, setGamesDrawerOpen] = useState(false);
  const [showWcTabBadge, setShowWcTabBadge] = useState(false);
  const didInitLeague = useRef(false);
  const { preferredLeague, ready: preferredLeagueReady } =
    useUserPreferredLeague(user?.uid);

  useEffect(() => {
    setShowWcTabBadge(!readWcGamesTabAnnouncementSeen());
  }, []);

  const dismissWcTabBadge = useCallback(() => {
    markWcGamesTabAnnouncementSeen();
    setShowWcTabBadge(false);
  }, []);

  useEffect(() => {
    if (league !== "wc") return;
    dismissWcTabBadge();
  }, [league, dismissWcTabBadge]);

  useEffect(() => {
    if (didInitLeague.current || !preferredLeagueReady) return;
    didInitLeague.current = true;
    if (preferredLeague) {
      setLeague(preferredLeagueToGamesLeague(preferredLeague));
    }
  }, [preferredLeague, preferredLeagueReady]);

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

  /** 初回マウント時の URL ?date= を初期選択日の種に使う（以後はユーザー操作が優先） */
  const initialDateParamRef = useRef(dateParam);
  const initialDateParamDay = useMemo(
    () =>
      initialDateParamRef.current
        ? parseDateKeyInTimeZone(initialDateParamRef.current, dayTimeZone)
        : null,
    [dayTimeZone]
  );

  /** 日付ストリップ・暦月の試合一括取得の基準日：選択中 → URL date → 今日 */
  const anchorForGameDays = useMemo(() => {
    const stored = selectedByLeague[league];
    if (stored) return stored;
    if (initialDateParamDay) return initialDateParamDay;
    return parseDateKeyInTimeZone(todayKey, dayTimeZone) ?? new Date();
  }, [dayTimeZone, league, selectedByLeague, todayKey, initialDateParamDay]);

  /* =========================
     Game days（アンカー日の暦日±10日を取得しストリップ用）
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
      stateSelected: stored ?? initialDateParamDay,
      todayKey,
      timeZone: dayTimeZone,
    });
  }, [
    gameDaysForStrip,
    selectedByLeague,
    league,
    todayKey,
    dayTimeZone,
    initialDateParamDay,
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
     Games（選択日の1日分は取得済みウィンドウから導出）
     useGameDays が取得済みの monthRows を選択日でフィルタするだけにして、
     1日分の追加クエリ（旧 useGamesByDate）による初回表示の二重待ちを解消する。
  ========================= */
  const selectedDayKey = useMemo(
    () => (selected ? toDateKeyInTimeZone(selected, dayTimeZone) : ""),
    [selected, dayTimeZone]
  );

  const games = useMemo(() => {
    if (!selectedDayKey) return [];
    return monthRows.filter((row) => {
      const dk = gameRowStartDateKeyInTimeZone(
        row as { startAtJst?: unknown },
        dayTimeZone
      );
      return dk === selectedDayKey;
    });
  }, [monthRows, selectedDayKey, dayTimeZone]);

  const loading = loadingDays;

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

  /**
   * games は selectedDayKey で絞り込んだ取得済みウィンドウなので、
   * 表示遅延はウィンドウ取得（loadingDays）のみで判定すれば足りる。
   */
  const listLoading = loading;
  const didResolveEmptyDayRef = useRef<Partial<Record<League, string>>>({});

  const hasAnyListFilter =
    teamFilterIds.length > 0 || marginMin != null || marginMax != null;

  const scheduleEmptyHint =
    hasAnyListFilter && !listLoading && filteredGames.length === 0
      ? teamFilterIds.length === 2 && teamFilterMatchMode === "h2h"
        ? m.games.noH2hOnDate
        : teamFilterIds.length > 0
          ? m.games.noTeamGamesOnDate
          : m.games.noMarginGamesOnDate
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

  /**
   * 今日に試合が無く、かつ近傍ウィンドウ（±10日）にも試合が無いときは
   * 次の試合日へ、無ければ直近の過去試合日へ自動ジャンプする。
   */
  useEffect(() => {
    if (loadingDays) return;
    if (!selected) return;
    if ((games?.length ?? 0) > 0) return;
    if (gameDaysForStrip.length > 0) return;

    const currentKey = toDateKeyInTimeZone(selected, dayTimeZone);
    if (didResolveEmptyDayRef.current[league] === currentKey) return;
    didResolveEmptyDayRef.current[league] = currentKey;

    let cancelled = false;
    (async () => {
      try {
        const next = await fetchNextGameDayAfterLocalDay({
          league,
          timeZone: dayTimeZone,
          day: selected,
        });
        if (cancelled) return;
        if (next) {
          setSelectedAndSync(next);
          return;
        }

        const prev = await fetchPreviousGameDayBeforeLocalDay({
          league,
          timeZone: dayTimeZone,
          day: selected,
        });
        if (cancelled) return;
        if (prev) setSelectedAndSync(prev);
      } catch {
        // no-op: fallback jump failure should not break page rendering
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    loadingDays,
    selected,
    games,
    gameDaysForStrip.length,
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
  /** 試合一覧・ヘッダの入場（`prefers-reduced-motion` か、保険タイマー満了でオフ） */
  const webGamesMotion = !reduceMotion && !entryAnimationsExpired;

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

  /**
   * listShellIntro はレンダー中に同期的に確定する。
   * state + useLayoutEffect だと 1 レンダー遅れるため、scheduleBlockKey が変わった
   * フレームでは新しい ScheduleList が「古いモード」でマウントされ、直後に切り替わって
   * カード本体（MatchCard の opacity アニメ）が打ち切られ opacity:0 で固着する。
   * ref で前回キーを覚え、キーが変わったレンダーでそのまま新モードを返す。
   */
  const prevScheduleBlockKeyRef = useRef<string | null>(null);
  const lockedIntroRef = useRef<"page" | "daySwitch">(
    reduceMotion ? "daySwitch" : "page",
  );

  if (prevScheduleBlockKeyRef.current !== scheduleBlockKey) {
    const prev = prevScheduleBlockKeyRef.current;
    prevScheduleBlockKeyRef.current = scheduleBlockKey;

    const splitKey = (k: string) => k.split("|");
    const prevLeague = prev == null ? null : splitKey(prev)[0];
    const nextParts = splitKey(scheduleBlockKey);
    const nextLeague = nextParts[0];
    const prevDay = prev == null ? null : splitKey(prev)[1] ?? "";
    const nextDay = nextParts[1] ?? "";

    if (prev !== null && prevLeague !== nextLeague) {
      lockedIntroRef.current = reduceMotion ? "daySwitch" : "page";
    } else if (prev !== null && prevDay !== "" && prevDay !== nextDay) {
      // 実日付→別の実日付は「日付切替」。
      // 初回の selectedDayKey 未確定（""）→ 初日確定は除外（初回入場の page を維持）。
      lockedIntroRef.current = "daySwitch";
    } else {
      lockedIntroRef.current =
        playRichScheduleIntro && !reduceMotion ? "page" : "daySwitch";
    }
  }

  const listShellIntroLocked = lockedIntroRef.current;

  /** 上部バー共通：スライド＋着地時に一瞬明滅する「ロックオン」入場 */
  const topBarEntry = (delay: number, dx: number) =>
    webGamesMotion
      ? {
          initial: { opacity: 0, x: dx },
          animate: { opacity: [0, 1, 0.5, 1], x: 0 },
          transition: {
            x: { duration: 0.3, delay, ease: GAMES_CYBER_EASE },
            opacity: {
              duration: 0.4,
              delay,
              times: [0, 0.5, 0.66, 1] as number[],
              ease: "linear" as const,
            },
          },
        }
      : { initial: false as const, animate: { opacity: 1, x: 0 } };

  const renderFilterControl = (headerMobile: boolean) => (
    <motion.div
      className={gamesHeaderFilterWrapClass(headerMobile)}
      {...topBarEntry(0.18, 14)}
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
        dense={dense || isMobile}
        compactHeader={headerMobile}
        language={language}
        layoutMobile={isMobile}
      />
    </motion.div>
  );

  const renderBracketControl = (headerMobile: boolean) =>
    league === "nba" ? (
      <motion.div
        className={gamesHeaderControlWrapClass(headerMobile)}
        {...topBarEntry(0.27, 18)}
      >
        <button
          type="button"
          onClick={handleBracketClick}
          style={bracketMarketTeamTypography(isMobile)}
          className={[
            gamesHeaderControlButtonClass(headerMobile),
            "border border-[#1f6feb]/35 bg-[#1f6feb]/12 font-bold uppercase tracking-normal text-[#6ea8ff] transition hover:bg-[#1f6feb]/18",
            headerMobile
              ? "px-2.5 text-[10px] leading-none"
              : dense
                ? "rounded-lg px-3 text-sm"
                : "rounded-xl px-4 text-base",
          ].join(" ")}
        >
          Bracket
        </button>
      </motion.div>
    ) : null;

  const monthHeaderMotion = webGamesMotion
    ? {
        initial: { opacity: 0, y: -10 } as const,
        animate: { opacity: [0, 1, 0.5, 1], y: 0 },
        transition: {
          y: { duration: 0.34, delay: 0.38, ease: GAMES_CYBER_EASE },
          opacity: {
            duration: 0.44,
            delay: 0.38,
            times: [0, 0.5, 0.66, 1] as number[],
            ease: "linear" as const,
          },
        },
      }
    : { initial: false as const, animate: { opacity: 1, y: 0 } };

  const renderMenuButton = () => (
    <motion.div
      className="flex items-center justify-center"
      {...topBarEntry(0, -10)}
    >
      <CyberMenuButton
        size={gamesHeaderMenuButtonSize(isMobile)}
        className={gamesHeaderControlHeightClass(isMobile)}
        onClick={() => setGamesDrawerOpen(true)}
        aria-label={m.games.openMenu}
        badge={
          showWcTabBadge ? (
            <span
              className="pointer-events-none absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[10px] font-black leading-none text-amber-950 shadow-[0_0_10px_rgba(251,191,36,0.5)]"
              aria-hidden
            >
              !
            </span>
          ) : null
        }
      />
    </motion.div>
  );

  const renderLeagueTitle = () => (
    <motion.div
      className="flex min-w-0 justify-center"
      initial={webGamesMotion ? { opacity: 0 } : false}
      animate={
        webGamesMotion ? { opacity: [0, 1, 0.55, 1] } : { opacity: 1 }
      }
      transition={
        webGamesMotion
          ? {
              opacity: {
                duration: 0.46,
                delay: 0.09,
                times: [0, 0.5, 0.66, 1],
                ease: "linear",
              },
            }
          : { duration: 0 }
      }
    >
      <RankingsPageTitleCyber
        variant="horizon-chrome"
        title={(LEAGUE_DISPLAY[league] ?? "GAMES").toUpperCase()}
        size="sm"
      />
    </motion.div>
  );

  const renderMonthHeader = () => (
    <MonthHeader
      month={monthValue}
      onPrev={() => {
        if (!selected) return;
        if (adjacentMonthHasGames.loading || !adjacentMonthHasGames.prev) {
          return;
        }
        setSelectedAndSync(
          shiftCalendarMonthStart(selected, -1, dayTimeZone),
        );
      }}
      onNext={() => {
        if (!selected) return;
        if (adjacentMonthHasGames.loading || !adjacentMonthHasGames.next) {
          return;
        }
        setSelectedAndSync(
          shiftCalendarMonthStart(selected, 1, dayTimeZone),
        );
      }}
      onCenterDoubleClick={moveToToday}
      canPrev={adjacentMonthHasGames.prev}
      canNext={adjacentMonthHasGames.next}
      navBusy={adjacentMonthHasGames.loading}
      centerDisabled={!gameDaysForStrip.length}
      timeZone={dayTimeZone}
      language={language}
      gamesHeaderAlign={isMobile}
      gamesHeaderStack={false}
      className="mb-0 w-full"
    />
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
      <div className={gamesHeaderShellClass(isMobile)}>
        {isMobile ? (
          <div className={gamesHeaderMobileShellClass()}>
            <div className={gamesHeaderMobileTitleRowClass()}>
              <div className={gamesHeaderMobileSideLeftClass()}>
                {renderMenuButton()}
              </div>
              <div className={gamesHeaderTitleCenterClass(true)}>
                {renderLeagueTitle()}
              </div>
              <div className={gamesHeaderMobileSideRightClass()}>
                {renderFilterControl(true)}
                {renderBracketControl(true)}
              </div>
            </div>
            <motion.div className="w-full" {...monthHeaderMotion}>
              {renderMonthHeader()}
            </motion.div>
          </div>
        ) : (
          <>
            <div className={gamesHeaderRowClass(false)}>
              <div className={gamesHeaderDesktopSideLeftClass()}>
                {renderMenuButton()}
              </div>
              <div className={gamesHeaderTitleCenterClass(false)}>
                {renderLeagueTitle()}
              </div>
              <div className={gamesHeaderDesktopSideRightClass()}>
                {renderFilterControl(false)}
                {renderBracketControl(false)}
              </div>
            </div>
            <motion.div className="w-full" {...monthHeaderMotion}>
              {renderMonthHeader()}
            </motion.div>
          </>
        )}
      </div>

      {isInitialLoading ? (
  <>
    <div className="mb-2">
      <div className="h-14 rounded-2xl border border-white/10 bg-white/5 skeleton-scan" />
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
      initial={webGamesMotion ? { opacity: 0, x: -12 } : false}
      animate={
        webGamesMotion
          ? { opacity: [0, 1, 0.55, 1], x: 0 }
          : { opacity: 1, x: 0 }
      }
      transition={
        webGamesMotion
          ? {
              x: { duration: 0.3, delay: 0.24, ease: GAMES_CYBER_EASE },
              opacity: {
                duration: 0.4,
                delay: 0.24,
                times: [0, 0.5, 0.66, 1],
                ease: "linear",
              },
            }
          : { duration: 0 }
      }
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
        a11yLocale={language === "en" ? "en-US" : "ja-JP"}
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

      <SideMenuDrawer
        open={gamesDrawerOpen}
        onClose={() => setGamesDrawerOpen(false)}
        variant={isMobile ? "mobile" : "web"}
      >
        <GamesDrawerMenu
          variant={isMobile ? "mobile" : "web"}
          language={language}
          league={league}
          showWcNewBadge={showWcTabBadge}
          onSelectNba={() => {
            didInitLeague.current = true;
            setLeague("nba");
            const params = new URLSearchParams(searchParams.toString());
            params.delete("team");
            params.delete("team_mode");
            params.delete("margin");
            params.delete("margin_min");
            params.delete("margin_max");
            router.replace(`?${params.toString()}`, { scroll: false });
            setGamesDrawerOpen(false);
          }}
          onSelectWorldCup={() => {
            dismissWcTabBadge();
            didInitLeague.current = true;
            setLeague("wc");
            const params = new URLSearchParams(searchParams.toString());
            params.delete("team");
            params.delete("team_mode");
            params.delete("margin");
            params.delete("margin_min");
            params.delete("margin_max");
            router.replace(`?${params.toString()}`, { scroll: false });
            setGamesDrawerOpen(false);
          }}
        />
      </SideMenuDrawer>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="skeleton-scan rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mx-auto mb-3 h-4 w-40 rounded bg-white/10" />
    </div>
  );
}