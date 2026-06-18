import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { GestureDetector } from "react-native-gesture-handler";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  collection,
  doc,
  getDoc,
  query,
  where,
  limit,
  getDocs,
} from "firebase/firestore";
import { LinearGradient } from "expo-linear-gradient";
import { colors, radius, spacing, typography } from "../../theme/tokens";
import { TIMEZONE_JST, toDateKeyInTimeZone } from "../../utils/date";
import {
  parseDateKeyInTimeZone,
  shiftCalendarMonthStart,
} from "../../../../../lib/time/zonedTime";
import { fetchMonthHasGames } from "../../../../../lib/games/fetchMonthHasGames";
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
  sortedUniqueDateKeysFromRows,
  useTodayGames,
} from "./useTodayGames";
import GamesTeamFilterPanelNative from "./GamesTeamFilterPanelNative";
import {
  applyNativeGamesFilter,
  gamesFilterIsActive,
  type GamesFilterState,
} from "./applyNativeGamesFilter";
import {
  resolveTeamJerseyPalette,
  resolveTeamPrimaryColor,
} from "./teamColors";
import PredictModal, {
  type PredictModalMatchPreview,
  type PredictModalScheduleMeta,
  type PredictModalWcGoalScorer,
} from "./PredictModal";
import { buildPredictModalMergedFinalPreview } from "./buildPredictModalMergedFinal";
import {
  createPredictionPostApi,
  getUniterzApiBaseUrl,
  PredictionApiError,
  updatePredictionPostApi,
} from "./submitPredictionApi";
import PredictNextGameNativeModal from "./PredictNextGameNativeModal";
import {
  broadcastDeckTitleForNextModal,
  scoreboardTeamLabelForNextModal,
} from "./predictNextGameModalLabels";
import {
  isPlayoffStyleGameCard,
  parseSeriesStandingFromRaw,
} from "../../../../../lib/games/playoffSeriesUi";
import GameDetailModal from "./GameDetailModal";
import {
  readEditModeHintShown,
  writeEditModeHintShown,
} from "./predictEditModeHintPrefs";
import {
  readPredictNextGameModalSkip,
  writePredictNextGameModalSkip,
} from "./predictNextGameModalPrefs";
import GameCardList from "./GameCardList";
import {
  resolveNativeSeriesLabel,
  resolveNativeSeriesPair,
} from "./resolveNativeSeriesStanding";
import { getGamesTexts } from "./gamesI18n";
import { resolveWcBroadcastLabels } from "../../../../../lib/wc/wcBroadcastLabels";
import {
  isWcGoalScorerPickValidForPredictedScore,
  normalizeWcGoalScorerPick,
} from "../../../../../lib/wc/goalScorer";
import { getWcSquadPlayer } from "../../../../../lib/wc/squads";
import type { GameCardCenterBlock } from "./gameCardCenterTypes";
import { formatTeamRecordForCard } from "./teamRecordDisplay";
import { useTeamRecordMap } from "./useTeamRecordMap";
import GamesDrawerMenuNative from "./GamesDrawerMenuNative";
import SideMenuDrawerNative from "../../ui/SideMenuDrawerNative";
import CyberMenuButton from "../../ui/CyberMenuButton";
import GamesHeaderFilterButtonNative from "./GamesHeaderFilterButtonNative";
import {
  GAMES_HEADER_CONTROL_HEIGHT,
  LEAGUE_HEADER_LABEL,
  MOBILE_GAMES_CARD_MAX_WIDTH,
} from "./gamesMobileLayout";
import {
  markWcGamesTabAnnouncementSeenNative,
  readWcGamesTabAnnouncementSeenNative,
} from "./wcTabAnnouncementSeenNative";
import {
  liveMarkPillCyberBase,
  liveMarkTextCyberBase,
} from "../../ui/liveMarkCyberStyles";
import type { GamesStackParamList } from "../../navigation/types";
import { useScheduleTeamsNative } from "./useScheduleTeamsNative";
import { useGamesPageSwipe } from "./useGamesPageSwipe";
import GamesDateNavigatorNative from "./GamesDateNavigatorNative";
import {
  gamesLeagueTitleEntering,
  gamesScheduleShellDaySwitchEntering,
  gamesScheduleShellPageEntering,
  gamesTopBarBracketEntering,
  gamesTopBarFilterEntering,
  gamesTopBarMenuEntering,
  useGamesListShellIntro,
} from "./gamesPageMotion";
import {
  MATCH_CARD_DISPLAY_FONT,
  MATCH_CARD_METRIC_FONT,
  MATCH_CARD_SCORE_FONT,
} from "./matchCardTypography";

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

/** Web `MatchCard` の `fmtKickoffDateTime` 相当 */
function formatKickoffDateTime(
  startAt: Date | null,
  language: "ja" | "en"
): string {
  if (!startAt) return "--:--";
  const timeZone = language === "en" ? "America/New_York" : "Asia/Tokyo";
  const locale = language === "en" ? "en-US" : "ja-JP";
  return startAt.toLocaleString(locale, {
    timeZone,
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function resolveFinalMetaOt(raw: Record<string, unknown>): boolean {
  const fm = raw.finalMeta as { ot?: boolean } | undefined;
  return Boolean(fm?.ot);
}

/** Web `MatchCardMobile` の isLive：公式 LIVE またはキックオフ経過後の予熱 */
function isEffectiveLive(game: Record<string, unknown>): boolean {
  const status = resolveGameStatus(game);
  if (status === "live") return true;
  if (status !== "scheduled") return false;
  const startAt = resolveGameStartAt(game);
  return startAt != null && Date.now() >= startAt.getTime();
}

/**
 * 試合カード中央：終了はスコア、ライブは LIVE＋スコア、それ以外はキックオフ
 */
function getGameCardCenterBlock(
  game: Record<string, unknown>,
  language: "ja" | "en"
): GameCardCenterBlock {
  const status = resolveGameStatus(game);
  const score = resolveGameScore(game);
  const startAt = resolveGameStartAt(game);
  const liveUi = isEffectiveLive(game);
  if (status === "final" && score) {
    const ot = resolveFinalMetaOt(game);
    const sub = `${language === "en" ? "Final" : "試合終了"}${
      ot ? " (OT)" : ""
    }`;
    return { variant: "score", home: score.home, away: score.away, subLine: sub };
  }
  if (liveUi && score) {
    const meta = resolveGameLiveMeta(game);
    const subLine =
      meta?.period || meta?.runningTime
        ? `${meta?.period ?? ""}${meta?.runningTime ? ` ${meta.runningTime}` : ""}`.trim()
        : null;
    return {
      variant: "liveScore",
      home: score.home,
      away: score.away,
      subLine: subLine || null,
    };
  }
  if (liveUi) {
    return { variant: "liveMark" };
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
  if (b.variant === "score" || b.variant === "liveScore") {
    return `${b.home} – ${b.away}`;
  }
  if (b.variant === "liveMark") {
    return language === "en" ? "Live" : "試合中";
  }
  return b.time;
}

function isSoccerLeague(leagueRaw: unknown): boolean {
  const league = String(leagueRaw ?? "").toLowerCase();
  return league === "pl" || league === "j1" || league === "wc";
}

function renderStatusLabel(
  game: Record<string, unknown>,
  language: "ja" | "en"
): string {
  const status = resolveGameStatus(game);
  if (status === "final") return language === "en" ? "Final" : "試合終了";
  /** API が scheduled のままでもキックオフ後はライブ扱い（Web `isMatchStartedForPredict` と同趣旨） */
  if (status === "live" || isEffectiveLive(game)) {
    return language === "en" ? "Live" : "試合中";
  }
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
  { id: "wc", label: "WC" },
  { id: "nba", label: "NBA" },
];
const LEAGUE_LINE_COLOR: Record<SupportedLeague, string> = {
  nba: "#60a5fa",
  wc: "#f59e0b",
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
  const navigation = useNavigation<NativeStackNavigationProp<GamesStackParamList>>();
  const insets = useSafeAreaInsets();
  const { fUser } = useFirebaseUser();
  const [filterOpen, setFilterOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showWcTabBadge, setShowWcTabBadge] = useState(false);
  const [gamesFilter, setGamesFilter] = useState<GamesFilterState>({
    selectedTeamIds: [],
    matchMode: "any",
    marginMin: "",
    marginMax: "",
  });
  const mainScrollRef = useRef<ScrollView | null>(null);
  const skipAutoAdvanceRef = useRef(false);
  const suppressAutoAdvanceForTodayRef = useRef(false);
  const [selectedGame, setSelectedGame] = useState<Record<string, unknown> | null>(
    null
  );
  const [isPredictModalOpen, setIsPredictModalOpen] = useState(false);
  /** 試合終了・未投稿で開くモバイル Web オーバーレイ相当（スコア入力なし） */
  /** Web `PredictionFormV2` overlay：開始済みかつ自分の投稿なし → スコア入力・送信ブロックを出さない */
  const [predictSpectatorStartedNoPost, setPredictSpectatorStartedNoPost] =
    useState(false);
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
        goalScorer?: unknown;
        postStats?: Record<string, unknown> | null;
      }
    >
  >({});
  const [myPredictionsReloadNonce, setMyPredictionsReloadNonce] = useState(0);
  const [countdownNowMs, setCountdownNowMs] = useState(() => Date.now());
  const [userDisplayName, setUserDisplayName] = useState("");
  const [language, setLanguage] = useState<"ja" | "en">("ja");
  /** ロード完了直後の日付チップのみ入場アニメ（窓移動での再マウント連打を防ぐ） */
  const [dayStripEntranceEnabled, setDayStripEntranceEnabled] = useState(true);
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
  const reduceMotion = useReducedMotion() ?? false;
  const { teams: scheduleTeams, nameById: teamNameById } =
    useScheduleTeamsNative(selectedLeague);
  const filteredGames = useMemo(
    () => applyNativeGamesFilter(games, gamesFilter, teamNameById),
    [games, gamesFilter, teamNameById]
  );
  const filterActive = useMemo(
    () => gamesFilterIsActive(gamesFilter),
    [gamesFilter]
  );
  const dateKeysForDayStrip = useMemo(() => {
    if (!filterActive) return dateKeysWithGames;
    return sortedUniqueDateKeysFromRows(
      applyNativeGamesFilter(peerGamesForSeries, gamesFilter, teamNameById)
    );
  }, [
    filterActive,
    dateKeysWithGames,
    peerGamesForSeries,
    gamesFilter,
    teamNameById,
  ]);
  const leagueHeaderLabel = useMemo(() => {
    const key = selectedLeague === "wc" ? "wc" : "nba";
    return LEAGUE_HEADER_LABEL[key];
  }, [selectedLeague]);

  useEffect(() => {
    void readWcGamesTabAnnouncementSeenNative().then((seen) => {
      if (!seen) setShowWcTabBadge(true);
    });
  }, []);

  useEffect(() => {
    if (selectedLeague === "wc" && showWcTabBadge) {
      void markWcGamesTabAnnouncementSeenNative();
      setShowWcTabBadge(false);
    }
  }, [selectedLeague, showWcTabBadge]);
  const teamRecordById = useTeamRecordMap(games, selectedLeague);
  const formatSideRecord = useCallback(
    (side: unknown, leagueRaw?: unknown) =>
      formatTeamRecordForCard(side, teamRecordById, leagueRaw ?? selectedLeague),
    [teamRecordById, selectedLeague]
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
    const homeRecord = formatSideRecord(g.home, g.league);
    const awayRecord = formatSideRecord(g.away, g.league);
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
      leagueRaw: g.league,
      homeSide: g.home,
      awaySide: g.away,
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
  const screenShellStyle = useMemo(
    () => [styles.card, { paddingTop: insets.top + spacing.sm, flex: 1, zIndex: 1 }],
    [insets.top]
  );
  /** 表示中の暦月に属する試合日だけストリップに出す */
  const dayStripDates = useMemo(() => {
    const monthPrefix = toDateKeyInTimeZone(selectedDate, TIMEZONE_JST).slice(0, 7);
    const parsed = dateKeysForDayStrip
      .map((key) => parseDateKeyInTimeZone(key, TIMEZONE_JST))
      .filter((d): d is Date => d != null)
      .filter((d) => toDateKeyInTimeZone(d, TIMEZONE_JST).startsWith(monthPrefix));
    if (parsed.length === 0) {
      return [startOfLocalDay(selectedDate)];
    }
    return parsed;
  }, [dateKeysForDayStrip, selectedDate]);

  const [adjacentMonthHasGames, setAdjacentMonthHasGames] = useState({
    prev: true,
    next: true,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    setAdjacentMonthHasGames((s) => ({ ...s, loading: true }));
    const prevAnchor = shiftCalendarMonthStart(selectedDate, -1, TIMEZONE_JST);
    const nextAnchor = shiftCalendarMonthStart(selectedDate, 1, TIMEZONE_JST);
    void Promise.all([
      fetchMonthHasGames({
        league: selectedLeague,
        monthAnchor: prevAnchor,
        timeZone: TIMEZONE_JST,
      }),
      fetchMonthHasGames({
        league: selectedLeague,
        monthAnchor: nextAnchor,
        timeZone: TIMEZONE_JST,
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
  }, [selectedDate, selectedLeague]);
  const selectedLeagueOption = useMemo(
    () => LEAGUE_OPTIONS.find((option) => option.id === selectedLeague) ?? LEAGUE_OPTIONS[0],
    [selectedLeague]
  );
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
    const isEn = language === "en";
    const roundLabelRaw = g.roundLabel;
    const roundLabel =
      typeof roundLabelRaw === "string" && roundLabelRaw.trim()
        ? roundLabelRaw.trim()
        : null;
    const seasonPhase = g.seasonPhase as
      | "regular"
      | "play_in"
      | "playoffs"
      | null
      | undefined;
    const seriesStanding = parseSeriesStandingFromRaw(g as Record<string, unknown>);
    const showSeriesRow =
      seriesStanding != null && isPlayoffStyleGameCard(seasonPhase, roundLabel);
    return {
      homeTitle: scoreboardTeamLabelForNextModal(g.league, homeN, isEn),
      awayTitle: scoreboardTeamLabelForNextModal(g.league, awayN, isEn),
      deckLabel: broadcastDeckTitleForNextModal(isEn, seasonPhase, roundLabel),
      kickoff: formatKickoffTime(resolveGameStartAt(g), language),
      homePalette: resolveTeamJerseyPalette(g.league, g.home, "#ff6b8a"),
      awayPalette: resolveTeamJerseyPalette(g.league, g.away, "#5aa4ff"),
      homeRecordLine: formatSideRecord(g.home, g.league),
      awayRecordLine: formatSideRecord(g.away, g.league),
      showSeriesRow,
      seriesHomeWins: showSeriesRow && seriesStanding ? seriesStanding.homeWins : null,
      seriesAwayWins: showSeriesRow && seriesStanding ? seriesStanding.awayWins : null,
    };
  }, [nextGameAfterPost, language, formatSideRecord]);

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
    if (predictSpectatorStartedNoPost) return;
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
    predictSpectatorStartedNoPost,
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
            goalScorer?: unknown;
            postStats?: Record<string, unknown> | null;
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
                goalScorer: rowData?.prediction?.goalScorer ?? null,
                postStats:
                  rowData?.stats && typeof rowData.stats === "object"
                    ? (rowData.stats as Record<string, unknown>)
                    : null,
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

  const gamesFilterKey = useMemo(
    () =>
      JSON.stringify([
        [...gamesFilter.selectedTeamIds].sort(),
        gamesFilter.matchMode,
        gamesFilter.marginMin,
        gamesFilter.marginMax,
      ]),
    [gamesFilter]
  );
  const selectedDayKey = toDateKeyInTimeZone(selectedDate, TIMEZONE_JST);
  const { scheduleBlockKey, listShellIntro, richScheduleMotion } =
    useGamesListShellIntro({
      reduceMotion,
      league: selectedLeague,
      selectedDayKey,
      filterKey: gamesFilterKey,
      isLoading: loading,
    });
  const cardListEntranceVariant = listShellIntro === "page" ? "full" : "light";
  const webGamesMotion = !reduceMotion;
  const gamesMotionKey = `${selectedLeague}|${gamesFilterKey}`;

  /** フェッチでスケルトン→本表示になった直後だけチップ入場を付け、その後は日付窓がずれても再アニメしない */
  useEffect(() => {
    if (loading) {
      setDayStripEntranceEnabled(true);
      return;
    }
    const t = setTimeout(() => setDayStripEntranceEnabled(false), 900);
    return () => clearTimeout(t);
  }, [loading]);

  useEffect(() => {
    mainScrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [selectedDate, selectedLeague, loading]);

  /**
   * 今日がすべて終了なら翌日へ（手動で今日に戻した直後など、窓内再フェッチなしのケース）。
   * 初回は `useTodayGames` のフェッチ完了時に同一バッチで寄せるため、loading 中は動かさない。
   */
  useEffect(() => {
    if (loading) return;
    if (skipAutoAdvanceRef.current) {
      skipAutoAdvanceRef.current = false;
      return;
    }
    const isToday = isSameLocalDay(startOfLocalDay(selectedDate), today);
    if (!isToday) {
      suppressAutoAdvanceForTodayRef.current = false;
      return;
    }
    if (suppressAutoAdvanceForTodayRef.current) return;
    if (!games.length) return;
    const allFinished = games.every(
      (game) => resolveGameStatus(game as Record<string, unknown>) === "final"
    );
    if (!allFinished) return;
    setSelectedDate((prev) => addDays(prev, 1));
  }, [loading, games, selectedDate, setSelectedDate, today]);

  function selectDateManually(nextDate: Date) {
    skipAutoAdvanceRef.current = true;
    suppressAutoAdvanceForTodayRef.current = true;
    setSelectedDate(nextDate);
  }

  function moveToTodayGameDay() {
    if (dayStripDates.length === 0) return;
    skipAutoAdvanceRef.current = true;
    suppressAutoAdvanceForTodayRef.current = true;
    const monthPrefix = toDateKeyInTimeZone(selectedDate, TIMEZONE_JST).slice(0, 7);
    const sorted = [...dayStripDates].sort((a, b) => a.getTime() - b.getTime());
    const todayKey = toDateKeyInTimeZone(today, TIMEZONE_JST);
    const inMonth = sorted.filter((d) =>
      toDateKeyInTimeZone(d, TIMEZONE_JST).startsWith(monthPrefix)
    );
    const pick =
      inMonth.find((d) => toDateKeyInTimeZone(d, TIMEZONE_JST) >= todayKey) ??
      inMonth[inMonth.length - 1];
    if (pick) setSelectedDate(pick);
  }

  function goPrevMonth() {
    skipAutoAdvanceRef.current = true;
    suppressAutoAdvanceForTodayRef.current = true;
    if (adjacentMonthHasGames.loading) return;
    setSelectedDate(shiftCalendarMonthStart(selectedDate, -1, TIMEZONE_JST));
  }

  function goNextMonth() {
    skipAutoAdvanceRef.current = true;
    suppressAutoAdvanceForTodayRef.current = true;
    if (adjacentMonthHasGames.loading) return;
    setSelectedDate(shiftCalendarMonthStart(selectedDate, 1, TIMEZONE_JST));
  }

  function goPrevGameDay() {
    skipAutoAdvanceRef.current = true;
    suppressAutoAdvanceForTodayRef.current = true;
    const keys = dateKeysForDayStrip;
    if (keys.length > 0) {
      const current = toDateKeyInTimeZone(selectedDate, TIMEZONE_JST);
      const idx = keys.indexOf(current);
      if (idx > 0) {
        setSelectedDate(parseDateKeyInTimeZone(keys[idx - 1]!, TIMEZONE_JST)!);
        return;
      }
      return;
    }
    goPrevDay();
  }

  function goNextGameDay() {
    skipAutoAdvanceRef.current = true;
    suppressAutoAdvanceForTodayRef.current = true;
    const keys = dateKeysForDayStrip;
    if (keys.length > 0) {
      const current = toDateKeyInTimeZone(selectedDate, TIMEZONE_JST);
      const idx = keys.indexOf(current);
      if (idx >= 0 && idx < keys.length - 1) {
        setSelectedDate(parseDateKeyInTimeZone(keys[idx + 1]!, TIMEZONE_JST)!);
        return;
      }
      return;
    }
    goNextDay();
  }

  const pageSwipeGesture = useGamesPageSwipe({
    onSwipeLeft: goNextGameDay,
    onSwipeRight: goPrevGameDay,
    enabled: !loading,
  });

  const predictOverlayMarketBar = useMemo(() => {
    if (!selectedGame?.id) return null;
    const g = selectedGame;
    const gameId = String(g.id);
    const homeName = resolveGameTeamName(g.home, g.homeTeamName, "HOME");
    const awayName = resolveGameTeamName(g.away, g.awayTeamName, "AWAY");
    const existingWinner = myPredictionByGameId[gameId]?.winner ?? null;
    const homePalette = resolveTeamJerseyPalette(g.league, g.home, "#ff6b8a");
    const awayPalette = resolveTeamJerseyPalette(g.league, g.away, "#5aa4ff");
    const marketBias = g.marketBias as { homePct?: number; awayPct?: number } | undefined;
    return {
      gameId,
      league: selectedLeague,
      status: resolveGameStatus(g),
      score: resolveGameScore(g),
      fallbackMarketBias:
        marketBias?.homePct != null && marketBias?.awayPct != null
          ? { homePct: marketBias.homePct, awayPct: marketBias.awayPct }
          : null,
      homeColor: homePalette.primary,
      awayColor: awayPalette.primary,
      homeLabel: toCompactTeamName(g.league, homeName),
      awayLabel: toCompactTeamName(g.league, awayName),
      compact: selectedLeague === "wc",
      userPredictionWinner: winner ?? existingWinner,
    };
  }, [selectedGame, selectedLeague, winner, myPredictionByGameId]);

  const predictScheduleMeta = useMemo((): PredictModalScheduleMeta | null => {
    if (!selectedGame) return null;
    if (resolveGameStatus(selectedGame) !== "scheduled") return null;
    const startAt = resolveGameStartAt(selectedGame);
    const kickoffValue = formatKickoffDateTime(startAt, language);
    const gameId = String(selectedGame.id ?? "");
    const broadcastLabels =
      selectedLeague === "wc"
        ? resolveWcBroadcastLabels(gameId, selectedGame)
        : [];
    if (!startAt && broadcastLabels.length === 0) return null;
    return { kickoffValue, broadcastLabels };
  }, [selectedGame, selectedLeague, language]);

  const wcGoalScorerPreview = useMemo((): PredictModalWcGoalScorer | null => {
    if (!selectedGame || selectedLeague !== "wc") return null;
    const gameId = String(selectedGame.id ?? "");
    const homeSide = selectedGame.home as { teamId?: string } | undefined;
    const awaySide = selectedGame.away as { teamId?: string } | undefined;
    const homeTeamId = homeSide?.teamId;
    const awayTeamId = awaySide?.teamId;
    const homeRaw = scoreHome.trim();
    const awayRaw = scoreAway.trim();
    if (homeRaw === "" || awayRaw === "") return null;
    const score = { home: Number(homeRaw), away: Number(awayRaw) };
    if (
      !Number.isInteger(score.home) ||
      !Number.isInteger(score.away) ||
      score.home < 0 ||
      score.away < 0
    ) {
      return null;
    }
    const storedPick = myPredictionByGameId[gameId]?.goalScorer;
    const pick = normalizeWcGoalScorerPick(storedPick);
    if (
      !pick ||
      !isWcGoalScorerPickValidForPredictedScore(
        pick,
        score,
        homeTeamId,
        awayTeamId
      )
    ) {
      return null;
    }
    const playerName =
      getWcSquadPlayer(pick.teamId, pick.playerId)?.name ?? pick.playerId;
    return { playerName, teamId: pick.teamId };
  }, [selectedGame, selectedLeague, scoreHome, scoreAway, myPredictionByGameId]);

  const predictMergedFinalPreview = useMemo(() => {
    if (!selectedGame || selectedLeague === undefined) return null;
    if (resolveGameStatus(selectedGame) !== "final") return null;
    const gameId = String(selectedGame.id ?? "");
    const stored = myPredictionByGameId[gameId];
    if (!stored) return null;
    const finalScore = resolveGameScore(selectedGame);
    if (!finalScore) return null;
    const homeSide = selectedGame.home as { teamId?: string } | undefined;
    const awaySide = selectedGame.away as { teamId?: string } | undefined;
    return buildPredictModalMergedFinalPreview({
      league: selectedLeague,
      language,
      finalScore,
      predictedScore: stored.score,
      stats: stored.postStats ?? null,
      goalScorer: stored.goalScorer,
      homeTeamId: homeSide?.teamId ?? null,
      awayTeamId: awaySide?.teamId ?? null,
      finalOt: resolveFinalMetaOt(selectedGame),
    });
  }, [selectedGame, selectedLeague, language, myPredictionByGameId]);

  async function openPredictModal(targetGame?: Record<string, unknown>) {
    const sourceGame = targetGame ?? selectedGame;
    if (!sourceGame) {
      setPredictSpectatorStartedNoPost(false);
      return;
    }
    const gameId = String(sourceGame.id ?? "");
    const existingPostId = myPostIdByGameId[gameId];
    const existingPrediction = myPredictionByGameId[gameId];
    const started = isGameStarted(sourceGame);
    /** Web 一覧カードの `onOpenPredict`：開始後・未投稿でもオーバーレイを開く（フォームだけ非表示） */
    const spectatorStartedNoPost = Boolean(started && !existingPostId);

    setPredictSpectatorStartedNoPost(spectatorStartedNoPost);
    setWinner(null);
    setScoreHome("");
    setScoreAway("");
    setPredictToolsTab(null);
    setSelectedGame(sourceGame);
    setIsPredictModalOpen(true);

    /** 編集モード初回ヒントはストレージ await で開幕をブロックしない（モーダル表示後に実行） */
    if (existingPostId) {
      void (async () => {
        try {
          const hintSeen = await readEditModeHintShown();
          if (!hintSeen) {
            Alert.alert(t.editModeTitle, t.editModeBody);
            await writeEditModeHintShown();
          }
        } catch {
          // ストレージ不可時は通知を省略（毎回出るよりマシ）
        }
      })();
    }

    if (spectatorStartedNoPost) return;

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
        void openPredictModal(g);
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

    if (!getUniterzApiBaseUrl()) {
      Alert.alert(t.apiBaseMissingTitle, t.apiBaseMissingBody);
      return;
    }

    setPredictSubmitting(true);
    try {
      const existingPostId = myPostIdByGameId[gameId];
      const isEditing = Boolean(existingPostId);
      if (existingPostId) {
        await updatePredictionPostApi(existingPostId, {
          winner,
          scoreHome: homeNum,
          scoreAway: awayNum,
        });
      } else {
        try {
          await createPredictionPostApi({
            gameId,
            winner,
            scoreHome: homeNum,
            scoreAway: awayNum,
          });
        } catch (err) {
          if (
            err instanceof PredictionApiError &&
            err.code === "duplicate" &&
            err.existingPostId
          ) {
            await updatePredictionPostApi(err.existingPostId, {
              winner,
              scoreHome: homeNum,
              scoreAway: awayNum,
            });
          } else {
            throw err;
          }
        }
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
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : t.postErrorBody;
      Alert.alert(t.postErrorTitle, msg);
    } finally {
      setPredictSubmitting(false);
    }
  }

  return (
    <View style={styles.screenRoot}>
      <View style={screenShellStyle}>
      <ScrollView
        ref={mainScrollRef}
        style={styles.mainScroll}
        contentContainerStyle={mainScrollContentStyle}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
      >
      <View style={styles.gamesHeaderShell}>
        <View style={styles.gamesHeaderTitleRow}>
          <View style={styles.gamesHeaderSideLeft}>
            <Animated.View
              key={`menu-${gamesMotionKey}`}
              entering={webGamesMotion ? gamesTopBarMenuEntering : undefined}
            >
              <CyberMenuButton
                size="md"
                accessibilityLabel={language === "ja" ? "メニュー" : "Menu"}
                onPress={() => setMenuOpen(true)}
                badge={
                  showWcTabBadge ? (
                    <View style={styles.menuWcBadge}>
                      <Text style={styles.menuWcBadgeText}>!</Text>
                    </View>
                  ) : null
                }
              />
            </Animated.View>
          </View>
          <View style={styles.gamesHeaderTitleCenter} pointerEvents="none">
            <Animated.Text
              key={`league-title-${gamesMotionKey}`}
              entering={webGamesMotion ? gamesLeagueTitleEntering : undefined}
              style={styles.gamesHeaderLeagueTitle}
              numberOfLines={1}
            >
              {leagueHeaderLabel}
            </Animated.Text>
          </View>
          <View style={styles.gamesHeaderSideRight}>
            <Animated.View
              key={`filter-${gamesMotionKey}`}
              entering={webGamesMotion ? gamesTopBarFilterEntering : undefined}
            >
              <GamesHeaderFilterButtonNative
                active={filterActive}
                onPress={() => setFilterOpen(true)}
                accessibilityLabel={t.filter}
              />
            </Animated.View>
            {selectedLeague === "nba" ? (
              <Animated.View
                key={`bracket-${gamesMotionKey}`}
                entering={webGamesMotion ? gamesTopBarBracketEntering : undefined}
              >
                <Pressable
                  style={styles.bracketButton}
                  onPress={() => navigation.navigate("PlayoffBracketView")}
                >
                  <Text style={styles.bracketButtonText}>{t.bracket}</Text>
                </Pressable>
              </Animated.View>
            ) : null}
          </View>
        </View>
      {loading ? (
        <View style={styles.dayStripSkeletonBlock}>
          <View style={styles.monthHeaderRow}>
            <View style={styles.dayStripSkeletonArrow} />
            <View style={styles.monthHeaderCenter}>
              <View style={styles.dayStripSkeletonMonthBar} />
            </View>
            <View style={styles.dayStripSkeletonArrow} />
          </View>
          <View style={styles.dayStripContent}>
            {[0, 1, 2, 3, 4].map((i) => (
              <View key={i} style={styles.dayStripSkeletonChip} />
            ))}
          </View>
        </View>
      ) : (
        <GamesDateNavigatorNative
          dates={dayStripDates}
          selectedDate={selectedDate}
          timeZone={TIMEZONE_JST}
          language={language}
          onSelectDate={selectDateManually}
          onPrevMonth={goPrevMonth}
          onNextMonth={goNextMonth}
          onMoveToToday={moveToTodayGameDay}
          canPrevMonth={!adjacentMonthHasGames.loading}
          canNextMonth={!adjacentMonthHasGames.loading}
          monthNavBusy={adjacentMonthHasGames.loading}
          entranceEnabled={dayStripEntranceEnabled}
          reduceMotion={reduceMotion}
          motionKey={gamesMotionKey}
        />
      )}
      </View>

      <GestureDetector gesture={pageSwipeGesture}>
      <View>
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
        <Animated.View
          key={`sched-${scheduleBlockKey}`}
          entering={
            webGamesMotion
              ? richScheduleMotion
                ? gamesScheduleShellPageEntering()
                : gamesScheduleShellDaySwitchEntering()
              : undefined
          }
        >
          <GameCardList
            games={filteredGames}
            enteringAnimationEnabled={webGamesMotion}
            entranceVariant={cardListEntranceVariant}
            predictedGameIds={predictedGameIds}
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
          />
        </Animated.View>
      ) : null}
      </View>
      </GestureDetector>
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
        openPredictModal={() => void openPredictModal()}
        onOpenCommunityPredictions={() => {
          const id = String(selectedGame?.id ?? "");
          if (!id) return;
          setSelectedGame(null);
          navigation.navigate("GamePredictions", { gameId: id });
        }}
        onClose={() => {
          setSelectedGame(null);
        }}
        styles={styles}
      />

      <PredictModal
        visible={isPredictModalOpen}
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
          setPredictSpectatorStartedNoPost(false);
          setSelectedGame(null);
        }}
        spectatorStartedNoPost={predictSpectatorStartedNoPost}
        predictionEditLockedAfterKickoff={
          selectedGame != null && isGameStarted(selectedGame)
        }
        predictData={predictModalData}
        overlayMarketBar={predictOverlayMarketBar}
        language={language}
        predictScheduleMeta={predictScheduleMeta}
        wcGoalScorerPreview={wcGoalScorerPreview}
        mergedFinalPreview={predictMergedFinalPreview}
      />
      {nextGameAfterPost && nextGameAfterPostDisplay ? (
        <PredictNextGameNativeModal
          visible
          title={t.nextGameModalTitle}
          sub={t.nextGameModalSub}
          deckLabel={nextGameAfterPostDisplay.deckLabel}
          skipLabel={t.nextGameModalSkip}
          primaryButtonLabel={t.nextGameModalYes}
          secondaryButtonLabel={t.nextGameModalNo}
          homeTitle={nextGameAfterPostDisplay.homeTitle}
          awayTitle={nextGameAfterPostDisplay.awayTitle}
          kickoff={nextGameAfterPostDisplay.kickoff}
          homePalette={nextGameAfterPostDisplay.homePalette}
          awayPalette={nextGameAfterPostDisplay.awayPalette}
          leagueRaw={nextGameAfterPost.league}
          homeSide={nextGameAfterPost.home}
          awaySide={nextGameAfterPost.away}
          homeRecordLine={nextGameAfterPostDisplay.homeRecordLine}
          awayRecordLine={nextGameAfterPostDisplay.awayRecordLine}
          showSeriesRow={nextGameAfterPostDisplay.showSeriesRow}
          seriesHomeWins={nextGameAfterPostDisplay.seriesHomeWins}
          seriesAwayWins={nextGameAfterPostDisplay.seriesAwayWins}
          onYes={(d) => void handleNextGameModalYes(d)}
          onNo={(d) => void handleNextGameModalNo(d)}
        />
      ) : null}
      <GamesTeamFilterPanelNative
        visible={filterOpen}
        onClose={() => setFilterOpen(false)}
        language={language}
        teams={scheduleTeams}
        initial={gamesFilter}
        onApply={setGamesFilter}
      />
      <SideMenuDrawerNative open={menuOpen} onClose={() => setMenuOpen(false)}>
        <GamesDrawerMenuNative
          league={selectedLeague === "wc" ? "wc" : "nba"}
          language={language}
          onSelectNba={() => {
            setSelectedLeague("nba");
            setMenuOpen(false);
          }}
          onSelectWorldCup={() => {
            setSelectedLeague("wc");
            setMenuOpen(false);
          }}
        />
      </SideMenuDrawerNative>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
    backgroundColor: "transparent",
    position: "relative",
  },
  card: {
    width: "100%",
    flex: 1,
    backgroundColor: "transparent",
    paddingHorizontal: 0,
    paddingBottom: spacing.xs,
    gap: 6,
  },
  gamesHeaderShell: {
    marginBottom: 8,
    marginTop: 0,
    width: "100%",
    gap: 4,
  },
  gamesHeaderTitleRow: {
    position: "relative",
    width: "100%",
    height: GAMES_HEADER_CONTROL_HEIGHT,
  },
  gamesHeaderSideLeft: {
    position: "absolute",
    left: 8,
    top: 0,
    height: GAMES_HEADER_CONTROL_HEIGHT,
    justifyContent: "center",
    zIndex: 20,
  },
  gamesHeaderSideRight: {
    position: "absolute",
    right: 8,
    top: 0,
    height: GAMES_HEADER_CONTROL_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 6,
    zIndex: 20,
  },
  gamesHeaderTitleCenter: {
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: [{ translateX: -72 }, { translateY: -10 }],
    width: 144,
    alignItems: "center",
    zIndex: 10,
  },
  gamesHeaderLeagueTitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 20,
    lineHeight: 22,
    fontFamily: DISPLAY_FONT_FAMILY,
    letterSpacing: 7,
    textTransform: "uppercase",
    textAlign: "center",
  },
  menuWcBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#fbbf24",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#fbbf24",
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 3,
  },
  menuWcBadgeText: {
    color: "#451a03",
    fontSize: 10,
    fontWeight: "900",
    lineHeight: 11,
  },
  /** DayStrip チップ単位の进入ラッパー（Web motion.div 相当） */
  dayStripChipAnimWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  mainScroll: {
    flex: 1,
    backgroundColor: "transparent",
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
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.34)",
    backgroundColor: "rgba(8,11,18,0.84)",
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#22d3ee",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  filterButtonText: {
    color: "rgba(224,250,254,0.88)",
    fontSize: 9,
    fontWeight: "700",
  },
  bracketButton: {
    minHeight: GAMES_HEADER_CONTROL_HEIGHT,
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
  /** Web `LeagueTabs` アクティブタブ相当：bg-white/10・border-white/20・rounded-lg */
  leagueChip: {
    minHeight: 32,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  leagueChipPressed: {
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  leagueChipText: {
    color: "#ffffff",
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700",
    fontFamily: DISPLAY_FONT_FAMILY,
    letterSpacing: 1.12,
    textTransform: "uppercase",
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
  /** 取得中は誤った「今日」チップで进入アニメが走らないようプレースホルダ */
  dayStripSkeletonBlock: {
    marginBottom: 1,
  },
  dayStripSkeletonArrow: {
    minHeight: 28,
    minWidth: 28,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  dayStripSkeletonMonthBar: {
    height: 18,
    width: 128,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  dayStripSkeletonChip: {
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
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
    gap: 12,
    paddingVertical: 2,
    paddingBottom: 3,
  },
  /** 試合日が多いとき横スクロール（Web DayStrip 相当） */
  dayStripScrollContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 2,
    paddingBottom: 3,
    paddingHorizontal: spacing.sm,
  },
  dayChip: {
    width: 48,
    height: 48,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.16)",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xs,
  },
  /** 今日だが選択中でない日 — 選択中のシアンと差別化（Last20 の当日強調と同系統） */
  dayChipToday: {
    borderColor: "rgba(250, 204, 21, 0.72)",
    shadowColor: "rgb(250, 204, 21)",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 2,
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
    marginTop: 4,
  },
  listContent: {
    gap: 10,
    paddingBottom: spacing.xl,
    paddingTop: 0,
    paddingHorizontal: 4,
  },
  gameCardOuter: {
    position: "relative",
    overflow: "visible",
    width: "100%",
    maxWidth: MOBILE_GAMES_CARD_MAX_WIDTH,
    alignSelf: "center",
  },
  cardFineShellBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  cardPressableBody: {
    flex: 1,
    zIndex: 1,
    backgroundColor: "transparent",
    paddingHorizontal: 8,
    paddingTop: 0,
    paddingBottom: 0,
    gap: 2,
  },
  cardFineInteriorContent: {
    paddingHorizontal: 8,
    paddingTop: 4,
    paddingBottom: 2,
    gap: 2,
  },
  cardLayerBase: {
    ...StyleSheet.absoluteFillObject,
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
  /** 角切りクリップは `MatchListCyberClipNative`（シェルは 3D pop 用に visible） */
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
    marginTop: 12,
    marginBottom: 0,
    gap: spacing.xs,
  },
  /** Web mobile dense `mt-3 text-xl` */
  roundLabelText: {
    flex: 1,
    color: "rgba(241,245,255,0.95)",
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 22,
    letterSpacing: 1.6,
    textAlign: "center",
    includeFontPadding: false,
    textTransform: "uppercase",
    fontFamily: MATCH_CARD_DISPLAY_FONT,
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
    width: 62,
    height: 62,
    borderRadius: 0,
    borderWidth: 0,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  /** WC 国旗: Web dense `w-[4.5rem] h-[3rem] mb-2` */
  teamMarkFlag: {
    width: 72,
    height: 48,
    marginBottom: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  /** MobileMatchCard NBA 等（一覧・プレビューと揃えてややコンパクト） */
  teamNameMain: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: 0.5,
    lineHeight: 14,
    marginTop: 0,
    marginBottom: 0,
    includeFontPadding: false,
    textTransform: "uppercase",
    fontFamily: MATCH_CARD_DISPLAY_FONT,
    maxWidth: "100%",
  },
  teamNameMainWc: {
    paddingRight: 0.5,
  },
  /** モバイル MatchCard: mc-record、Oxanium（チーム名に合わせて一段小さく） */
  teamRecordText: {
    color: "rgba(226,232,240,0.7)",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 12,
    marginTop: 2,
    letterSpacing: 0.2,
    includeFontPadding: false,
    fontFamily: MATCH_CARD_METRIC_FONT,
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
    color: "#ffffff",
    fontFamily: NUMERIC_FONT_FAMILY,
    fontSize: typography.body,
    lineHeight: 20,
    fontWeight: "700",
    letterSpacing: -0.35,
    paddingHorizontal: spacing.md,
    textAlign: "center",
    fontVariant: ["tabular-nums"],
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
  /** スコア行：MatchCard モバイル dense `text-lg` 相当 */
  centerTextScore: {
    textAlign: "center",
  },
  centerTextScoreWc: {
    marginTop: 2,
  },
  centerTextScoreNum: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
    fontStyle: "italic",
    lineHeight: 20,
    includeFontPadding: false,
    fontVariant: ["tabular-nums"],
    fontFamily: MATCH_CARD_SCORE_FONT,
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  centerTextScoreNumWc: {
    fontSize: 22,
    lineHeight: 24,
  },
  centerScoreDash: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 18,
    fontWeight: "900",
    fontStyle: "italic",
    lineHeight: 20,
    fontFamily: MATCH_CARD_SCORE_FONT,
  },
  centerScoreDashWc: {
    fontSize: 22,
    lineHeight: 24,
  },
  /** Qtr + 残り、または Final+OT（Web `text-xs opacity-80`） */
  centerSubline: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    lineHeight: 14,
    textAlign: "center",
    includeFontPadding: false,
    fontFamily: MATCH_CARD_DISPLAY_FONT,
  },
  centerSublineWc: {
    fontSize: 11,
    opacity: 0.8,
  },
  liveMetaText: {
    color: "#a8dbff",
    fontSize: 10,
    lineHeight: 11,
    textAlign: "center",
    includeFontPadding: false,
  },
  /** Web `LiveMatchMark` に寄せた LIVE ピル（一覧中央・スコアなし時は単独） */
  liveMarkWrap: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    gap: 4,
  },
  liveScoreStack: {
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    minHeight: 44,
  },
  liveMarkPill: liveMarkPillCyberBase,
  liveMarkText: liveMarkTextCyberBase,
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
    shadowColor: "rgb(0, 245, 255)",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 3,
  },
  wcBroadcastRow: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "baseline",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 12,
    marginTop: 4,
    paddingVertical: 4,
  },
  wcBroadcastLabel: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 12,
    fontWeight: "600",
    includeFontPadding: false,
    fontFamily: MATCH_CARD_DISPLAY_FONT,
  },
  wcBroadcastNames: {
    color: "rgba(207,250,254,0.9)",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2,
    textAlign: "center",
    includeFontPadding: false,
    fontFamily: MATCH_CARD_DISPLAY_FONT,
  },
  cardFooterShell: {
    width: "100%",
    paddingHorizontal: 8,
    paddingVertical: 2,
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
