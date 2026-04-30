import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  query,
  where,
  limit,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { LinearGradient } from "expo-linear-gradient";
import { colors, radius, spacing, typography } from "../../theme/tokens";
import { TIMEZONE_JST, toDateKeyInTimeZone } from "../../utils/date";
import {
  resolveGameLiveMeta,
  resolveGameScore,
  resolveGameStartAt,
  resolveGameStatus,
  resolveGameTeamName,
} from "../../shared/gameRow";
import { splitTeamNameByLeague, getTeamAlias } from "../../utils/teamName";
import { auth, db } from "../../lib/firebase";
import { useFirebaseUser } from "../../auth/FirebaseUserProvider";
import {
  type NativeGameRow,
  type SupportedLeague,
  useTodayGames,
} from "./useTodayGames";
import {
  resolveTeamJerseyPalette,
  resolveTeamPrimaryColor,
} from "./teamColors";
import PredictModal, { type PredictModalMatchPreview } from "./PredictModal";
import type { PredictHeroFromRect } from "./predictHeroTransition";
import PredictNextGameNativeModal from "./PredictNextGameNativeModal";
import GameDetailModal from "./GameDetailModal";
import {
  readPredictNextGameModalSkip,
  writePredictNextGameModalSkip,
} from "./predictNextGameModalPrefs";
import GameCardList from "./GameCardList";
import {
  resolveNativeSeriesLabel,
  resolveNativeSeriesPair,
} from "./resolveNativeSeriesStanding";
import BrandCyanLineAnimated from "./BrandCyanLineAnimated";
import { getGamesTexts } from "./gamesI18n";
import type { GameCardCenterBlock } from "./gameCardCenterTypes";
import { formatTeamRecordForCard } from "./teamRecordDisplay";
import { useTeamRecordMap } from "./useTeamRecordMap";

function formatKickoffTime(
  startAt: Date | null,
  language: "ja" | "en"
): string {
  if (!startAt) return "--:--";
  const timeZone = language === "en" ? "America/New_York" : "Asia/Tokyo";
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(startAt);
  const hour = parts.find((part) => part.type === "hour")?.value ?? "00";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "00";
  return `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
}

function resolveFinalMetaOt(raw: Record<string, unknown>): boolean {
  const fm = raw.finalMeta as { ot?: boolean } | undefined;
  return Boolean(fm?.ot);
}

/**
 * MobileMatchCard / MatchCardWeb の中央欄：スコア or キックオフ・LIVE/終了サブ
 */
function getGameCardCenterBlock(
  game: Record<string, unknown>,
  language: "ja" | "en"
): GameCardCenterBlock {
  const status = resolveGameStatus(game);
  const score = resolveGameScore(game);
  const startAt = resolveGameStartAt(game);
  if (status === "final" && score) {
    const ot = resolveFinalMetaOt(game);
    const sub = `${language === "en" ? "Final" : "試合終了"}${
      ot ? " (OT)" : ""
    }`;
    return { variant: "score", home: score.home, away: score.away, subLine: sub };
  }
  if (status === "live" && score) {
    return {
      variant: "score",
      home: score.home,
      away: score.away,
      subLine: renderLiveMetaLabel(game),
    };
  }
  return {
    variant: "time",
    time: formatKickoffTime(startAt, language),
  };
}

function renderCenterText(
  game: Record<string, unknown>,
  language: "ja" | "en"
): string {
  const b = getGameCardCenterBlock(game, language);
  if (b.variant === "score") {
    return `${b.home} – ${b.away}`;
  }
  return b.time;
}

function isSoccerLeague(leagueRaw: unknown): boolean {
  const league = String(leagueRaw ?? "").toLowerCase();
  return league === "pl" || league === "j1";
}

function renderStatusLabel(
  game: Record<string, unknown>,
  language: "ja" | "en"
): string {
  const status = resolveGameStatus(game);
  if (status === "final") return language === "en" ? "Final" : "試合終了";
  if (status === "live") return language === "en" ? "Live" : "試合中";
  return language === "en" ? "Scheduled" : "試合予定";
}

function renderWinnerLabel(
  winner: "home" | "away" | "draw",
  leagueRaw: unknown
): string {
  if (winner === "home") return "HOME";
  if (winner === "away") return "AWAY";
  if (isSoccerLeague(leagueRaw)) return "DRAW";
  return "DRAW";
}


function parseTimestampLike(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof (value as { toDate?: () => Date }).toDate === "function") {
    const d = (value as { toDate: () => Date }).toDate();
    return d instanceof Date && !Number.isNaN(d.getTime()) ? d : null;
  }
  if (typeof value === "number" || typeof value === "string") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function formatDateTimeJst(value: unknown): string {
  const date = parseTimestampLike(value);
  if (!date) return "-";
  return date.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
}

function toCompactTeamName(
  leagueRaw: unknown,
  rawName: string
): string {
  const league = String(leagueRaw ?? "").toLowerCase();
  const normalize = (value: string) => value.replace(/\s+/g, " ").trim();
  const toUnifiedLabel = (value: string) => normalize(value).toLocaleUpperCase("en-US");
  if (league === "pl") return toUnifiedLabel(getTeamAlias(rawName) ?? rawName);
  if (league === "nba") {
    const normalized = normalize(rawName);
    const nbaLabel = normalized.split(" ").filter(Boolean).slice(-1)[0] ?? normalized;
    return toUnifiedLabel(nbaLabel);
  }
  if (league === "bj" || league === "j1") {
    const [line1, line2] = splitTeamNameByLeague(
      league as "nba" | "bj" | "j1",
      rawName
    );
    return toUnifiedLabel(`${line1} ${line2}`.trim());
  }
  return toUnifiedLabel(rawName);
}

function renderLiveMetaLabel(game: Record<string, unknown>): string | null {
  if (resolveGameStatus(game) !== "live") return null;
  const meta = resolveGameLiveMeta(game);
  if (!meta) return null;
  if (meta.period && meta.runningTime) return `${meta.period} ${meta.runningTime}`;
  return meta.period ?? meta.runningTime ?? null;
}

function formatCountdownLabel(startAt: Date, nowMs: number): string {
  const diffMs = startAt.getTime() - nowMs;
  if (diffMs <= 0) return "まもなく開始";
  const totalSec = Math.floor(diffMs / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}時間${m}分${s}秒`;
  if (m > 0) return `${m}分${s}秒`;
  return `${s}秒`;
}

const LEAGUE_OPTIONS: Array<{ id: SupportedLeague; label: string }> = [
  { id: "nba", label: "NBA" },
  { id: "bj", label: "B1" },
  { id: "j1", label: "J1" },
  { id: "pl", label: "PL" },
];
const LEAGUE_LINE_COLOR: Record<SupportedLeague, string> = {
  nba: "#60a5fa",
  bj: "#eab308",
  j1: "#22c55e",
  pl: "#a855f7",
};
const SKELETON_ROWS = [0, 1, 2];
const DISPLAY_FONT_FAMILY = Platform.select({
  ios: "BebasNeue_400Regular",
  android: "BebasNeue_400Regular",
  default: "BebasNeue_400Regular",
});
const NUMERIC_FONT_FAMILY = Platform.select({
  ios: "Oxanium_700Bold",
  android: "Oxanium_700Bold",
  default: "Oxanium_700Bold",
});
function draftStorageKey(userId: string, gameId: string): string {
  return `predictDraft:${userId}:${gameId}`;
}

/**
 * モバイルWeb `findNextUnpredictedScheduledGameInList` 相当：同一リーグ・scheduled ・未予想
 */
function findNextUnpredictedGame(
  currentGameId: string,
  currentLeague: string,
  games: Array<Record<string, unknown>>,
  predictedIds: Set<string>
): Record<string, unknown> | null {
  const leagueKey = String(currentLeague ?? "").toLowerCase();
  const sorted = [...games].sort((a, b) => {
    const aStart = resolveGameStartAt(a)?.getTime() ?? 0;
    const bStart = resolveGameStartAt(b)?.getTime() ?? 0;
    return aStart - bStart;
  });
  const idx = sorted.findIndex((g) => String(g.id ?? "") === currentGameId);
  if (idx < 0) return null;
  for (let i = idx + 1; i < sorted.length; i += 1) {
    const game = sorted[i];
    if (!game) continue;
    if (String(game.league ?? "").toLowerCase() !== leagueKey) continue;
    if (resolveGameStatus(game) !== "scheduled") continue;
    const gid = String(game.id ?? "");
    if (!gid) continue;
    if (predictedIds.has(gid)) continue;
    if (isGameStarted(game)) continue;
    return game;
  }
  return null;
}

function isGameStarted(game: Record<string, unknown>): boolean {
  const status = resolveGameStatus(game);
  if (status === "live" || status === "final") return true;
  const startAt = resolveGameStartAt(game);
  if (!startAt) return false;
  return Date.now() >= startAt.getTime();
}

function resolveLeagueColor(leagueRaw: unknown): string {
  const league = String(leagueRaw ?? "").toLowerCase() as SupportedLeague;
  if (league in LEAGUE_LINE_COLOR) {
    return LEAGUE_LINE_COLOR[league];
  }
  return "#60a5fa";
}

function startOfLocalDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(base: Date, offset: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + offset);
  return d;
}

function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function GamesHomeScreen({
  bottomReserveY = 0,
}: {
  /** フローティング下部ナビと被らないよう確保する余白（App.tsx から注入） */
  bottomReserveY?: number;
}) {
  const { fUser } = useFirebaseUser();
  const mainScrollRef = useRef<ScrollView | null>(null);
  const skipAutoAdvanceRef = useRef(false);
  const suppressAutoAdvanceForTodayRef = useRef(false);
  const [selectedGame, setSelectedGame] = useState<Record<string, unknown> | null>(
    null
  );
  const [isPredictModalOpen, setIsPredictModalOpen] = useState(false);
  /** 一覧カード measure → 予想プレビューへのヒーロー遷移用 */
  const [predictHeroFromRect, setPredictHeroFromRect] =
    useState<PredictHeroFromRect | null>(null);
  /** 試合終了・未投稿で開くモバイル Web オーバーレイ相当（スコア入力なし） */
  const [predictSpectatorFinalOnly, setPredictSpectatorFinalOnly] = useState(false);
  /** 新規投稿直後：Web の PredictNextGameModal 相当 */
  const [nextGameAfterPost, setNextGameAfterPost] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [winner, setWinner] = useState<"home" | "away" | "draw" | null>(null);
  const [predictToolsTab, setPredictToolsTab] = useState<
    null | "h2h" | "market" | "stats"
  >(null);
  const [scoreHome, setScoreHome] = useState("");
  const [scoreAway, setScoreAway] = useState("");
  const [predictSubmitting, setPredictSubmitting] = useState(false);
  const [predictedGameIds, setPredictedGameIds] = useState<Set<string>>(new Set());
  const [myPostIdByGameId, setMyPostIdByGameId] = useState<Record<string, string>>({});
  const [myPredictionByGameId, setMyPredictionByGameId] = useState<
    Record<
      string,
      {
        winner: "home" | "away" | "draw";
        score: { home: number; away: number };
        comment: string;
        updatedAt?: unknown;
      }
    >
  >({});
  const [myPredictionsReloadNonce, setMyPredictionsReloadNonce] = useState(0);
  const [countdownNowMs, setCountdownNowMs] = useState(() => Date.now());
  const [userDisplayName, setUserDisplayName] = useState("");
  const [language, setLanguage] = useState<"ja" | "en">("ja");
  const {
    loading,
    error,
    games,
    peerGamesForSeries,
    dateKeysWithGames,
    selectedDate,
    setSelectedDate,
    selectedLeague,
    setSelectedLeague,
    goPrevDay,
    goNextDay,
  } = useTodayGames();
  const teamRecordById = useTeamRecordMap(games, selectedLeague);
  const formatSideRecord = useCallback(
    (side: unknown) => formatTeamRecordForCard(side, teamRecordById),
    [teamRecordById]
  );
  const resolveSeriesLabelForList = useCallback(
    (game: Record<string, unknown>) =>
      resolveNativeSeriesLabel(game, peerGamesForSeries),
    [peerGamesForSeries]
  );
  const resolveSeriesPairForList = useCallback(
    (game: Record<string, unknown>) =>
      resolveNativeSeriesPair(game, peerGamesForSeries),
    [peerGamesForSeries]
  );
  /** 予想モーダル先頭：試合カード相当（予想する押下後も最上段に留める） */
  const predictModalMatchPreview = useMemo((): PredictModalMatchPreview | null => {
    if (!selectedGame) return null;
    const g = selectedGame;
    const homeName = resolveGameTeamName(g.home, g.homeTeamName, "HOME");
    const awayName = resolveGameTeamName(g.away, g.awayTeamName, "AWAY");
    const homeCompact = toCompactTeamName(g.league, homeName);
    const awayCompact = toCompactTeamName(g.league, awayName);
    const homeRecord = formatSideRecord(g.home);
    const awayRecord = formatSideRecord(g.away);
    const centerBlock = getGameCardCenterBlock(g, language);
    const seriesLabel = resolveNativeSeriesLabel(g, peerGamesForSeries);
    const seriesPair = resolveNativeSeriesPair(g, peerGamesForSeries);
    const roundLabelRaw = g.roundLabel;
    const roundLabel =
      typeof roundLabelRaw === "string" && roundLabelRaw.trim()
        ? roundLabelRaw.trim()
        : null;
    const homePalette = resolveTeamJerseyPalette(g.league, g.home, "#ff6b8a");
    const awayPalette = resolveTeamJerseyPalette(g.league, g.away, "#5aa4ff");
    return {
      roundLabel,
      homeCompact,
      awayCompact,
      homeRecord,
      awayRecord,
      centerBlock,
      seriesLabel,
      seriesPair,
      homePalette,
      awayPalette,
    };
  }, [selectedGame, language, formatSideRecord, peerGamesForSeries]);
  const formatGameDateMs = useCallback(
    (ms: number) =>
      new Date(ms).toLocaleString(language === "en" ? "en-US" : "ja-JP", {
        timeZone: "Asia/Tokyo",
      }),
    [language]
  );
  const predictModalData = useMemo(() => {
    if (!selectedGame || !selectedGame.id) return null;
    const row: NativeGameRow = {
      ...selectedGame,
      id: String(selectedGame.id),
    } as NativeGameRow;
    return {
      gameId: String(selectedGame.id),
      league: selectedLeague,
      language,
      subjectGame: row,
      peerGames: peerGamesForSeries,
      formatGameDateMs,
      isSoccerLeague: isSoccerLeague(selectedLeague),
    };
  }, [selectedGame, selectedLeague, language, peerGamesForSeries, formatGameDateMs]);
  const today = useMemo(() => startOfLocalDay(new Date()), []);
  const mainScrollContentStyle = useMemo(
    () => [styles.mainScrollContent, { paddingBottom: spacing.sm + bottomReserveY }],
    [bottomReserveY]
  );
  const dayStripDates = useMemo(() => {
    const center = startOfLocalDay(selectedDate);
    const days: Date[] = [];
    for (let i = -3; i <= 2; i += 1) {
      days.push(addDays(center, i));
    }
    const keys = new Set(dateKeysWithGames);
    const filtered = days.filter((day) => keys.has(toDateKeyInTimeZone(day, TIMEZONE_JST)));
    // 取得直後などに空表示にならないよう、最低1件は選択日を表示する
    return filtered.length > 0 ? filtered : [center];
  }, [selectedDate, dateKeysWithGames]);
  const monthLabel = useMemo(
    () => {
      if (language === "ja") {
        const y = selectedDate.getFullYear();
        const m = selectedDate.getMonth() + 1;
        return `${y}年 ${m}月`;
      }
      return selectedDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
      });
    },
    [selectedDate, language]
  );
  const selectedLeagueOption = useMemo(
    () => LEAGUE_OPTIONS.find((option) => option.id === selectedLeague) ?? LEAGUE_OPTIONS[0],
    [selectedLeague]
  );
  const [didAutoAdvanceToday, setDidAutoAdvanceToday] = useState(false);
  const selectedGameId = String(selectedGame?.id ?? "");
  const isEditingPrediction = Boolean(myPostIdByGameId[selectedGameId]);
  const isGameDetailModalVisible = selectedGame != null && !isPredictModalOpen;

  const gameIdSet = useMemo(
    () => new Set(games.map((g) => String(g.id ?? "")).filter(Boolean)),
    [games]
  );
  const isSoccerPredict =
    String(selectedGame?.league ?? "").toLowerCase() === "pl" ||
    String(selectedGame?.league ?? "").toLowerCase() === "j1";

  const predictModalHomeLabel = useMemo(() => {
    if (!selectedGame) return "";
    const homeName = resolveGameTeamName(
      selectedGame.home,
      selectedGame.homeTeamName,
      "HOME"
    );
    return toCompactTeamName(selectedGame.league, homeName);
  }, [selectedGame]);

  const predictModalAwayLabel = useMemo(() => {
    if (!selectedGame) return "";
    const awayName = resolveGameTeamName(
      selectedGame.away,
      selectedGame.awayTeamName,
      "AWAY"
    );
    return toCompactTeamName(selectedGame.league, awayName);
  }, [selectedGame]);

  const nextGameAfterPostDisplay = useMemo(() => {
    if (!nextGameAfterPost) return null;
    const g = nextGameAfterPost;
    const homeN = resolveGameTeamName(g.home, g.homeTeamName, "HOME");
    const awayN = resolveGameTeamName(g.away, g.awayTeamName, "AWAY");
    return {
      homeTitle: toCompactTeamName(g.league, homeN),
      awayTitle: toCompactTeamName(g.league, awayN),
      kickoff: formatKickoffTime(resolveGameStartAt(g), language),
      homePalette: resolveTeamJerseyPalette(g.league, g.home, "#ff6b8a"),
      awayPalette: resolveTeamJerseyPalette(g.league, g.away, "#5aa4ff"),
    };
  }, [nextGameAfterPost, language]);

  useEffect(() => {
    if (!isPredictModalOpen) return;
    if (scoreHome === "" || scoreAway === "") {
      setWinner(null);
      return;
    }
    const homeNum = Number(scoreHome);
    const awayNum = Number(scoreAway);
    if (
      !Number.isFinite(homeNum) ||
      !Number.isFinite(awayNum) ||
      homeNum < 0 ||
      awayNum < 0
    ) {
      setWinner(null);
      return;
    }
    if (homeNum > awayNum) {
      setWinner("home");
      return;
    }
    if (awayNum > homeNum) {
      setWinner("away");
      return;
    }
    if (isSoccerPredict) {
      setWinner("draw");
      return;
    }
    setWinner(null);
  }, [isPredictModalOpen, scoreHome, scoreAway, isSoccerPredict]);

  useEffect(() => {
    if (!isPredictModalOpen || !selectedGame || !fUser?.uid) return;
    if (predictSpectatorFinalOnly) return;
    const gameId = String(selectedGame.id ?? "");
    if (!gameId) return;
    const key = draftStorageKey(fUser.uid, gameId);
    void AsyncStorage.setItem(
      key,
      JSON.stringify({
        winner,
        scoreHome,
        scoreAway,
      })
    );
  }, [
    isPredictModalOpen,
    predictSpectatorFinalOnly,
    selectedGame,
    fUser?.uid,
    winner,
    scoreHome,
    scoreAway,
  ]);

  useEffect(() => {
    if (!selectedGame) return;
    if (resolveGameStatus(selectedGame) !== "scheduled") return;
    const startAt = resolveGameStartAt(selectedGame);
    if (!startAt) return;
    const timer = setInterval(() => {
      setCountdownNowMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, [selectedGame]);

  useEffect(() => {
    let alive = true;
    async function loadMyPredictions() {
      if (!fUser || gameIdSet.size === 0) {
        setPredictedGameIds(new Set());
        return;
      }
      try {
        const snap = await getDocs(
          query(
            collection(db, "posts"),
            where("authorUid", "==", fUser.uid),
            limit(300)
          )
        );
        if (!alive) return;
        const ids = new Set<string>();
        const postMap: Record<string, string> = {};
        const predictionMap: Record<
          string,
          {
            winner: "home" | "away" | "draw";
            score: { home: number; away: number };
            comment: string;
            updatedAt?: unknown;
          }
        > = {};
        snap.docs.forEach((row) => {
          const rowData = row.data();
          const schemaVersion = Number(rowData?.schemaVersion ?? 0);
          if (schemaVersion !== 2) return;
          const gameId = String(rowData?.gameId ?? "");
          if (gameId && gameIdSet.has(gameId)) {
            ids.add(gameId);
            postMap[gameId] = row.id;
            const winnerRaw = rowData?.prediction?.winner;
            const homeRaw = rowData?.prediction?.score?.home;
            const awayRaw = rowData?.prediction?.score?.away;
            if (
              (winnerRaw === "home" || winnerRaw === "away" || winnerRaw === "draw") &&
              typeof homeRaw === "number" &&
              typeof awayRaw === "number"
            ) {
              predictionMap[gameId] = {
                winner: winnerRaw,
                score: { home: homeRaw, away: awayRaw },
                comment:
                  typeof rowData?.comment === "string" ? rowData.comment : "",
                updatedAt: rowData?.updatedAt ?? null,
              };
            }
          }
        });
        setPredictedGameIds(ids);
        setMyPostIdByGameId(postMap);
        setMyPredictionByGameId(predictionMap);
      } catch {
        if (!alive) return;
        setPredictedGameIds(new Set());
        setMyPostIdByGameId({});
        setMyPredictionByGameId({});
      }
    }
    void loadMyPredictions();
    return () => {
      alive = false;
    };
  }, [fUser, gameIdSet, myPredictionsReloadNonce]);

  useEffect(() => {
    let alive = true;
    async function loadUserName() {
      if (!fUser?.uid) {
        setUserDisplayName("");
        return;
      }
      try {
        const snap = await getDoc(doc(db, "users", fUser.uid));
        if (!alive) return;
        const row = snap.data() as
          | { displayName?: unknown; language?: unknown }
          | undefined;
        const name = typeof row?.displayName === "string" ? row.displayName.trim() : "";
        setUserDisplayName(name || (fUser.displayName ?? ""));
        setLanguage(row?.language === "en" ? "en" : "ja");
      } catch {
        if (!alive) return;
        setUserDisplayName(fUser.displayName ?? "");
        setLanguage("ja");
      }
    }
    void loadUserName();
    return () => {
      alive = false;
    };
  }, [fUser?.uid, fUser?.displayName, myPredictionsReloadNonce]);

  const t = useMemo(() => getGamesTexts(language), [language]);

  useEffect(() => {
    mainScrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [selectedDate, selectedLeague, loading]);

  useEffect(() => {
    if (skipAutoAdvanceRef.current) {
      skipAutoAdvanceRef.current = false;
      return;
    }
    const isToday = isSameLocalDay(startOfLocalDay(selectedDate), today);
    if (!isToday) {
      suppressAutoAdvanceForTodayRef.current = false;
      setDidAutoAdvanceToday(false);
      return;
    }
    if (suppressAutoAdvanceForTodayRef.current) return;
    if (didAutoAdvanceToday) return;
    if (!games.length) return;
    const allFinished = games.every(
      (game) => resolveGameStatus(game as Record<string, unknown>) === "final"
    );
    if (!allFinished) return;
    setDidAutoAdvanceToday(true);
    setSelectedDate((prev) => addDays(prev, 1));
  }, [didAutoAdvanceToday, games, selectedDate, setSelectedDate, today]);

  function selectDateManually(nextDate: Date) {
    skipAutoAdvanceRef.current = true;
    suppressAutoAdvanceForTodayRef.current = true;
    setDidAutoAdvanceToday(false);
    setSelectedDate(nextDate);
  }

  function goPrevDayManually() {
    skipAutoAdvanceRef.current = true;
    suppressAutoAdvanceForTodayRef.current = true;
    setDidAutoAdvanceToday(false);
    goPrevDay();
  }

  function goNextDayManually() {
    skipAutoAdvanceRef.current = true;
    suppressAutoAdvanceForTodayRef.current = true;
    setDidAutoAdvanceToday(false);
    goNextDay();
  }

  function openPredictModal(
    targetGame?: Record<string, unknown>,
    fromRect?: PredictHeroFromRect | null
  ) {
    const sourceGame = targetGame ?? selectedGame;
    if (!sourceGame) {
      setPredictHeroFromRect(null);
      setPredictSpectatorFinalOnly(false);
      return;
    }
    const gameId = String(sourceGame.id ?? "");
    const existingPostId = myPostIdByGameId[gameId];
    const existingPrediction = myPredictionByGameId[gameId];
    const started = isGameStarted(sourceGame);
    const status = resolveGameStatus(sourceGame);
    const spectatorFinalNoPost =
      Boolean(targetGame && started && !existingPostId && status === "final");
    if (targetGame && started && !existingPostId && !spectatorFinalNoPost) {
      setPredictSpectatorFinalOnly(false);
      setSelectedGame(sourceGame);
      setIsPredictModalOpen(false);
      setPredictHeroFromRect(null);
      return;
    }
    if (existingPostId) {
      Alert.alert(t.editModeTitle, t.editModeBody);
    }
    setPredictSpectatorFinalOnly(spectatorFinalNoPost);
    setWinner(null);
    setScoreHome("");
    setScoreAway("");
    setPredictToolsTab(null);
    setPredictHeroFromRect(fromRect ?? null);
    setSelectedGame(sourceGame);
    setIsPredictModalOpen(true);

    if (spectatorFinalNoPost) return;

    if (!fUser?.uid) return;
    void (async () => {
      const key = draftStorageKey(fUser.uid, gameId);
      const raw = await AsyncStorage.getItem(key);
      if (raw) {
        try {
          const draft = JSON.parse(raw) as {
            winner: "home" | "away" | "draw" | null;
            scoreHome: string;
            scoreAway: string;
          };
          setWinner(draft.winner ?? null);
          setScoreHome(draft.scoreHome ?? "");
          setScoreAway(draft.scoreAway ?? "");
          return;
        } catch {
          // ignore broken draft
        }
      }
      if (existingPrediction) {
        setWinner(existingPrediction.winner);
        setScoreHome(String(existingPrediction.score.home));
        setScoreAway(String(existingPrediction.score.away));
      }
    })();
  }

  async function handleNextGameModalYes(dontShowAgain: boolean) {
    if (dontShowAgain) await writePredictNextGameModalSkip();
    const g = nextGameAfterPost;
    setNextGameAfterPost(null);
    if (g) {
      requestAnimationFrame(() => {
        openPredictModal(g);
      });
    }
  }

  async function handleNextGameModalNo(dontShowAgain: boolean) {
    if (dontShowAgain) await writePredictNextGameModalSkip();
    setNextGameAfterPost(null);
  }

  async function handleSubmitPrediction() {
    if (!selectedGame || !fUser) {
      return;
    }
    if (scoreHome.trim() === "" || scoreAway.trim() === "") {
      Alert.alert(t.missingWinnerTitle, t.predictionNeedsScoresBody);
      return;
    }
    if (!winner) {
      Alert.alert(t.invalidInputTitle, t.predictionNeedsWinnerScoreBody);
      return;
    }
    const homeNum = Number(scoreHome);
    const awayNum = Number(scoreAway);
    if (
      !Number.isFinite(homeNum) ||
      !Number.isFinite(awayNum) ||
      homeNum < 0 ||
      awayNum < 0
    ) {
      Alert.alert(t.invalidInputTitle, t.invalidScoreBody);
      return;
    }
    if (!isSoccerPredict && winner === "draw") {
      Alert.alert(t.invalidInputTitle, t.invalidDrawLeagueBody);
      return;
    }
    if (winner === "home" && homeNum <= awayNum) {
      Alert.alert(t.invalidInputTitle, t.invalidHomeWinBody);
      return;
    }
    if (winner === "away" && awayNum <= homeNum) {
      Alert.alert(t.invalidInputTitle, t.invalidAwayWinBody);
      return;
    }
    if (winner === "draw" && homeNum !== awayNum) {
      Alert.alert(t.invalidInputTitle, t.invalidDrawScoreBody);
      return;
    }

    const gameId = String(selectedGame.id ?? "");
    if (!gameId) {
      Alert.alert(t.submitErrorTitle, t.submitNoGameIdBody);
      return;
    }

    const startAt = resolveGameStartAt(selectedGame);
    if (isGameStarted(selectedGame)) {
      Alert.alert(t.submitLockedTitle, t.submitLockedBody);
      return;
    }

    setPredictSubmitting(true);
    try {
      const existingPostId = myPostIdByGameId[gameId];
      const isEditing = Boolean(existingPostId);
      if (existingPostId) {
        await updateDoc(doc(db, "posts", existingPostId), {
          prediction: {
            winner,
            score: { home: homeNum, away: awayNum },
          },
          comment: "",
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, "posts"), {
          schemaVersion: 2,
          authorUid: fUser.uid,
          authorDisplayName: fUser.displayName ?? "ユーザー",
          authorPhotoURL: fUser.photoURL ?? null,
          authorHandle: null,
          gameId,
          league: selectedGame.league ?? "nba",
          home: selectedGame.home ?? null,
          away: selectedGame.away ?? null,
          status: selectedGame.status ?? "scheduled",
          startAt: startAt ?? null,
          startAtMillis: startAt?.getTime() ?? null,
          startAtIso: startAt?.toISOString() ?? null,
          prediction: {
            winner,
            score: { home: homeNum, away: awayNum },
          },
          comment: "",
          result: null,
          stats: null,
          likeCount: 0,
          saveCount: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      const currentLeague = String(selectedGame.league ?? "");
      const nextPredictedIds = new Set(predictedGameIds);
      nextPredictedIds.add(gameId);
      setPredictedGameIds(nextPredictedIds);
      setMyPredictionsReloadNonce((prev) => prev + 1);
      if (fUser?.uid) {
        await AsyncStorage.removeItem(draftStorageKey(fUser.uid, gameId));
      }

      setWinner(null);
      setScoreHome("");
      setScoreAway("");
      setPredictToolsTab(null);
      setIsPredictModalOpen(false);
      setSelectedGame(null);

      if (isEditing) {
        Alert.alert(t.updateDone, t.updateDoneOnly);
      } else {
        const skipNextModal = await readPredictNextGameModalSkip();
        const nextGame = findNextUnpredictedGame(
          gameId,
          currentLeague,
          games,
          nextPredictedIds
        );
        if (skipNextModal) {
          Alert.alert(t.postDone, t.postDoneOnly);
        } else if (nextGame) {
          setNextGameAfterPost(nextGame);
        } else {
          Alert.alert(t.postDone, t.postDoneOnly);
        }
      }
    } catch (error: any) {
      Alert.alert(t.postErrorTitle, error?.message ?? t.postErrorBody);
    } finally {
      setPredictSubmitting(false);
    }
  }

  return (
    <View style={styles.card}>
      <ScrollView
        ref={mainScrollRef}
        style={styles.mainScroll}
        contentContainerStyle={mainScrollContentStyle}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
      >
      {/*
        モバイル Web: 試合一覧（GamesPage）自体に UNITERZ は無い。
        ロゴの色・字間・下線は認証の AuthFormBranding / authEnglishDisplay（#e6e4de・cyan 1 本＋ glow）に合わせ、
        バナー参照の「中央が暖色で左右に薄れる」帯をネイティブ用にレイヤー化。
      */}
      <View style={styles.brandShelf}>
        <LinearGradient
          pointerEvents="none"
          colors={[
            "rgba(5,7,10,0)",
            "rgba(61,46,32,0.52)",
            "rgba(45,36,26,0.4)",
            "rgba(61,46,32,0.52)",
            "rgba(5,7,10,0)",
          ]}
          locations={[0, 0.32, 0.5, 0.68, 1]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.brandWarmHaze}
        />
        <Text style={styles.brandText}>UNITERZ</Text>
        <BrandCyanLineAnimated />
      </View>
      <View style={styles.topControlRow}>
        <View style={styles.leagueRow}>
          <Pressable
            style={styles.leagueChipGlass}
            onPress={() => {
              const currentIdx = LEAGUE_OPTIONS.findIndex(
                (option) => option.id === selectedLeague
              );
              const nextIdx =
                currentIdx < 0 ? 0 : (currentIdx + 1) % LEAGUE_OPTIONS.length;
              setSelectedLeague(LEAGUE_OPTIONS[nextIdx].id);
            }}
          >
            <LinearGradient
              pointerEvents="none"
              colors={[
                "rgba(255,255,255,0.14)",
                "rgba(130,150,200,0.12)",
                "rgba(8,12,28,0.55)",
                "rgba(3,5,16,0.78)",
              ]}
              locations={[0, 0.42, 0.52, 1]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
            <LinearGradient
              pointerEvents="none"
              colors={["rgba(255,255,255,0.1)", "rgba(255,255,255,0)"]}
              locations={[0, 1]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 0.38 }}
              style={styles.leagueChipGlassTopSheen}
            />
            <LinearGradient
              pointerEvents="none"
              colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.22)"]}
              locations={[0, 1]}
              start={{ x: 0.5, y: 0.55 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.leagueChipGlassBottomVignette}
            />
            <Text style={styles.leagueChipTextGlass}>
              {selectedLeagueOption.label}
            </Text>
          </Pressable>
        </View>
        <View style={styles.topActionsRow}>
          <Pressable style={styles.filterButton}>
            <Text style={styles.filterButtonText}>{t.filter}</Text>
          </Pressable>
          {selectedLeague === "nba" ? (
            <Pressable
              style={styles.bracketButton}
              onPress={() =>
                Alert.alert(
                  language === "en" ? "Coming soon" : "準備中",
                  language === "en"
                    ? "Bracket screen will be connected in native flow."
                    : "Bracket画面のネイティブ導線は次フェーズで接続します。"
                )
              }
            >
              <Text style={styles.bracketButtonText}>{t.bracket}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
      <View style={styles.monthHeaderRow}>
        <Pressable style={styles.dayButton} onPress={goPrevDayManually}>
          <Text style={styles.dayButtonText}>←</Text>
        </Pressable>
        <View style={styles.monthHeaderCenter}>
          <Text style={styles.monthHeaderText}>{monthLabel}</Text>
        </View>
        <Pressable style={styles.dayButton} onPress={goNextDayManually}>
          <Text style={styles.dayButtonText}>→</Text>
        </Pressable>
      </View>
      <View style={styles.dayStripContent}>
        {dayStripDates.map((day) => {
          const selected = isSameLocalDay(day, selectedDate);
          const isTodayChip = isSameLocalDay(day, today);
          const dayNum = day.getDate();
          return (
            <Pressable
              key={`${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`}
              style={[
                styles.dayChip,
                selected && styles.dayChipActive,
                isTodayChip && !selected && styles.dayChipToday,
                selected && styles.dayChipSelectedTransform,
              ]}
              onPress={() => selectDateManually(day)}
            >
              <LinearGradient
                colors={
                  selected
                    ? ["rgba(34,211,238,0.42)", "rgba(8,145,178,0.36)"]
                    : ["rgba(255,255,255,0.08)", "rgba(255,255,255,0.03)"]
                }
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              <LinearGradient
                colors={[
                  selected
                    ? "rgba(255,255,255,0.12)"
                    : "rgba(255,255,255,0.07)",
                  "rgba(255,255,255,0)",
                ]}
                locations={selected ? [0, 0.55] : [0, 0.6]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                pointerEvents="none"
                style={StyleSheet.absoluteFillObject}
              />
              <Text
                style={[styles.dayChipDate, selected && styles.dayChipDateActive]}
              >
                {dayNum}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.skeletonList}>
          {SKELETON_ROWS.map((row) => (
            <View key={row} style={styles.skeletonCard}>
              <View style={styles.skeletonTeamRow}>
                <View style={[styles.skeletonLine, styles.skeletonTeam]} />
                <View style={[styles.skeletonLine, styles.skeletonVs]} />
                <View style={[styles.skeletonLine, styles.skeletonTeam]} />
              </View>
              <View style={[styles.skeletonLine, styles.skeletonScore]} />
              <View style={[styles.skeletonLine, styles.skeletonMeta]} />
              <View style={[styles.skeletonLine, styles.skeletonMetaWide]} />
            </View>
          ))}
        </View>
      ) : null}
      {error ? (
        <Text style={styles.errorText}>
          {t.fetchError}: {error}
        </Text>
      ) : null}

      {!loading && !error ? (
        <GameCardList
          games={games}
          predictedGameIds={predictedGameIds}
          myPredictionByGameId={myPredictionByGameId}
          language={language}
          t={t}
          styles={styles}
          openPredictModal={openPredictModal}
          resolveGameTeamName={resolveGameTeamName}
          toCompactTeamName={toCompactTeamName}
          isSoccerLeague={isSoccerLeague}
          resolveGameStatus={resolveGameStatus}
          isGameStarted={isGameStarted}
          resolveLeagueColor={resolveLeagueColor}
          getGameCardCenterBlock={(game) => getGameCardCenterBlock(game, language)}
          resolveSeriesLabel={resolveSeriesLabelForList}
          resolveSeriesPair={resolveSeriesPairForList}
          getTeamRecordLabel={formatSideRecord}
          resolveTeamJerseyPalette={resolveTeamJerseyPalette}
          renderWinnerLabel={renderWinnerLabel}
        />
      ) : null}
      </ScrollView>

      <GameDetailModal
        visible={isGameDetailModalVisible}
        selectedGame={selectedGame}
        myPostIdByGameId={myPostIdByGameId}
        myPredictionByGameId={myPredictionByGameId}
        renderWinnerLabel={renderWinnerLabel}
        formatDateTimeJst={formatDateTimeJst}
        toCompactTeamName={toCompactTeamName}
        resolveGameTeamName={resolveGameTeamName}
        resolveTeamPrimaryColor={resolveTeamPrimaryColor}
        renderCenterText={renderCenterText}
        renderStatusLabel={renderStatusLabel}
        resolveGameStartAt={resolveGameStartAt}
        resolveGameStatus={resolveGameStatus}
        formatCountdownLabel={formatCountdownLabel}
        isGameStarted={isGameStarted}
        countdownNowMs={countdownNowMs}
        language={language}
        t={t}
        openPredictModal={() => openPredictModal()}
        onClose={() => {
          setSelectedGame(null);
        }}
        styles={styles}
      />

      <PredictModal
        visible={isPredictModalOpen}
        heroFromRect={predictHeroFromRect}
        matchPreview={predictModalMatchPreview}
        t={t}
        predictHomeTeamLabel={predictModalHomeLabel}
        predictAwayTeamLabel={predictModalAwayLabel}
        predictToolsTab={predictToolsTab}
        setPredictToolsTab={setPredictToolsTab}
        winner={winner}
        isSoccerPredict={isSoccerPredict}
        scoreAway={scoreAway}
        setScoreAway={setScoreAway}
        scoreHome={scoreHome}
        setScoreHome={setScoreHome}
        predictSubmitting={predictSubmitting}
        isEditingPrediction={isEditingPrediction}
        onSubmit={() => void handleSubmitPrediction()}
        onClose={() => {
          setIsPredictModalOpen(false);
          setPredictHeroFromRect(null);
          setPredictSpectatorFinalOnly(false);
          setSelectedGame(null);
        }}
        spectatorFinalNoPost={predictSpectatorFinalOnly}
        predictData={predictModalData}
      />
      {nextGameAfterPost && nextGameAfterPostDisplay ? (
        <PredictNextGameNativeModal
          visible
          title={t.nextGameModalTitle}
          sub={t.nextGameModalSub}
          deckLabel={t.nextGameDeck}
          skipLabel={t.nextGameModalSkip}
          primaryButtonLabel={t.nextGameModalYes}
          secondaryButtonLabel={t.nextGameModalNo}
          homeTitle={nextGameAfterPostDisplay.homeTitle}
          awayTitle={nextGameAfterPostDisplay.awayTitle}
          kickoff={nextGameAfterPostDisplay.kickoff}
          homePalette={nextGameAfterPostDisplay.homePalette}
          awayPalette={nextGameAfterPostDisplay.awayPalette}
          onYes={(d) => void handleNextGameModalYes(d)}
          onNo={(d) => void handleNextGameModalNo(d)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    flex: 1,
    backgroundColor: "transparent",
    paddingHorizontal: spacing.xs,
    paddingTop: 2,
    paddingBottom: spacing.xs,
    gap: 6,
  },
  mainScroll: {
    flex: 1,
  },
  mainScrollContent: {
    paddingBottom: 0,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
  },
  /** ロゴを載せる薄い段。親の横パディングを相殺して画面幅いっぱいに */
  brandShelf: {
    alignSelf: "stretch",
    alignItems: "center",
    marginBottom: 8,
    marginHorizontal: -spacing.xs,
    paddingTop: 12,
    paddingBottom: 12,
    borderRadius: 0,
    overflow: "hidden",
    borderWidth: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(6,9,14,0.72)",
  },
  brandWarmHaze: {
    ...StyleSheet.absoluteFillObject,
  },
  /** authEnglishDisplay の ink + AuthFormBranding のトラッキングに近い */
  brandText: {
    color: "#e6e4de",
    fontSize: 20,
    fontWeight: "400",
    letterSpacing: 3.6,
    fontFamily: DISPLAY_FONT_FAMILY,
  },
  headerTextBlock: {
    flex: 1,
    gap: spacing.xxs,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.title,
    fontWeight: "700",
  },
  subTitle: {
    color: colors.textSecondary,
    fontSize: typography.caption,
  },
  caption: {
    color: colors.accent,
    fontSize: typography.caption,
  },
  userNameText: {
    color: colors.textSecondary,
    fontSize: typography.caption,
  },
  dayControlRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    marginTop: 4,
  },
  topControlRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
    marginTop: 0,
    marginBottom: 2,
  },
  leagueRow: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    flexShrink: 0,
  },
  topActionsRow: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    flexShrink: 0,
  },
  filterButton: {
    minHeight: 28,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(15,21,38,0.84)",
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  filterButtonText: {
    color: colors.textPrimary,
    fontSize: 9,
    fontWeight: "700",
  },
  bracketButton: {
    minHeight: 28,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "rgba(31,111,235,0.45)",
    backgroundColor: "rgba(31,111,235,0.16)",
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  bracketButtonText: {
    color: "#8db6ff",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  /** リーグ名：角丸四角＋積層ガラス（上ハイライト＋下すみ） */
  leagueChipGlass: {
    minHeight: 28,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    backgroundColor: "rgba(6,10,24,0.25)",
    ...Platform.select({
      ios: {
        shadowColor: "rgba(80, 160, 255, 0.4)",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 7,
      },
      android: { elevation: 3 },
      default: {
        shadowColor: "rgba(80, 160, 255, 0.35)",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.35,
        shadowRadius: 6,
      },
    }),
  },
  leagueChipGlassTopSheen: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: "50%",
    opacity: 0.9,
  },
  leagueChipGlassBottomVignette: {
    ...StyleSheet.absoluteFillObject,
  },
  leagueChipTextGlass: {
    color: "#ffffff",
    fontSize: 16,
    lineHeight: 18,
    fontWeight: "800",
    fontFamily: DISPLAY_FONT_FAMILY,
    letterSpacing: 0.45,
    textTransform: "uppercase",
    zIndex: 1,
    includeFontPadding: false,
  },
  dayButton: {
    minHeight: 28,
    minWidth: 28,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 0,
    backgroundColor: "transparent",
  },
  dayButtonText: {
    color: "rgba(226,232,240,0.62)",
    fontSize: 14,
    fontWeight: "600",
  },
  dayBadge: {
    minWidth: 180,
    minHeight: 40,
    borderRadius: radius.chip,
    backgroundColor: "rgba(15,21,38,0.86)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
  },
  dayBadgeText: {
    color: colors.accent,
    fontSize: typography.caption,
    fontWeight: "700",
  },
  monthHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: 0,
    marginBottom: 1,
  },
  monthHeaderCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 36,
  },
  monthHeaderText: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.4,
    fontFamily: NUMERIC_FONT_FAMILY,
  },
  dayStripContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
    paddingVertical: 2,
    paddingBottom: 3,
  },
  // Web app/component/games/DayStrip と同じ円＋枠＋縦グラデ
  dayChip: {
    width: 42,
    height: 42,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.16)",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xs,
  },
  dayChipToday: {
    borderColor: "rgba(34,211,238,0.38)",
    shadowColor: "rgb(34, 211, 238)",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 1,
  },
  dayChipActive: {
    borderColor: "rgba(34,211,238,0.62)",
    shadowColor: "rgb(34, 211, 238)",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 7,
    elevation: 3,
  },
  dayChipSelectedTransform: {
    transform: [{ translateY: -1 }, { scale: 1.02 }],
  },
  dayChipDate: {
    zIndex: 1,
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 14,
    fontFamily: "Oxanium_700Bold",
    textShadowColor: "rgba(0,0,0,0.22)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 0,
  },
  dayChipDateActive: {
    color: "#ecfeff",
    textShadowColor: "rgba(34,211,238,0.22)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  todayButton: {
    alignSelf: "flex-start",
    marginTop: 2,
  },
  todayButtonText: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    textDecorationLine: "underline",
  },
  reloadButton: {
    alignSelf: "flex-start",
    minHeight: 36,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.chip,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(15,21,38,0.84)",
    alignItems: "center",
    justifyContent: "center",
  },
  reloadButtonText: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    fontWeight: "600",
  },
  skeletonList: {
    gap: spacing.sm,
  },
  skeletonCard: {
    borderWidth: 1,
    borderColor: "#2d3550",
    borderRadius: 14,
    backgroundColor: "#0f1526",
    padding: spacing.md,
    gap: spacing.sm,
    opacity: 0.75,
  },
  skeletonTeamRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.xs,
  },
  skeletonLine: {
    backgroundColor: "#27314a",
    borderRadius: 8,
    minHeight: 12,
  },
  skeletonTeam: {
    flex: 1,
    minHeight: 14,
  },
  skeletonVs: {
    width: 28,
    minHeight: 12,
  },
  skeletonScore: {
    alignSelf: "center",
    width: 120,
    minHeight: 22,
  },
  skeletonMeta: {
    width: "42%",
    minHeight: 12,
  },
  skeletonMetaWide: {
    width: "64%",
    minHeight: 12,
  },
  body: {
    color: colors.textSecondary,
    fontSize: typography.body,
  },
  errorText: {
    color: "#ff7f7f",
    fontSize: typography.caption,
  },
  listArea: {
    marginTop: 8,
  },
  listContent: {
    gap: 6,
    paddingBottom: spacing.xl,
    paddingTop: 0,
    paddingHorizontal: 2,
  },
  /** パディングは `cardPressableBody`。方眼はシェル全面に敷く */
  gameCardShell: {
    position: "relative",
    overflow: "hidden",
    width: "92%",
    alignSelf: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 20,
    backgroundColor: "rgba(8,11,18,0.84)",
    minHeight: 148,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.55,
    shadowRadius: 20,
    elevation: 7,
  },
  /** 角丸内いっぱいに方眼（パディングの外側まで） */
  cardGridUnderlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  /** 試合テキスト・CTA の余白（従来 gameCardShell のパディング相当） */
  cardPressableBody: {
    flex: 1,
    zIndex: 1,
    paddingHorizontal: spacing.sm,
    paddingTop: 5,
    paddingBottom: 3,
    gap: 2,
  },
  cardLayerBase: {
    ...StyleSheet.absoluteFillObject,
  },
  cardBlurLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  cardBlurLayerFallback: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(24,28,38,0.12)",
  },
  cardLayerTopGlow: {
    ...StyleSheet.absoluteFillObject,
  },
  cardLayerGlassFog: {
    ...StyleSheet.absoluteFillObject,
  },
  cardLayerShine: {
    ...StyleSheet.absoluteFillObject,
  },
  gameCardShellPredicted: {
    borderColor: "rgba(148,163,184,0.46)",
  },
  cardGlowOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
  },
  cardEdgeGlow: {
    position: "absolute",
    left: 4,
    right: 4,
    top: 2,
    height: 10,
    borderRadius: 999,
    backgroundColor: "transparent",
  },
  /** 角丸クリップは `gameCardShell` の overflow */
  cardGridOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  /** 線色は `matchCardShellGrid` の共通定数を GameCardList で付与 */
  cardGridLineVertical: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
  },
  cardGridLineHorizontal: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    marginBottom: 3,
    gap: spacing.xs,
  },
  /** MatchCard mc-round（一覧：やや大きめ・上余白でやや下げる） */
  roundLabelText: {
    flex: 1,
    color: "rgba(241,245,255,0.95)",
    fontSize: 21,
    fontWeight: "800",
    lineHeight: 24,
    letterSpacing: 1,
    textAlign: "center",
    includeFontPadding: false,
    textTransform: "uppercase",
    fontFamily: DISPLAY_FONT_FAMILY,
  },
  matchupGrid: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 5,
    marginTop: 0,
    marginBottom: 0,
  },
  teamColumn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    minHeight: 94,
  },
  teamTopGroup: {
    alignItems: "center",
    gap: 3,
    marginTop: 3,
  },
  teamBottomGroup: {
    alignItems: "center",
    gap: 0,
    marginTop: 2,
    marginBottom: 0,
  },
  /** Web モバイル `MatchCard` の HOME/AWAY に合わせる */
  sideLabel: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 14,
    letterSpacing: 0.96,
    includeFontPadding: false,
    textTransform: "uppercase",
    fontFamily: DISPLAY_FONT_FAMILY,
  },
  teamMark: {
    width: 48,
    height: 48,
    borderRadius: 0,
    borderWidth: 0,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  /** MobileMatchCard NBA 等（一覧・プレビューと揃えてややコンパクト） */
  teamNameMain: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: 0.5,
    lineHeight: 14,
    marginTop: 0,
    marginBottom: 0,
    includeFontPadding: false,
    textTransform: "uppercase",
    fontFamily: DISPLAY_FONT_FAMILY,
    maxWidth: "100%",
  },
  /** モバイル MatchCard: mc-record、Oxanium（チーム名に合わせて一段小さく） */
  teamRecordText: {
    color: "rgba(226,232,240,0.82)",
    fontSize: 10,
    fontWeight: "700",
    lineHeight: 11,
    marginTop: -1,
    letterSpacing: 0.2,
    includeFontPadding: false,
    fontFamily: NUMERIC_FONT_FAMILY,
  },
  centerColumn: {
    flex: 1.05,
    alignItems: "center",
    justifyContent: "center",
    gap: 0,
    marginTop: 0,
    paddingTop: 1,
  },
  centerScoreWrap: {
    width: "96%",
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingTop: 0,
  },
  seriesText: {
    marginTop: 2,
    color: "#f7d449",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.2,
    lineHeight: 13,
    includeFontPadding: false,
    textAlign: "center",
    fontVariant: ["tabular-nums"],
    fontFamily: NUMERIC_FONT_FAMILY,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  modalCard: {
    width: "100%",
    borderRadius: radius.card,
    backgroundColor: "#0b1120",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    padding: spacing.lg,
    gap: spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.32,
    shadowRadius: 16,
    elevation: 5,
  },
  modalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  /** ヘッダ行内：× と並べて省略 */
  modalTitleInHeader: {
    flex: 1,
  },
  modalHeaderClose: {
    minWidth: 40,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  modalHeaderCloseX: {
    color: colors.textPrimary,
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "300",
  },
  modalTitle: {
    color: colors.textPrimary,
    fontSize: typography.title,
    fontWeight: "700",
  },
  modalBody: {
    color: colors.textSecondary,
    fontSize: typography.body,
  },
  modalTeamBadgeRow: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  modalTeamBadge: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: "rgba(15,21,38,0.86)",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    gap: 2,
  },
  modalTeamBadgeLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  modalTeamBadgeName: {
    color: colors.textPrimary,
    fontSize: typography.caption,
    fontWeight: "700",
  },
  countdownText: {
    color: "#9ad3ff",
    fontSize: typography.caption,
    fontWeight: "700",
  },
  predictMetaText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  predictToolsRow: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  predictToolTab: {
    flex: 1,
    minHeight: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(15,21,38,0.82)",
    alignItems: "center",
    justifyContent: "center",
  },
  predictToolTabActive: {
    borderColor: "rgba(103,232,249,0.45)",
    backgroundColor: "rgba(45,99,235,0.28)",
  },
  predictToolTabText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "700",
  },
  predictToolsPanel: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 10,
    backgroundColor: "rgba(12,18,32,0.8)",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  predictToolsPanelText: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: "center",
  },
  predictSectionTitle: {
    color: colors.textPrimary,
    fontSize: typography.caption,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  myPredictionSummary: {
    color: "#9ac1ff",
    fontSize: typography.caption,
    fontWeight: "700",
  },
  predictButton: {
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(103,232,249,0.3)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(45,99,235,0.92)",
    marginTop: spacing.xs,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  predictButtonText: {
    color: colors.textPrimary,
    fontSize: typography.body,
    fontWeight: "700",
  },
  winnerRow: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  winnerChip: {
    flex: 1,
    minHeight: 40,
    borderRadius: radius.chip,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(15,21,38,0.84)",
    alignItems: "center",
    justifyContent: "center",
  },
  winnerChipActive: {
    borderColor: "rgba(103,232,249,0.46)",
    backgroundColor: "rgba(124,92,255,0.22)",
  },
  winnerChipText: {
    color: colors.textPrimary,
    fontSize: typography.caption,
    fontWeight: "700",
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  scoreBox: {
    flex: 1,
    gap: spacing.xxs,
  },
  scoreLabel: {
    color: colors.textSecondary,
    fontSize: typography.caption,
  },
  scoreInput: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(15,21,38,0.86)",
    color: colors.textPrimary,
    fontSize: typography.body,
    paddingHorizontal: spacing.md,
    textAlign: "center",
  },
  scoreSeparator: {
    color: colors.textPrimary,
    fontSize: typography.title,
    fontWeight: "700",
  },
  leagueHintText: {
    color: "#93b9ff",
    fontSize: 11,
    textAlign: "center",
  },
  /** キックオフ時刻のみ（太め・影） */
  centerText: {
    color: "rgba(239,245,255,0.96)",
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 26,
    textAlign: "center",
    letterSpacing: 0.15,
    includeFontPadding: false,
    fontVariant: ["tabular-nums"],
    fontFamily: NUMERIC_FONT_FAMILY,
    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  /** スコア行：MatchCard モバイルの text-xl 相当（チーム名 15px との釣り合い重視） */
  centerTextScore: {
    textAlign: "center",
  },
  centerTextScoreNum: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 22,
    includeFontPadding: false,
    fontVariant: ["tabular-nums"],
    fontFamily: NUMERIC_FONT_FAMILY,
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  centerScoreDash: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 20,
    fontWeight: "600",
    lineHeight: 22,
    fontFamily: NUMERIC_FONT_FAMILY,
  },
  /** Qtr + 残り、または Final+OT */
  centerSubline: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 12,
    lineHeight: 14,
    textAlign: "center",
    includeFontPadding: false,
  },
  liveMetaText: {
    color: "#a8dbff",
    fontSize: 10,
    lineHeight: 11,
    textAlign: "center",
    includeFontPadding: false,
  },
  cardCountdownText: {
    color: "#8ecbff",
    fontSize: 9,
    lineHeight: 10,
    textAlign: "center",
    fontWeight: "700",
    includeFontPadding: false,
  },
  /** MatchCard 仕切り：league 色＋入場アニメ相当の薄いシアン光彩 */
  leagueDivider: {
    height: 2,
    width: "100%",
    borderRadius: 999,
    marginTop: "auto",
    shadowColor: "rgb(34, 211, 238)",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 2,
  },
  /** MatchCard: h-8 ≈ 32, rounded-md = 6, 枠は style ではなくグラデ（Web に合わせ枠なし） */
  cardAction: {
    width: "100%",
    minHeight: 32,
    borderRadius: 6,
    borderWidth: 0,
    overflow: "hidden",
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    marginTop: 0,
    marginBottom: 2,
    paddingVertical: 0,
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  cardActionPredicted: {},
  cardActionFinal: {
    borderWidth: 0,
  },
  cardActionLive: {},
  cardActionPredictPrimary: {},
  /** Web radial の縦方向の裾足し */
  cardActionMcVerticalLayer: {
    opacity: 0.38,
  },
  cardActionMcVerticalLayerGray: {
    opacity: 0.34,
  },
  cardActionHairlineTop: {
    position: "absolute",
    top: 0,
    left: 3,
    right: 3,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.1)",
    zIndex: 2,
  },
  cardActionHairlineBottom: {
    position: "absolute",
    bottom: 0,
    left: 3,
    right: 3,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.08)",
    zIndex: 2,
  },
  cardActionFill: {
    ...StyleSheet.absoluteFillObject,
  },
  cardActionText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.1,
    lineHeight: 15,
    includeFontPadding: false,
    textAlignVertical: "center",
    zIndex: 3,
  },
  /** 試合終了（MatchCard の text-white） */
  cardActionTextFinal: {
    color: "#ffffff",
  },
  cardMyPredictionText: {
    marginTop: 2,
    marginBottom: 0,
    color: "rgba(159,197,255,0.96)",
    fontSize: 10,
    lineHeight: 11,
    fontWeight: "700",
    letterSpacing: 0.2,
    textAlign: "center",
    includeFontPadding: false,
    fontFamily: NUMERIC_FONT_FAMILY,
  },
  cardActionShine: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: "52%",
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  logoutButton: {
    minHeight: 36,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: radius.chip,
    backgroundColor: "rgba(15,21,38,0.84)",
    paddingHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutText: {
    color: colors.textPrimary,
    fontSize: typography.caption,
    fontWeight: "600",
  },
});
