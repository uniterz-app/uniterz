"use client";

import dynamic from "next/dynamic";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import {
  AnimatePresence,
  LazyMotion,
  domAnimation,
  m as motion,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CalendarRange,
  Check,
  ChevronDown,
  X,
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { getCachedGameDocForResult } from "@/lib/result/resultDetailFirestoreCache";
import { SCHEDULE_MY_POST_DELETED_EVENT } from "@/lib/games/scheduleMyPostSyncEvents";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import { nameBebas } from "@/lib/fonts";
import {
  cyberNoDataLabelStyle,
} from "@/lib/ui/cyberNoDataLabelStyle";
import ResultCard, {
  type ResultCardOpenAnchor,
} from "@/app/component/result/ResultCard";
const ResultDetail = dynamic(
  () => import("@/app/component/result/ResultDetail")
);
const MobileResultDetail = dynamic(
  () => import("@/app/component/result/mobile/MobileResultDetail")
);
import {
  ResultDayPipeGroup,
  type ResultDayPointsHeader,
} from "@/app/component/result/ResultDayPipeGroup";
import type { PredictionPostV2 } from "@/types/prediction-post-v2";
import type { ResultPlatform } from "@/lib/result/result-platform";
import {
  RESULT_WEB_DAY_STRIP_WIDTH_CLASS,
  RESULT_WEB_PIPE_RAIL_PX,
} from "@/lib/result/resultListWebLayout";
import {
  canDismissResultListPostNow,
  flattenResultDayGroups,
  isFinalResultPost,
  pruneDismissedResultListPostIds,
  RESULT_LIST_LEAGUE_TABS,
  RESULT_POSTS_MAX_CACHED,
  hasPointsV3Recorded,
  sumDayPointsV3,
  type PostWithMillis,
  type ResultDayGroup,
  type ResultListLeagueTab,
} from "@/lib/result/result-page-data";
import { UnderlineTabs } from "@/app/component/profile/ui/Tabs";
import {
  readDismissedResultPostIds,
  writeDismissedResultPostIds,
} from "@/lib/result/resultListDismissedPostIds";
import {
  parseGamePointsDistributionV1,
  rawPointsDistributionFromGameDoc,
  type GamePointsDistributionV1,
} from "@/lib/results/gamePointsDistribution";
import type { League } from "@/lib/leagues";
import { LEAGUE_DISPLAY } from "@/lib/leagues";
import {
  resultCardPageSlot,
  resultPageSlotItem,
} from "@/lib/result/resultCyberMotion";
import MatchCard, { type MatchCardProps } from "@/app/component/games/MatchCard";
import { toMatchCardProps } from "@/lib/games/transform";
import { fetchPlayoffSeriesPeerGames } from "@/lib/games/fetchPlayoffSeriesPeerGames";

const PredictionFormV2 = dynamic(
  () => import("@/app/component/predict/PredictionFormV2"),
  { ssr: false }
);

/** Delete ラベル用（かなり鮮やかな赤＋強い発光） */
const deleteConfirmDeleteLabelStyle: CSSProperties = {
  color: "#ff6363",
  textShadow:
    "0 0 16px rgba(255,90,90,1), 0 0 36px rgba(239,68,68,0.95), 0 0 64px rgba(220,38,38,0.75), 0 0 96px rgba(153,27,27,0.45)",
};

/** 一覧の複合フィルター（デフォルトはすべて通過） */
export type ResultListFilters = {
  outcome: "all" | "win" | "loss";
  /** 未確定＝試合前〜未確定、確定＝得点確定済み */
  settlement: "all" | "pending" | "final";
  league: "all" | League;
  /** Upset スコア（加点あり） */
  specialty: "none" | "upsetBonus";
  /** スコア精度（scorePrecision）の帯。確定投稿のみ */
  scorePrecisionTier: "all" | "high" | "mid" | "low";
  /** 総合スコア（pointsV3）の帯。確定投稿のみ */
  pointsTier: "all" | "high" | "mid" | "low";
  /** 試合日（一覧の日付見出し）の下限。YYYY-MM-DD、未指定は null */
  dateFrom: string | null;
  /** 試合日の上限（含む）。YYYY-MM-DD、未指定は null */
  dateTo: string | null;
};

const DEFAULT_RESULT_FILTERS: ResultListFilters = {
  outcome: "all",
  settlement: "all",
  league: "all",
  specialty: "none",
  scorePrecisionTier: "all",
  pointsTier: "all",
  dateFrom: null,
  dateTo: null,
};

function isDefaultResultFilters(f: ResultListFilters): boolean {
  return (
    f.outcome === DEFAULT_RESULT_FILTERS.outcome &&
    f.settlement === DEFAULT_RESULT_FILTERS.settlement &&
    f.league === DEFAULT_RESULT_FILTERS.league &&
    f.specialty === DEFAULT_RESULT_FILTERS.specialty &&
    f.scorePrecisionTier === DEFAULT_RESULT_FILTERS.scorePrecisionTier &&
    f.pointsTier === DEFAULT_RESULT_FILTERS.pointsTier &&
    f.dateFrom == null &&
    f.dateTo == null
  );
}

/** 詳細パネル内の条件のみ（試合日は外側ブロックのため点に含めない） */
function hasDetailFilters(f: ResultListFilters): boolean {
  return (
    f.settlement !== "all" ||
    f.specialty !== "none" ||
    f.scorePrecisionTier !== "all" ||
    f.pointsTier !== "all"
  );
}

function pointsV3Of(post: PostWithMillis): number | null {
  const v = post.stats?.pointsV3 ?? post.stats?.pointsV3Detail?.totalPoints;
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  return v;
}

/** ローカル暦の YYYY-MM-DD（日付見出しの `dateMs` と同じ基準） */
function localDayKeyFromMs(ms: number): string {
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dayMatchesDateRange(day: ResultDayGroup, f: ResultListFilters): boolean {
  if (f.dateFrom == null && f.dateTo == null) return true;
  const key = localDayKeyFromMs(day.dateMs);
  if (f.dateFrom != null && key < f.dateFrom) return false;
  if (f.dateTo != null && key > f.dateTo) return false;
  return true;
}

type MarketData = {
  homeRate: number;
  awayRate: number;
  drawRate?: number;
  total?: number;
};

type Props = {
  leagueTab: ResultListLeagueTab;
  onLeagueTabChange: (tab: ResultListLeagueTab) => void;
  /** hasNbaPost && hasWcPost のときだけタブを表示 */
  showResultLeagueTabs: boolean;
  grouped: ResultDayGroup[];
  loading: boolean;
  hasMore: boolean;
  sentinelRef: React.RefObject<HTMLDivElement | null>;
  setInfiniteScrollEnabled?: (enabled: boolean) => void;
  /** 自分の投稿を削除したあと一覧を取り直す（省略可） */
  refreshResultPosts?: () => void | Promise<void>;
  language: Language;
  platform: ResultPlatform;
  postsCacheCapped?: boolean;
  /** ログイン中 UID（指定時のみカード右上に予想修正へ遷移するボタンを出す） */
  viewerUid?: string | null;
};

function predictionWinState(post: PostWithMillis): boolean | null {
  const iw = post.stats?.isWin;
  if (iw === true) return true;
  if (iw === false) return false;
  const wc = post.stats?.pointsV3Detail?.winnerCorrect;
  if (wc === true) return true;
  if (wc === false) return false;
  return null;
}

/** 勝者予想が true/false で判定できる投稿だけ数え、的中数を返す */
function countWinnerHits(posts: readonly PostWithMillis[]): {
  wins: number;
  total: number;
} {
  let wins = 0;
  let total = 0;
  for (const p of posts) {
    const w = predictionWinState(p);
    if (w === null) continue;
    total += 1;
    if (w === true) wins += 1;
  }
  return { wins, total };
}

/** 日付行の得点表示（フィルタ後の確定分を合計。数値は強調表示用に分割） */
function dayPointsHeaderForList(
  finalShown: PostWithMillis[],
  pendingShown: PostWithMillis[],
  language: Language
): ResultDayPointsHeader {
  const msg = t(language);
  if (finalShown.length > 0 && finalShown.every(hasPointsV3Recorded)) {
    const total = sumDayPointsV3(finalShown);
    const fmt =
      Number.isInteger(total) || Math.abs(total - Math.round(total)) < 1e-6
        ? String(Math.round(total))
        : total.toFixed(1);
    const { wins: hitWins, total: hitTotal } = countWinnerHits(finalShown);
    const hitSuffix =
      hitTotal > 0
        ? ` ${msg.results.hitWinsSummary.replace("{hits}", String(hitWins)).replace("{total}", String(hitTotal))}`
        : "";
    return {
      variant: "total",
      value: fmt,
      prefix: msg.results.dayTotalScore,
      unit: msg.results.dayTotalScorePts,
      aria: `${msg.results.dayTotalScoreAria.replace("{pts}", fmt)}${hitSuffix}`,
      ...(hitTotal > 0 ? { hitWins, hitTotal } : {}),
    };
  }
  if (finalShown.length > 0 || pendingShown.length > 0) {
    return {
      variant: "pending",
      line: msg.results.dayPending,
      aria: msg.results.dayPendingDesc,
    };
  }
  return null;
}

function postMatchesOutcome(
  post: PostWithMillis,
  outcome: ResultListFilters["outcome"]
): boolean {
  if (outcome === "all") return true;
  if (!isFinalResultPost(post)) return false;
  const w = predictionWinState(post);
  if (outcome === "win") return w === true;
  if (outcome === "loss") return w === false;
  return true;
}

function postMatchesPointsTier(
  post: PostWithMillis,
  tier: ResultListFilters["pointsTier"]
): boolean {
  if (tier === "all") return true;
  if (!isFinalResultPost(post)) return false;
  const v = pointsV3Of(post);
  if (v === null) return false;
  if (tier === "high") return v >= 7;
  if (tier === "mid") return v >= 4 && v < 7;
  if (tier === "low") return v < 4;
  return true;
}

function scorePrecisionOf(post: PostWithMillis): number | null {
  const v = post.stats?.scorePrecision;
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  return v;
}

function postMatchesScorePrecisionTier(
  post: PostWithMillis,
  tier: ResultListFilters["scorePrecisionTier"]
): boolean {
  if (tier === "all") return true;
  if (!isFinalResultPost(post)) return false;
  const v = scorePrecisionOf(post);
  if (v === null) return false;
  if (tier === "high") return v >= 7;
  if (tier === "mid") return v >= 4 && v < 7;
  if (tier === "low") return v < 4;
  return true;
}

function postMatchesSpecialty(
  post: PostWithMillis,
  sp: ResultListFilters["specialty"]
): boolean {
  if (sp === "none") return true;
  if (!isFinalResultPost(post)) return false;
  const pts = post.stats?.upsetPoints ?? 0;
  const hit = post.stats?.upsetHit === true;
  return pts > 0 || hit;
}

function postMatchesFilters(post: PostWithMillis, f: ResultListFilters): boolean {
  if (f.settlement === "pending" && isFinalResultPost(post)) return false;
  if (f.settlement === "final" && !isFinalResultPost(post)) return false;
  if (f.league !== "all" && post.league !== f.league) return false;
  if (!postMatchesOutcome(post, f.outcome)) return false;
  if (!postMatchesPointsTier(post, f.pointsTier)) return false;
  if (!postMatchesScorePrecisionTier(post, f.scorePrecisionTier)) return false;
  if (!postMatchesSpecialty(post, f.specialty)) return false;
  return true;
}

/** 全画面詳細オーバーレイ。transformOrigin をタップ座標にして「押した位置から」拡大する */
function detailFullscreenPanelStyle(
  anchor: ResultCardOpenAnchor | null
): CSSProperties {
  const origin =
    anchor != null
      ? `${anchor.clientX}px ${anchor.clientY}px`
      : "50% 50%";

  return {
    position: "fixed",
    inset: 0,
    width: "100%",
    height: "100%",
    maxWidth: "none",
    maxHeight: "none",
    margin: 0,
    transformOrigin: origin,
    pointerEvents: "auto",
    zIndex: 10,
  };
}

/** 一覧に出ている試合日キーに対応する表示ラベル */
function dateLabelForDayKey(
  grouped: readonly ResultDayGroup[],
  key: string
): string {
  const g = grouped.find((d) => localDayKeyFromMs(d.dateMs) === key);
  return g?.dateLabel ?? key;
}

export default function ResultListWithOverlay({
  leagueTab,
  onLeagueTabChange,
  showResultLeagueTabs,
  grouped,
  loading,
  hasMore,
  sentinelRef,
  setInfiniteScrollEnabled,
  refreshResultPosts,
  language,
  platform,
  postsCacheCapped = false,
  viewerUid = null,
}: Props) {
  const [openPostId, setOpenPostId] = useState<string | null>(null);
  const [detailAnchor, setDetailAnchor] = useState<ResultCardOpenAnchor | null>(
    null
  );
  const [market, setMarket] = useState<MarketData | null>(null);
  const [pointsDistribution, setPointsDistribution] =
    useState<GamePointsDistributionV1 | null>(null);
  const [pointsDistributionLoading, setPointsDistributionLoading] =
    useState(false);
  const [filters, setFilters] = useState<ResultListFilters>(() => ({
    ...DEFAULT_RESULT_FILTERS,
  }));
  /** キックオフ前後でゴミ箱表示を切り替えるための現在時刻（30 秒ごと更新） */
  const [listNowTick, setListNowTick] = useState(() => Date.now());
  const [dismissedPostIds, setDismissedPostIds] = useState<Set<string>>(
    () => new Set()
  );
  const dismissedFromStorageLoadedRef = useRef(false);
  /** ゴミ箱：削除 API 実行前の確認 */
  const [deleteConfirmPost, setDeleteConfirmPost] =
    useState<PostWithMillis | null>(null);
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  const deleteSubmittingRef = useRef(false);
  const prefersReducedMotion = useReducedMotion();

  const isMobile = platform === "mobile";
  const gamesRoutePrefix = isMobile ? "/mobile" : "/web";
  const m = t(language);

  /** リザルト一覧から予想をオーバーレイで修正 */
  type ResultPredictOverlayState =
    | null
    | { phase: "loading"; post: PredictionPostV2 }
    | { phase: "ready"; post: PredictionPostV2; game: MatchCardProps }
    | { phase: "error"; post: PredictionPostV2 };

  const [predictOverlay, setPredictOverlay] =
    useState<ResultPredictOverlayState>(null);
  const [predictStandingsOpen, setPredictStandingsOpen] = useState(false);
  const predictOverlayOverflowPrevRef = useRef<string | null>(null);

  const closePredictOverlay = useCallback(() => {
    setPredictStandingsOpen(false);
    setPredictOverlay(null);
  }, []);

  const requestPredictEditFromCard = useCallback((post: PredictionPostV2) => {
    setPredictStandingsOpen(false);
    setPredictOverlay({ phase: "loading", post });
  }, []);

  useEffect(() => {
    if (!predictOverlay || predictOverlay.phase !== "loading") return;
    const { post } = predictOverlay;
    let cancelled = false;
    void (async () => {
      try {
        const snap = await getDoc(doc(db, "games", post.gameId));
        if (cancelled) return;
        if (!snap.exists()) {
          setPredictOverlay({ phase: "error", post });
          return;
        }
        const raw = { id: post.gameId, ...snap.data() };
        const peers = await fetchPlayoffSeriesPeerGames(
          raw as Record<string, unknown>
        );
        const game = toMatchCardProps(raw as any, {
          dense: isMobile,
          peerGamesForSeriesInference: peers,
        });
        if (!cancelled) setPredictOverlay({ phase: "ready", post, game });
      } catch {
        if (!cancelled) setPredictOverlay({ phase: "error", post });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [predictOverlay, isMobile]);

  useEffect(() => {
    if (!predictOverlay) return;
    predictOverlayOverflowPrevRef.current = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = openPostId
        ? "hidden"
        : predictOverlayOverflowPrevRef.current ?? "";
    };
  }, [predictOverlay, openPostId]);

  useEffect(() => {
    if (!predictOverlay) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || predictStandingsOpen) return;
      closePredictOverlay();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [predictOverlay, predictStandingsOpen, closePredictOverlay]);

  const predictFormUser = useMemo(() => {
    const u = auth.currentUser;
    return {
      name:
        (u?.displayName?.trim() ||
          m.results.user) as string,
      avatarUrl: u?.photoURL ?? undefined,
      verified: !!u?.emailVerified,
    };
  }, [language, predictOverlay]);

  const setFilterDateFrom = useCallback((raw: string) => {
    setFilters((s) => {
      const dateFrom = raw.trim() || null;
      let dateTo = s.dateTo;
      if (dateFrom && dateTo && dateFrom > dateTo) dateTo = dateFrom;
      return { ...s, dateFrom, dateTo };
    });
  }, []);

  const setFilterDateTo = useCallback((raw: string) => {
    setFilters((s) => {
      const dateTo = raw.trim() || null;
      let dateFrom = s.dateFrom;
      if (dateFrom && dateTo && dateTo < dateFrom) dateFrom = dateTo;
      return { ...s, dateFrom, dateTo };
    });
  }, []);

  const clearDateRangeOnly = useCallback(() => {
    setFilters((s) => ({ ...s, dateFrom: null, dateTo: null }));
  }, []);

  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [detailFiltersOpen, setDetailFiltersOpen] = useState(false);

  /** 試合日の開始／終了用カスタムピッカー（どちらを開いているか） */
  const [matchDayPickerOpen, setMatchDayPickerOpen] = useState<null | "from" | "to">(
    null
  );
  const matchDayPickerRootRef = useRef<HTMLDivElement>(null);
  const matchDayListboxPortalRef = useRef<HTMLDivElement>(null);
  const fromDateTriggerRef = useRef<HTMLButtonElement>(null);
  const toDateTriggerRef = useRef<HTMLButtonElement>(null);

  /** 試合日リストボックスを body 固定配置する矩形（パネル overflow ではみ出し防止） */
  const [matchDayListboxBox, setMatchDayListboxBox] = useState<{
    top: number;
    left: number;
    width: number;
    maxH: number;
  } | null>(null);

  const updateMatchDayListboxBox = useCallback(() => {
    if (matchDayPickerOpen == null) {
      setMatchDayListboxBox(null);
      return;
    }
    const btn =
      matchDayPickerOpen === "from"
        ? fromDateTriggerRef.current
        : toDateTriggerRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const gap = 6;
    const margin = 10;
    const maxH = Math.min(
      15 * 16,
      Math.max(120, window.innerHeight - r.bottom - gap - margin)
    );
    const width = Math.max(r.width, 168);
    const maxLeft = window.innerWidth - width - margin;
    const left = Math.max(margin, Math.min(r.left, maxLeft));
    setMatchDayListboxBox({
      top: r.bottom + gap,
      left,
      width,
      maxH,
    });
  }, [matchDayPickerOpen]);

  useLayoutEffect(() => {
    updateMatchDayListboxBox();
    if (matchDayPickerOpen == null) return;
    const onScrollOrResize = () => updateMatchDayListboxBox();
    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("scroll", onScrollOrResize, true);
    return () => {
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("scroll", onScrollOrResize, true);
    };
  }, [matchDayPickerOpen, updateMatchDayListboxBox]);

  useEffect(() => {
    if (matchDayPickerOpen == null) return;
    const onPointerDown = (e: PointerEvent) => {
      const root = matchDayPickerRootRef.current;
      const menu = matchDayListboxPortalRef.current;
      const t = e.target as Node;
      if (root?.contains(t) || menu?.contains(t)) return;
      setMatchDayPickerOpen(null);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [matchDayPickerOpen]);

  useEffect(() => {
    if (matchDayPickerOpen == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMatchDayPickerOpen(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [matchDayPickerOpen]);

  useEffect(() => {
    if (!filterPanelOpen) setMatchDayPickerOpen(null);
  }, [filterPanelOpen]);

  const resultLeagueTabLabels = useMemo(
    () =>
      Object.fromEntries(
        RESULT_LIST_LEAGUE_TABS.map((lg) => [lg, LEAGUE_DISPLAY[lg]])
      ) as Record<ResultListLeagueTab, string>,
    []
  );

  const availableDayKeysAsc = useMemo(() => {
    const set = new Set<string>();
    for (const d of grouped) {
      set.add(localDayKeyFromMs(d.dateMs));
    }
    return Array.from(set).sort();
  }, [grouped]);

  const dateFromOptions = useMemo(
    () =>
      availableDayKeysAsc.filter(
        (k) => !filters.dateTo || k <= filters.dateTo
      ),
    [availableDayKeysAsc, filters.dateTo]
  );

  const dateToOptions = useMemo(
    () =>
      availableDayKeysAsc.filter(
        (k) => !filters.dateFrom || k >= filters.dateFrom
      ),
    [availableDayKeysAsc, filters.dateFrom]
  );

  useEffect(() => {
    const valid = new Set(availableDayKeysAsc);
    setFilters((s) => {
      let df = s.dateFrom;
      let dt = s.dateTo;
      if (df && !valid.has(df)) df = null;
      if (dt && !valid.has(dt)) dt = null;
      if (df && dt && df > dt) dt = df;
      if (df === s.dateFrom && dt === s.dateTo) return s;
      return { ...s, dateFrom: df, dateTo: dt };
    });
  }, [availableDayKeysAsc]);


  useEffect(() => {
    setInfiniteScrollEnabled?.(!postsCacheCapped);
  }, [postsCacheCapped, setInfiniteScrollEnabled]);

  useEffect(() => {
    const id = window.setInterval(() => setListNowTick(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const flat = flattenResultDayGroups(grouped);
    setDismissedPostIds((prev) => {
      const base = dismissedFromStorageLoadedRef.current
        ? prev
        : readDismissedResultPostIds();
      dismissedFromStorageLoadedRef.current = true;
      const pruned = pruneDismissedResultListPostIds(
        base,
        flat,
        listNowTick
      );
      const unchanged =
        pruned.size === prev.size &&
        [...pruned].every((x) => prev.has(x)) &&
        [...prev].every((x) => pruned.has(x));
      if (unchanged) return prev;
      writeDismissedResultPostIds(pruned);
      return pruned;
    });
  }, [grouped, listNowTick]);

  const filteredGrouped = useMemo(() => {
    return grouped
      .filter((day) => dayMatchesDateRange(day, filters))
      .map((day) => ({
        ...day,
        pending: day.pending.filter((p) => postMatchesFilters(p, filters)),
        final: day.final.filter((p) => postMatchesFilters(p, filters)),
      }))
      .filter((day) => day.pending.length + day.final.length > 0);
  }, [grouped, filters]);

  const visibleGrouped = useMemo(
    () =>
      filteredGrouped
        .map((day) => ({
          ...day,
          pending: day.pending.filter((p) => !dismissedPostIds.has(p.id)),
          final: day.final.filter((p) => !dismissedPostIds.has(p.id)),
        }))
        .filter((day) => day.pending.length + day.final.length > 0),
    [filteredGrouped, dismissedPostIds]
  );

  /** フィルター＋一覧除外適用後の件数（少件数時の入場アニメ・content-visibility 制御に使用） */
  const filteredTotalLoaded = useMemo(
    () =>
      visibleGrouped.reduce(
        (a, d) => a + d.pending.length + d.final.length,
        0
      ),
    [visibleGrouped]
  );

  const selectedPost = useMemo(() => {
    if (!openPostId) return null;
    for (const day of filteredGrouped) {
      for (const p of day.pending) {
        if (p.id === openPostId) return p;
      }
      for (const p of day.final) {
        if (p.id === openPostId) return p;
      }
    }
    return null;
  }, [filteredGrouped, openPostId]);

  const close = useCallback(() => {
    setOpenPostId(null);
    setDetailAnchor(null);
    setMarket(null);
    setPointsDistribution(null);
    setPointsDistributionLoading(false);
  }, []);

  const dismissPostFromList = useCallback(
    async (post: PostWithMillis): Promise<boolean> => {
      if (!canDismissResultListPostNow(post, Date.now())) return false;
      const user = auth.currentUser;
      if (!user) return false;

      let deleted = false;
      try {
        const token = await user.getIdToken();
        const res = await fetch(
          `/api/posts_v2/${encodeURIComponent(post.id)}`,
          {
            method: "DELETE",
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            credentials: "include",
          }
        );
        if (res.status === 403) return false;
        deleted = res.ok || res.status === 404;
      } catch {
        return false;
      }
      if (!deleted) return false;

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent(SCHEDULE_MY_POST_DELETED_EVENT, {
            detail: { gameId: post.gameId },
          })
        );
      }

      if (openPostId === post.id) close();

      setDismissedPostIds((prev) => {
        if (!prev.has(post.id)) return prev;
        const next = new Set(prev);
        next.delete(post.id);
        writeDismissedResultPostIds(next);
        return next;
      });

      await refreshResultPosts?.();
      return true;
    },
    [close, openPostId, refreshResultPosts]
  );

  const confirmDismissPostFromList = useCallback(async () => {
    const post = deleteConfirmPost;
    if (!post || deleteSubmittingRef.current) return;
    deleteSubmittingRef.current = true;
    setDeleteInProgress(true);
    try {
      const ok = await dismissPostFromList(post);
      if (ok) setDeleteConfirmPost(null);
    } finally {
      deleteSubmittingRef.current = false;
      setDeleteInProgress(false);
    }
  }, [deleteConfirmPost, dismissPostFromList]);

  useEffect(() => {
    if (!deleteConfirmPost) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || deleteInProgress) return;
      setDeleteConfirmPost(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [deleteConfirmPost, deleteInProgress]);

  const open = useCallback(
    (post: PredictionPostV2 | PostWithMillis, anchor: ResultCardOpenAnchor) => {
      setOpenPostId(post.id);
      setDetailAnchor(anchor);
      setMarket(null);
      setPointsDistribution(null);
      setPointsDistributionLoading(false);
    },
    []
  );

  const detailPanelStyle = useMemo(
    () => detailFullscreenPanelStyle(detailAnchor),
    [detailAnchor]
  );

  useEffect(() => {
    if (!openPostId) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [openPostId]);

  useEffect(() => {
    if (!openPostId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openPostId, close]);

  useEffect(() => {
    if (!openPostId) return;
    const post = selectedPost;
    if (!post?.gameId) {
      setPointsDistributionLoading(false);
      setPointsDistribution(null);
      return;
    }

    let cancelled = false;
    setPointsDistributionLoading(true);
    (async () => {
      try {
        const { exists, data: d } = await getCachedGameDocForResult(post.gameId);
        if (cancelled) return;
        if (!exists || !d) {
          if (!cancelled) {
            setMarket(null);
            setPointsDistribution(null);
          }
          return;
        }
        const marketRaw = d.market as Record<string, unknown> | undefined;
        const pdRaw = rawPointsDistributionFromGameDoc(d);
        if (!cancelled) {
          if (marketRaw) {
            setMarket({
              homeRate: Number(marketRaw.homeRate ?? 0),
              awayRate: Number(marketRaw.awayRate ?? 0),
              drawRate:
                marketRaw.drawRate == null ? undefined : Number(marketRaw.drawRate),
              total: marketRaw.total == null ? undefined : Number(marketRaw.total),
            });
          }
          setPointsDistribution(parseGamePointsDistributionV1(pdRaw));
        }
      } catch {
        if (!cancelled) {
          setMarket(null);
          setPointsDistribution(null);
        }
      } finally {
        if (!cancelled) setPointsDistributionLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [openPostId, selectedPost]);

  /** ルートの perspective 等が fixed の包含ブロックになるため、オーバーレイは body 直下に描画 */
  const [overlayPortalReady, setOverlayPortalReady] = useState(false);
  useEffect(() => {
    setOverlayPortalReady(true);
  }, []);

  const fc = {
    panelTitle: m.results.filterCollapsedLabel,
    reset: m.results.filterReset,
    filterFoldCollapsedLabel: m.results.filterTitle,
    filterFoldCollapse: m.results.filterClose,
    outcome: m.results.filterOutcome,
    settlement: m.results.filterMatchStatus,
    league: m.results.filterLeague,
    upsetScore: m.results.filterUpsetScore,
    scorePrecision: m.results.filterScoreAccuracy,
    totalScore: m.results.filterTotalScore,
    outcomeOpt: { all: m.results.filterAll, win: m.results.filterWins, loss: m.results.filterLosses },
    settlementOpt: {
      all: m.results.filterAll,
      pending: m.results.filterPendingStatus,
      final: m.results.filterFinalStatus,
    },
    leagueAll: m.results.filterAll,
    upsetOpt: {
      none: m.results.filterNone,
      upsetBonus: m.results.filterBonusPts,
    },
    tierOpt: {
      all: m.results.filterAll,
      high: m.results.filterHighScore,
      mid: m.results.filterMidScore,
      low: m.results.filterLowScore,
    },
    matchDaySection: m.results.filterMatchDay,
    datePlaceholder: m.results.filterSelect,
    noDaysYet: m.results.filterNoDaysLoaded,
    dateFromLabel: m.results.filterFrom,
    dateToLabel: m.results.filterTo,
    clearDateRange: m.results.filterClearPeriod,
    detailToggle: m.results.filterMore,
    detailHint: m.results.filterMoreDesc,
    groupAria: m.results.filterResultList,
  };

  const filterChipClass = (active: boolean) =>
    [
      "rounded-xl border font-semibold tracking-wide transition-colors",
      isMobile ? "px-2 py-1.5 text-[11px]" : "px-3 py-2 text-xs sm:text-sm",
      active
        ? "border-cyan-200/35 bg-cyan-500/20 text-cyan-50 shadow-[0_0_14px_rgba(34,211,238,0.12)]"
        : "border-white/12 bg-white/[0.04] text-white/70 hover:border-white/18 hover:text-white/90",
    ].join(" ");

  const totalLoaded = grouped.reduce(
    (a, d) => a + d.pending.length + d.final.length,
    0
  );

  const easeOut = [0.22, 1, 0.36, 1] as const;
  const off = prefersReducedMotion
    ? { opacity: 1, y: 0 }
    : undefined;

  const pageSlotVariants: Variants = prefersReducedMotion
    ? { hidden: {}, show: {} }
    : resultPageSlotItem;

  const resultCardSlotVariants: Variants = prefersReducedMotion
    ? { hidden: {}, show: {} }
    : resultCardPageSlot;

  let entrySlot = 0;
  const takeEntrySlot = () => entrySlot++;

  const pageMotionRoot = prefersReducedMotion
    ? { initial: false as const, animate: undefined }
    : { initial: "hidden" as const, animate: "show" as const };

  return (
    <LazyMotion features={domAnimation}>
    <>
      <motion.div
        {...pageMotionRoot}
        className={[
          "relative z-20",
          isMobile ? "space-y-3" : "space-y-4",
        ].join(" ")}
      >
        {showResultLeagueTabs ? (
          <motion.div
            variants={pageSlotVariants}
            custom={takeEntrySlot()}
            className={[
              isMobile ? "mb-4 -mx-[18px]" : "mb-5 -mx-4",
            ].join(" ")}
          >
            <UnderlineTabs
              layout="split"
              value={leagueTab}
              onChange={(tab) => {
                onLeagueTabChange(tab);
                setOpenPostId(null);
                setDetailAnchor(null);
                setMatchDayPickerOpen(null);
                setFilters((s) => ({
                  ...s,
                  dateFrom: null,
                  dateTo: null,
                }));
              }}
              items={RESULT_LIST_LEAGUE_TABS}
              labelMap={resultLeagueTabLabels}
              size={isMobile ? "md" : "lg"}
            />
          </motion.div>
        ) : null}

        <motion.div
          variants={pageSlotVariants}
          custom={takeEntrySlot()}
          className={isMobile ? "relative z-30 isolate mb-2" : "mb-2 flex w-full gap-0"}
        >
          {!isMobile ? (
            <div
              className="shrink-0"
              style={{ width: RESULT_WEB_PIPE_RAIL_PX }}
              aria-hidden
            />
          ) : null}
          <div
            className={[
              "relative z-30 isolate min-w-0",
              isMobile ? "w-full" : "flex-1",
            ].join(" ")}
          >
            <div className={isMobile ? "w-full" : RESULT_WEB_DAY_STRIP_WIDTH_CLASS}>
          <button
            type="button"
            aria-expanded={filterPanelOpen}
            aria-label={
              filterPanelOpen
                ? fc.filterFoldCollapse
                : fc.filterFoldCollapsedLabel
            }
            className="flex w-full items-center justify-between gap-2 rounded-xl border border-white/15 bg-black/20 px-3 py-2.5 text-left shadow-[0_4px_24px_rgba(0,0,0,0.25)] backdrop-blur-md backdrop-saturate-150 transition hover:border-cyan-400/35 hover:bg-black/30"
            onClick={() => setFilterPanelOpen((o) => !o)}
          >
            <span className="flex items-center gap-2 text-[11px] font-semibold text-white sm:text-xs">
              <ChevronDown
                className={[
                  "h-4 w-4 shrink-0 text-white/60 transition-transform duration-200",
                  filterPanelOpen ? "rotate-180" : "",
                ].join(" ")}
                aria-hidden
              />
              {filterPanelOpen
                ? fc.filterFoldCollapse
                : fc.filterFoldCollapsedLabel}
              {!isDefaultResultFilters(filters) ? (
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.7)]"
                  aria-hidden
                />
              ) : null}
            </span>
          </button>

          {filterPanelOpen ? (
        <motion.div
          className={[
            "absolute left-0 right-0 top-full z-40 mt-2 max-h-[min(72vh,640px)] overflow-y-auto overflow-x-hidden overscroll-contain rounded-2xl border border-white/18 bg-black/30 px-3 py-3 shadow-[0_16px_48px_rgba(0,0,0,0.55)] backdrop-blur-xl backdrop-saturate-150 sm:px-4 sm:py-3.5",
            isMobile ? "pb-2" : "pb-3",
          ].join(" ")}
          role="group"
          aria-label={fc.groupAria}
          initial={off ? false : "hidden"}
          animate="visible"
          variants={
            prefersReducedMotion
              ? undefined
              : {
                  hidden: {},
                  visible: {
                    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
                  },
                }
          }
        >
          {(fc.panelTitle || !isDefaultResultFilters(filters)) && (
            <div
              className={[
                "mb-3 flex items-center gap-2",
                fc.panelTitle ? "justify-between" : "justify-end",
              ].join(" ")}
            >
              {fc.panelTitle ? (
                <span className="text-[11px] font-semibold uppercase tracking-wider text-white/50 sm:text-xs">
                  {fc.panelTitle}
                </span>
              ) : null}
              {!isDefaultResultFilters(filters) ? (
                <button
                  type="button"
                  className="rounded-lg border border-white/14 bg-white/6 px-2.5 py-1 text-[11px] font-semibold text-white/80 transition hover:border-cyan-400/30 hover:text-white"
                  onClick={() => {
                    setFilters({ ...DEFAULT_RESULT_FILTERS });
                    setDetailFiltersOpen(false);
                    setFilterPanelOpen(false);
                  }}
                >
                  {fc.reset}
                </button>
              ) : null}
            </div>
          )}

          <div className="mb-3">
            <div className="mb-1.5 text-[10px] font-medium text-white/40 sm:text-[11px]">
              {fc.outcome}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {(["all", "win", "loss"] as const).map((k) => (
                <motion.button
                  key={k}
                  type="button"
                  aria-pressed={filters.outcome === k}
                  onClick={() =>
                    setFilters((s) => ({ ...s, outcome: k }))
                  }
                  variants={
                    prefersReducedMotion
                      ? undefined
                      : {
                          hidden: { opacity: 0, y: 8 },
                          visible: {
                            opacity: 1,
                            y: 0,
                            transition: { duration: 0.24, ease: easeOut },
                          },
                        }
                  }
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
                  whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
                  className={filterChipClass(filters.outcome === k)}
                >
                  {fc.outcomeOpt[k]}
                </motion.button>
              ))}
            </div>
          </div>

          <div className="mb-3">
            <div className="mb-2 flex items-center gap-2">
              <CalendarRange
                className="h-3.5 w-3.5 shrink-0 text-cyan-400/75"
                aria-hidden
              />
              <div className="text-[10px] font-medium text-white/40 sm:text-[11px]">
                {fc.matchDaySection}
              </div>
            </div>
            {availableDayKeysAsc.length === 0 ? (
              <p className="text-[10px] leading-relaxed text-white/45">
                {fc.noDaysYet}
              </p>
            ) : (
              <div
                ref={matchDayPickerRootRef}
                className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
              >
                <div className="min-w-0 flex-1 sm:min-w-40">
                  <span className="mb-1 block text-[10px] font-medium tracking-wide text-cyan-200/45 sm:text-[11px]">
                    {fc.dateFromLabel}
                  </span>
                  <button
                    ref={fromDateTriggerRef}
                    type="button"
                    id="result-filter-date-from-trigger"
                    aria-haspopup="listbox"
                    aria-expanded={matchDayPickerOpen === "from"}
                    aria-controls="result-filter-date-from-listbox"
                    className={[
                      "flex w-full min-h-11 items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-xs font-medium transition sm:text-[13px]",
                      "border-white/12 bg-linear-to-b from-white/8 to-black/50 text-white/92 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md",
                      "hover:border-cyan-400/35 hover:shadow-[0_0_24px_rgba(34,211,238,0.12)]",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/45",
                      matchDayPickerOpen === "from"
                        ? "border-cyan-400/50 shadow-[0_0_28px_rgba(34,211,238,0.18)]"
                        : "",
                    ].join(" ")}
                    onClick={() =>
                      setMatchDayPickerOpen((o) => (o === "from" ? null : "from"))
                    }
                  >
                    <span
                      className={
                        filters.dateFrom
                          ? "tabular-nums text-white"
                          : "text-white/45"
                      }
                    >
                      {filters.dateFrom
                        ? dateLabelForDayKey(grouped, filters.dateFrom)
                        : fc.datePlaceholder}
                    </span>
                    <ChevronDown
                      className={[
                        "h-4 w-4 shrink-0 text-cyan-300/75 transition-transform duration-200",
                        matchDayPickerOpen === "from" ? "rotate-180" : "",
                      ].join(" ")}
                      aria-hidden
                    />
                  </button>
                </div>

                <div
                  className="flex shrink-0 items-center justify-center sm:self-center sm:pb-1"
                  aria-hidden
                >
                  <span className="rounded-lg border border-cyan-500/20 bg-linear-to-b from-cyan-500/10 to-transparent px-2.5 py-1 font-mono text-[10px] font-semibold tracking-[0.2em] text-cyan-200/55">
                    〜
                  </span>
                </div>

                <div className="min-w-0 flex-1 sm:min-w-40">
                  <span className="mb-1 block text-[10px] font-medium tracking-wide text-cyan-200/45 sm:text-[11px]">
                    {fc.dateToLabel}
                  </span>
                  <button
                    ref={toDateTriggerRef}
                    type="button"
                    id="result-filter-date-to-trigger"
                    aria-haspopup="listbox"
                    aria-expanded={matchDayPickerOpen === "to"}
                    aria-controls="result-filter-date-to-listbox"
                    className={[
                      "flex w-full min-h-11 items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-xs font-medium transition sm:text-[13px]",
                      "border-white/12 bg-linear-to-b from-white/8 to-black/50 text-white/92 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md",
                      "hover:border-cyan-400/35 hover:shadow-[0_0_24px_rgba(34,211,238,0.12)]",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/45",
                      matchDayPickerOpen === "to"
                        ? "border-cyan-400/50 shadow-[0_0_28px_rgba(34,211,238,0.18)]"
                        : "",
                    ].join(" ")}
                    onClick={() =>
                      setMatchDayPickerOpen((o) => (o === "to" ? null : "to"))
                    }
                  >
                    <span
                      className={
                        filters.dateTo
                          ? "tabular-nums text-white"
                          : "text-white/45"
                      }
                    >
                      {filters.dateTo
                        ? dateLabelForDayKey(grouped, filters.dateTo)
                        : fc.datePlaceholder}
                    </span>
                    <ChevronDown
                      className={[
                        "h-4 w-4 shrink-0 text-cyan-300/75 transition-transform duration-200",
                        matchDayPickerOpen === "to" ? "rotate-180" : "",
                      ].join(" ")}
                      aria-hidden
                    />
                  </button>
                </div>

                {filters.dateFrom != null || filters.dateTo != null ? (
                  <button
                    type="button"
                    className="rounded-xl border border-white/14 bg-white/6 px-3 py-2 text-[11px] font-semibold text-white/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition hover:border-fuchsia-400/35 hover:bg-fuchsia-500/10 hover:text-white sm:shrink-0"
                    onClick={() => {
                      clearDateRangeOnly();
                      setMatchDayPickerOpen(null);
                    }}
                  >
                    {fc.clearDateRange}
                  </button>
                ) : null}
              </div>
            )}
          </div>

          <div className="border-t border-white/10 pt-3">
            <button
              type="button"
              aria-expanded={detailFiltersOpen}
              className="flex w-full items-center justify-between gap-2 rounded-lg border border-white/12 bg-white/6 px-3 py-2.5 text-left backdrop-blur-sm transition hover:border-cyan-400/30 hover:bg-white/9"
              onClick={() => setDetailFiltersOpen((o) => !o)}
            >
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-[11px] font-semibold text-white sm:text-xs">
                  {fc.detailToggle}
                  {hasDetailFilters(filters) ? (
                    <span
                      className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-cyan-400 align-middle shadow-[0_0_8px_rgba(34,211,238,0.7)]"
                      aria-hidden
                    />
                  ) : null}
                </span>
                <span className="text-[10px] text-white/45">{fc.detailHint}</span>
              </span>
              <ChevronDown
                className={[
                  "h-4 w-4 shrink-0 text-white/60 transition-transform duration-200",
                  detailFiltersOpen ? "rotate-180" : "",
                ].join(" ")}
                aria-hidden
              />
            </button>

            {detailFiltersOpen ? (
              <div className="mt-3 space-y-3 border-l-2 border-cyan-500/25 pl-3">
          <div className="mb-3">
            <div className="mb-1.5 text-[10px] font-medium text-white/40 sm:text-[11px]">
              {fc.settlement}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {(["all", "pending", "final"] as const).map((k) => (
                <motion.button
                  key={k}
                  type="button"
                  aria-pressed={filters.settlement === k}
                  onClick={() =>
                    setFilters((s) => ({ ...s, settlement: k }))
                  }
                  variants={
                    prefersReducedMotion
                      ? undefined
                      : {
                          hidden: { opacity: 0, y: 8 },
                          visible: {
                            opacity: 1,
                            y: 0,
                            transition: { duration: 0.24, ease: easeOut },
                          },
                        }
                  }
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
                  whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
                  className={filterChipClass(filters.settlement === k)}
                >
                  {fc.settlementOpt[k]}
                </motion.button>
              ))}
            </div>
          </div>

          <div className="mb-3">
            <div className="mb-1.5 text-[10px] font-medium text-white/40 sm:text-[11px]">
              {fc.upsetScore}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {(["none", "upsetBonus"] as const).map((k) => (
                <motion.button
                  key={k}
                  type="button"
                  aria-pressed={filters.specialty === k}
                  onClick={() =>
                    setFilters((s) => ({ ...s, specialty: k }))
                  }
                  variants={
                    prefersReducedMotion
                      ? undefined
                      : {
                          hidden: { opacity: 0, y: 8 },
                          visible: {
                            opacity: 1,
                            y: 0,
                            transition: { duration: 0.24, ease: easeOut },
                          },
                        }
                  }
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
                  whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
                  className={filterChipClass(filters.specialty === k)}
                >
                  {fc.upsetOpt[k]}
                </motion.button>
              ))}
            </div>
          </div>

          <div className="mb-3">
            <div className="mb-1.5 text-[10px] font-medium text-white/40 sm:text-[11px]">
              {fc.scorePrecision}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {(["all", "high", "mid", "low"] as const).map((k) => (
                <motion.button
                  key={`sp-${k}`}
                  type="button"
                  aria-pressed={filters.scorePrecisionTier === k}
                  onClick={() =>
                    setFilters((s) => ({ ...s, scorePrecisionTier: k }))
                  }
                  variants={
                    prefersReducedMotion
                      ? undefined
                      : {
                          hidden: { opacity: 0, y: 8 },
                          visible: {
                            opacity: 1,
                            y: 0,
                            transition: { duration: 0.24, ease: easeOut },
                          },
                        }
                  }
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
                  whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
                  className={filterChipClass(filters.scorePrecisionTier === k)}
                >
                  {fc.tierOpt[k]}
                </motion.button>
              ))}
            </div>
          </div>

          <div className="mb-0">
            <div className="mb-1.5 text-[10px] font-medium text-white/40 sm:text-[11px]">
              {fc.totalScore}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {(["all", "high", "mid", "low"] as const).map((k) => (
                <motion.button
                  key={`ts-${k}`}
                  type="button"
                  aria-pressed={filters.pointsTier === k}
                  onClick={() =>
                    setFilters((s) => ({ ...s, pointsTier: k }))
                  }
                  variants={
                    prefersReducedMotion
                      ? undefined
                      : {
                          hidden: { opacity: 0, y: 8 },
                          visible: {
                            opacity: 1,
                            y: 0,
                            transition: { duration: 0.24, ease: easeOut },
                          },
                        }
                  }
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
                  whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
                  className={filterChipClass(filters.pointsTier === k)}
                >
                  {fc.tierOpt[k]}
                </motion.button>
              ))}
            </div>
          </div>
              </div>
            ) : null}
          </div>
        </motion.div>
          ) : null}
            </div>
          </div>
        </motion.div>

        <div
          className={["flex flex-col", isMobile ? "gap-3" : "gap-4"].join(" ")}
        >
        <AnimatePresence mode="wait">
          {totalLoaded > 0 &&
            filteredGrouped.length === 0 &&
            !isDefaultResultFilters(filters) && (
            <motion.div
              key="empty-filter"
              role="status"
              initial={off ?? { opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={off ?? { opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: easeOut }}
              className="rounded-2xl border border-white/10 bg-white/3 px-4 py-8 text-center text-sm text-white/55"
            >
              {m.results.noResultsForFilter}
            </motion.div>
          )}
        </AnimatePresence>

        {/* リザルト投稿が一件もないとき：背景なし・グロー付き NO DATA をエリア中央に */}
        {!loading && totalLoaded === 0 ? (
          <motion.div
            key="empty-no-posts"
            role="status"
            initial={off ?? { opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, ease: easeOut }}
            className="flex min-h-[min(70dvh,620px)] w-full items-center justify-center px-4"
          >
            <p
              className={[
                nameBebas.className,
                "text-center text-[clamp(1.75rem,6vw,3rem)] leading-none tracking-[0.22em]",
              ].join(" ")}
              style={cyberNoDataLabelStyle}
            >
              NO DATA
            </p>
          </motion.div>
        ) : null}

        {visibleGrouped.map((day) => {
          const pendingShown = day.pending;
          const finalShown = day.final;
          // 未確定（試合前〜得点未確定）を上、試合確定済みを下（各バケット内の順は groupPostsByResultDay に従う）
          const displayPosts = [...pendingShown, ...finalShown];
          const isSingleWebCard = !isMobile && displayPosts.length === 1;
          const dayPts = dayPointsHeaderForList(
            finalShown,
            pendingShown,
            language
          );

          const cardsGridClass = isMobile
            ? "flex min-w-0 w-full flex-col gap-3"
            : isSingleWebCard
              ? "flex min-w-0 w-full justify-center"
              : "grid min-w-0 w-full grid-cols-1 gap-4 sm:grid-cols-2";

          const headerSlot = prefersReducedMotion ? undefined : takeEntrySlot();

          return (
            <ResultDayPipeGroup
              key={day.dateLabel}
              dateLabel={day.dateLabel}
              isMobile={isMobile}
              reducedMotion={Boolean(prefersReducedMotion)}
              dayPoints={dayPts}
              headerEntrySlot={headerSlot}
              cardsClassName={cardsGridClass}
            >
              {displayPosts.map((post) => {
                const card = (
                  <ResultCard
                    post={post}
                    onOpen={open}
                    language={language}
                    platform={platform}
                    scheduleDense={isMobile}
                    ratingBarsImmediate={filteredTotalLoaded === 1}
                    showPreKickoffDismiss={canDismissResultListPostNow(
                      post,
                      listNowTick
                    )}
                    onPreKickoffDismiss={() =>
                      setDeleteConfirmPost(post)
                    }
                    viewerUid={viewerUid}
                    gamesRoutePrefix={gamesRoutePrefix}
                    onRequestPredictEdit={requestPredictEditFromCard}
                    cardClockMs={listNowTick}
                  />
                );

                if (prefersReducedMotion) {
                  return (
                    <div
                      key={post.id}
                      className={
                        isSingleWebCard ? "w-full max-w-[640px]" : "w-full"
                      }
                    >
                      {card}
                    </div>
                  );
                }

                return (
                  <motion.div
                    key={post.id}
                    variants={resultCardSlotVariants}
                    custom={takeEntrySlot()}
                    className={
                      isSingleWebCard ? "w-full max-w-[640px]" : "w-full"
                    }
                  >
                    {card}
                  </motion.div>
                );
              })}
            </ResultDayPipeGroup>
          );
        })}
        </div>

        {!postsCacheCapped && hasMore && (
          <div ref={sentinelRef} className="h-10" />
        )}

        {loading && (
          <motion.div
            className="py-6 text-center text-white/60 text-sm"
            initial={prefersReducedMotion ? false : { opacity: 0.4 }}
            animate={
              prefersReducedMotion
                ? { opacity: 1 }
                : { opacity: [0.4, 1, 0.4] }
            }
            transition={
              prefersReducedMotion
                ? undefined
                : { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
            }
          >
            {m.common.loading}
          </motion.div>
        )}
        {postsCacheCapped && (
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: easeOut }}
            className="py-6 text-center text-white/60 text-xs sm:text-sm"
          >
            {m.results.showingLatest.replace("{n}", String(RESULT_POSTS_MAX_CACHED))}
          </motion.div>
        )}
      </motion.div>

      {overlayPortalReady &&
      matchDayPickerOpen &&
      matchDayListboxBox
        ? createPortal(
            <AnimatePresence>
              <motion.div
                key={matchDayPickerOpen}
                ref={matchDayListboxPortalRef}
                id={
                  matchDayPickerOpen === "from"
                    ? "result-filter-date-from-listbox"
                    : "result-filter-date-to-listbox"
                }
                role="listbox"
                aria-labelledby={
                  matchDayPickerOpen === "from"
                    ? "result-filter-date-from-trigger"
                    : "result-filter-date-to-trigger"
                }
                style={{
                  position: "fixed",
                  top: matchDayListboxBox.top,
                  left: matchDayListboxBox.left,
                  width: matchDayListboxBox.width,
                  maxHeight: matchDayListboxBox.maxH,
                }}
                initial={
                  prefersReducedMotion
                    ? false
                    : { opacity: 0, y: -8, scale: 0.98 }
                }
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={
                  prefersReducedMotion
                    ? undefined
                    : { opacity: 0, y: -6, scale: 0.98 }
                }
                transition={{ duration: 0.2, ease: easeOut }}
                className="z-92000 overflow-x-hidden overflow-y-auto overscroll-contain rounded-xl border border-cyan-500/25 bg-zinc-950/95 py-1 shadow-[0_20px_56px_rgba(0,0,0,0.72)] backdrop-blur-xl backdrop-saturate-150"
              >
                {matchDayPickerOpen === "from" ? (
                  <>
                    <button
                      type="button"
                      role="option"
                      aria-selected={filters.dateFrom == null}
                      className={[
                        "flex w-full items-center gap-2 border-b border-white/[0.07] px-3 py-2.5 text-left text-[11px] transition sm:text-xs",
                        filters.dateFrom == null
                          ? "bg-cyan-500/14 text-cyan-50"
                          : "text-white/50 hover:bg-white/6 hover:text-white/88",
                      ].join(" ")}
                      onClick={() => {
                        setFilterDateFrom("");
                        setMatchDayPickerOpen(null);
                      }}
                    >
                      <span className="min-w-0 flex-1">{fc.datePlaceholder}</span>
                      {filters.dateFrom == null ? (
                        <Check
                          className="h-3.5 w-3.5 shrink-0 text-cyan-300"
                          aria-hidden
                        />
                      ) : null}
                    </button>
                    {dateFromOptions.map((k) => {
                      const sel = filters.dateFrom === k;
                      return (
                        <button
                          key={k}
                          type="button"
                          role="option"
                          aria-selected={sel}
                          className={[
                            "flex w-full items-center gap-2 border-b border-white/5 px-3 py-2.5 text-left text-[11px] tabular-nums transition last:border-b-0 sm:text-xs",
                            sel
                              ? "bg-cyan-500/16 text-white"
                              : "text-white/85 hover:bg-cyan-500/10 hover:text-white",
                          ].join(" ")}
                          onClick={() => {
                            setFilterDateFrom(k);
                            setMatchDayPickerOpen(null);
                          }}
                        >
                          <span className="min-w-0 flex-1">
                            {dateLabelForDayKey(grouped, k)}
                          </span>
                          {sel ? (
                            <Check
                              className="h-3.5 w-3.5 shrink-0 text-cyan-300"
                              aria-hidden
                            />
                          ) : null}
                        </button>
                      );
                    })}
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      role="option"
                      aria-selected={filters.dateTo == null}
                      className={[
                        "flex w-full items-center gap-2 border-b border-white/[0.07] px-3 py-2.5 text-left text-[11px] transition sm:text-xs",
                        filters.dateTo == null
                          ? "bg-cyan-500/14 text-cyan-50"
                          : "text-white/50 hover:bg-white/6 hover:text-white/88",
                      ].join(" ")}
                      onClick={() => {
                        setFilterDateTo("");
                        setMatchDayPickerOpen(null);
                      }}
                    >
                      <span className="min-w-0 flex-1">{fc.datePlaceholder}</span>
                      {filters.dateTo == null ? (
                        <Check
                          className="h-3.5 w-3.5 shrink-0 text-cyan-300"
                          aria-hidden
                        />
                      ) : null}
                    </button>
                    {dateToOptions.map((k) => {
                      const sel = filters.dateTo === k;
                      return (
                        <button
                          key={k}
                          type="button"
                          role="option"
                          aria-selected={sel}
                          className={[
                            "flex w-full items-center gap-2 border-b border-white/5 px-3 py-2.5 text-left text-[11px] tabular-nums transition last:border-b-0 sm:text-xs",
                            sel
                              ? "bg-cyan-500/16 text-white"
                              : "text-white/85 hover:bg-cyan-500/10 hover:text-white",
                          ].join(" ")}
                          onClick={() => {
                            setFilterDateTo(k);
                            setMatchDayPickerOpen(null);
                          }}
                        >
                          <span className="min-w-0 flex-1">
                            {dateLabelForDayKey(grouped, k)}
                          </span>
                          {sel ? (
                            <Check
                              className="h-3.5 w-3.5 shrink-0 text-cyan-300"
                              aria-hidden
                            />
                          ) : null}
                        </button>
                      );
                    })}
                  </>
                )}
              </motion.div>
            </AnimatePresence>,
            document.body
          )
        : null}

      {overlayPortalReady && typeof document !== "undefined"
        ? createPortal(
            <AnimatePresence>
              {deleteConfirmPost ? (
                <motion.div
                  key={`result-delete-${deleteConfirmPost.id}`}
                  role="presentation"
                  className="fixed inset-0 z-100002 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm pointer-events-auto"
                  initial={prefersReducedMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={prefersReducedMotion ? undefined : { opacity: 0 }}
                  transition={{ duration: 0.2, ease: easeOut }}
                  onClick={() => {
                    if (!deleteInProgress) setDeleteConfirmPost(null);
                  }}
                >
                  <motion.div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="result-delete-confirm-title"
                    className={[
                      "relative w-full max-w-sm overflow-hidden rounded-2xl border border-white/18 p-5",
                      "bg-linear-to-b from-white/12 via-cyan-950/25 to-zinc-950/50",
                      "backdrop-blur-2xl backdrop-saturate-[1.8]",
                      "shadow-[inset_0_1px_0_rgba(255,255,255,0.2),inset_0_-1px_0_rgba(0,0,0,0.25),0_28px_96px_rgba(0,0,0,0.55)]",
                      "ring-1 ring-cyan-400/25",
                    ].join(" ")}
                    initial={
                      prefersReducedMotion ? false : { opacity: 0, scale: 0.96, y: 8 }
                    }
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={
                      prefersReducedMotion
                        ? undefined
                        : { opacity: 0, scale: 0.98, y: 6 }
                    }
                    transition={{ duration: 0.24, ease: easeOut }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <p
                      id="result-delete-confirm-title"
                      className="px-1 py-1 text-center text-sm font-semibold text-white/95 drop-shadow-[0_1px_8px_rgba(0,0,0,0.45)] sm:text-base"
                    >
                      {m.results.deletePostConfirm}
                    </p>
                    {/* 参照デザイン：ガラス枠＋ホバー塗り＋矢印（左＝戻る／右＝進む）。英字は NO DATA と同系 */}
                    <div className="mt-5 flex w-full flex-row items-center justify-between gap-3">
                      <motion.button
                        type="button"
                        disabled={deleteInProgress}
                        className={[
                          "group relative flex h-[2.9em] min-w-[8.5em] shrink-0 items-center justify-start gap-2 overflow-hidden rounded-[11px]",
                          "border-2 border-cyan-400/55 bg-white/6 px-3 backdrop-blur-md",
                          "shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]",
                          "transition-all duration-500 ease-out",
                          "hover:border-cyan-300/85 hover:bg-cyan-500/22 disabled:pointer-events-none disabled:opacity-45",
                        ].join(" ")}
                        whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                        onClick={() => setDeleteConfirmPost(null)}
                      >
                        <ArrowLeft
                          className={[
                            "h-[1.35em] w-[1.35em] shrink-0 text-cyan-200/95",
                            "transition-transform duration-500 ease-out",
                            "group-hover:-translate-x-1.5",
                          ].join(" ")}
                          aria-hidden
                        />
                        <span
                          className={[
                            nameBebas.className,
                            "text-[0.95rem] leading-none tracking-[0.14em] sm:text-[1.05rem]",
                          ].join(" ")}
                          style={cyberNoDataLabelStyle}
                        >
                          {m.common.cancel}
                        </span>
                      </motion.button>
                      <motion.button
                        type="button"
                        disabled={deleteInProgress}
                        className={[
                          "group relative flex h-[2.9em] min-w-[8.5em] shrink-0 items-center justify-end gap-2 overflow-hidden rounded-[11px]",
                          "border-2 border-red-600 bg-white/6 px-3 backdrop-blur-md",
                          "shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_22px_rgba(220,38,38,0.45),0_0_40px_rgba(185,28,28,0.22)]",
                          "transition-all duration-500 ease-out",
                          "hover:border-red-500 hover:bg-red-700/45 hover:shadow-[0_0_36px_rgba(239,68,68,0.55),0_0_56px_rgba(220,38,38,0.35)] disabled:pointer-events-none disabled:opacity-45",
                        ].join(" ")}
                        whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                        onClick={() => void confirmDismissPostFromList()}
                      >
                        <span
                          className={[
                            nameBebas.className,
                            "text-[0.95rem] leading-none tracking-[0.14em] sm:text-[1.05rem]",
                          ].join(" ")}
                          style={deleteConfirmDeleteLabelStyle}
                        >
                          {m.common.delete}
                        </span>
                        <ArrowRight
                          className={[
                            "h-[1.35em] w-[1.35em] shrink-0 text-red-400 drop-shadow-[0_0_10px_rgba(248,113,113,0.85)]",
                            "transition-transform duration-500 ease-out",
                            "group-hover:translate-x-1.5 group-hover:text-red-300",
                          ].join(" ")}
                          aria-hidden
                        />
                      </motion.button>
                    </div>
                  </motion.div>
                </motion.div>
              ) : null}
            </AnimatePresence>,
            document.body
          )
        : null}

      {overlayPortalReady
        ? createPortal(
            <AnimatePresence>
              {openPostId && selectedPost && (
                <motion.div
                  key="result-overlay"
                  className={[
                    "fixed inset-0 pointer-events-auto",
                    isMobile ? "z-100000" : "z-99999",
                  ].join(" ")}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.22, ease: easeOut }}
                >
                  <motion.div
                    className={[
                      // 不透明度を下げつつ blur でガラス調（背面が透ける）
                      "flex min-h-dvh w-full flex-col overflow-hidden rounded-none border-x-0 border-b-0 border-t border-white/22",
                      "bg-black/32 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-2xl backdrop-saturate-[1.4]",
                      "pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]",
                    ].join(" ")}
                    style={detailPanelStyle}
                    initial={
                      prefersReducedMotion
                        ? false
                        : { opacity: 0, scale: 0.94 }
                    }
                    animate={{ opacity: 1, scale: 1 }}
                    exit={
                      prefersReducedMotion
                        ? undefined
                        : { opacity: 0, scale: 0.97 }
                    }
                    transition={{
                      duration: 0.36,
                      ease: easeOut,
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div
                      className={[
                        "flex shrink-0 items-center justify-end border-b border-white/10 px-2 pt-2",
                        isMobile ? "min-h-10 pb-1" : "min-h-11 pb-1.5",
                      ].join(" ")}
                    >
                      <motion.button
                        type="button"
                        aria-label={m.common.close}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white/90 backdrop-blur-md transition hover:bg-white/15"
                        onClick={(e) => {
                          e.stopPropagation();
                          close();
                        }}
                        initial={prefersReducedMotion ? false : { opacity: 0, rotate: -90 }}
                        animate={{ opacity: 1, rotate: 0 }}
                        transition={{ delay: 0.06, duration: 0.35, ease: easeOut }}
                        whileTap={prefersReducedMotion ? undefined : { scale: 0.92 }}
                      >
                        <X size={18} strokeWidth={2.4} />
                      </motion.button>
                    </div>
                    <div
                      className={[
                        "min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 pt-1 sm:px-4",
                        isMobile ? "pb-bottom-nav" : "pb-8",
                      ].join(" ")}
                      style={{
                        WebkitOverflowScrolling: "touch",
                        overscrollBehaviorY: "contain",
                        overscrollBehaviorX: "none",
                        touchAction: "pan-y",
                      }}
                    >
                      {isMobile ? (
                        <MobileResultDetail
                          post={selectedPost}
                          market={market ?? undefined}
                          pointsDistribution={pointsDistribution}
                          pointsDistributionLoading={pointsDistributionLoading}
                          language={language}
                          inOverlay
                          viewerUid={viewerUid}
                          gamesRoutePrefix={gamesRoutePrefix}
                        />
                      ) : (
                        <ResultDetail
                          post={selectedPost}
                          market={market ?? undefined}
                          pointsDistribution={pointsDistribution}
                          pointsDistributionLoading={pointsDistributionLoading}
                          language={language}
                          inOverlay
                          viewerUid={viewerUid}
                          gamesRoutePrefix={gamesRoutePrefix}
                        />
                      )}
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>,
            document.body
          )
        : null}

      {overlayPortalReady && predictOverlay
        ? createPortal(
            <div
              key="result-predict-edit-overlay"
              className="fixed inset-0 z-100001 overflow-hidden pointer-events-auto"
            >
              <div
                className={[
                  "absolute inset-0 z-0 bg-black/40 backdrop-blur-md",
                  predictStandingsOpen
                    ? "pointer-events-none"
                    : "pointer-events-auto",
                ].join(" ")}
                onClick={() => {
                  if (predictStandingsOpen) return;
                  closePredictOverlay();
                }}
                aria-hidden
              />
              <div
                className="relative z-10 h-dvh overflow-y-auto overflow-x-hidden pb-bottom-nav pointer-events-auto"
                style={{
                  WebkitOverflowScrolling: "touch",
                  overscrollBehaviorY: "contain",
                  overscrollBehaviorX: "none",
                  touchAction: "pan-y",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  className={[
                    "mx-auto w-full overflow-x-hidden",
                    isMobile
                      ? "max-w-2xl px-3 pb-28 pt-4 sm:px-4 sm:pb-32 sm:pt-5"
                      : predictOverlay.phase === "ready" &&
                          predictOverlay.game.league === "wc"
                        ? "max-w-7xl px-4 pb-20 pt-5 sm:px-8 md:px-10 lg:px-12"
                        : "max-w-5xl px-4 pb-20 pt-5 sm:px-6 md:px-8",
                  ].join(" ")}
                >
                  <div className="relative w-full overflow-x-hidden">
                    <button
                      type="button"
                      aria-label={m.common.close}
                      className="absolute right-2 top-2 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white/90 backdrop-blur-md transition hover:bg-black/65 sm:right-3 sm:top-3"
                      onClick={(e) => {
                        e.stopPropagation();
                        closePredictOverlay();
                      }}
                    >
                      <X size={18} strokeWidth={2.4} />
                    </button>

                    {predictOverlay.phase === "loading" ? (
                      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 px-4 pt-16 text-center text-sm text-white/70">
                        <p>
                          {m.results.loadingMatch}
                        </p>
                      </div>
                    ) : null}

                    {predictOverlay.phase === "error" ? (
                      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-4 pt-16 text-center">
                        <p className="text-sm text-white/75">
                          {m.results.loadMatchError}
                        </p>
                        <button
                          type="button"
                          className="rounded-lg border border-cyan-500/40 bg-cyan-500/15 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:border-cyan-400/60 hover:bg-cyan-500/25"
                          onClick={closePredictOverlay}
                        >
                          {m.common.close}
                        </button>
                      </div>
                    ) : null}

                    {predictOverlay.phase === "ready" ? (
                      <>
                        <MatchCard
                          {...predictOverlay.game}
                          myPostId={predictOverlay.post.id}
                          sharedLayoutId={undefined}
                          sharedTransitionBaseKey={undefined}
                          disableCardMotion
                          hideActions
                          showMarketBias
                          inPredictOverlay
                          homeRecord={null}
                          awayRecord={null}
                        />
                        <div className="mt-2 overflow-x-hidden">
                          <PredictionFormV2
                            dense={isMobile}
                            game={predictOverlay.game}
                            user={predictFormUser}
                            embedded
                            inOverlay
                            overlayExistingPostId={predictOverlay.post.id}
                            onClosePredictOverlay={closePredictOverlay}
                            onStandingsOpenChange={(open) => {
                              setPredictStandingsOpen(open);
                            }}
                            onPostCreated={() => {
                              void refreshResultPosts?.();
                            }}
                          />
                        </div>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
    </LazyMotion>
  );
}
