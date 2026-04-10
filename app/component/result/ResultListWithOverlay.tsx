"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, X } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Language } from "@/lib/i18n/language";
import ResultCard, {
  type ResultCardOpenAnchor,
} from "@/app/component/result/ResultCard";
import ResultDetail from "@/app/component/result/ResultDetail";
import MobileResultDetail from "@/app/component/result/mobile/MobileResultDetail";
import {
  ResultDayPipeGroup,
  type ResultDayPointsHeader,
} from "@/app/component/result/ResultDayPipeGroup";
import type { PredictionPostV2 } from "@/types/prediction-post-v2";
import type { ResultPlatform } from "@/lib/result/result-platform";
import {
  isFinalResultPost,
  RESULT_POSTS_MAX_CACHED,
  sumDayPointsV3,
  type PostWithMillis,
  type ResultDayGroup,
} from "@/lib/result/result-page-data";
import {
  parseGamePointsDistributionV1,
  type GamePointsDistributionV1,
} from "@/lib/results/gamePointsDistribution";
import type { League } from "@/lib/leagues";
import { LEAGUE_DISPLAY, LEAGUES } from "@/lib/leagues";

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
  /** 暫定：リザルト一覧は NBA のみ */
  league: LEAGUES.NBA,
  specialty: "none",
  scorePrecisionTier: "all",
  pointsTier: "all",
  dateFrom: null,
  dateTo: null,
};

/** フィルター UI に出すリーグ順（暫定で NBA のみ） */
const LEAGUE_ORDER: League[] = [LEAGUES.NBA];

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
  const leagueCountsAsDetail =
    LEAGUE_ORDER.length > 1 && f.league !== "all";
  return (
    f.settlement !== "all" ||
    leagueCountsAsDetail ||
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
  grouped: ResultDayGroup[];
  loading: boolean;
  hasMore: boolean;
  sentinelRef: React.RefObject<HTMLDivElement | null>;
  setInfiniteScrollEnabled?: (enabled: boolean) => void;
  language: Language;
  platform: ResultPlatform;
  postsCacheCapped?: boolean;
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
  if (finalShown.length > 0) {
    const total = sumDayPointsV3(finalShown);
    const fmt =
      Number.isInteger(total) || Math.abs(total - Math.round(total)) < 1e-6
        ? String(Math.round(total))
        : total.toFixed(1);
    const { wins: hitWins, total: hitTotal } = countWinnerHits(finalShown);
    const hitSuffix =
      hitTotal > 0
        ? language === "en"
          ? ` Winner predictions correct: ${hitWins} of ${hitTotal} settled.`
          : ` 勝者予想の的中 ${hitWins}/${hitTotal} 試合。`
        : "";
    if (language === "en") {
      return {
        variant: "total",
        value: fmt,
        prefix: "Total score",
        unit: "pts",
        aria: `Total score for this day: ${fmt} pts.${hitSuffix}`,
        ...(hitTotal > 0 ? { hitWins, hitTotal } : {}),
      };
    }
    return {
      variant: "total",
      value: fmt,
      prefix: "総合スコア",
      unit: "pt",
      aria: `この日の総合スコア（合算）${fmt} ポイント。${hitSuffix}`.trim(),
      ...(hitTotal > 0 ? { hitWins, hitTotal } : {}),
    };
  }
  if (pendingShown.length > 0) {
    return language === "en"
      ? {
          variant: "pending",
          line: "Pending",
          aria: "Points not yet available until matches are finalized",
        }
      : {
          variant: "pending",
          line: "得点未確定",
          aria: "試合確定後に得点が表示されます",
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
  grouped,
  loading,
  hasMore,
  sentinelRef,
  setInfiniteScrollEnabled,
  language,
  platform,
  postsCacheCapped = false,
}: Props) {
  const [openPostId, setOpenPostId] = useState<string | null>(null);
  const [detailAnchor, setDetailAnchor] = useState<ResultCardOpenAnchor | null>(
    null
  );
  const [market, setMarket] = useState<MarketData | null>(null);
  const [pointsDistribution, setPointsDistribution] =
    useState<GamePointsDistributionV1 | null>(null);
  const [filters, setFilters] = useState<ResultListFilters>(() => ({
    ...DEFAULT_RESULT_FILTERS,
  }));
  const prefersReducedMotion = useReducedMotion();

  const isMobile = platform === "mobile";

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

  /** リーグ選択が1つだけのときは state をそのリーグに固定（暫定 NBA のみ用） */
  useEffect(() => {
    if (LEAGUE_ORDER.length !== 1) return;
    const only = LEAGUE_ORDER[0];
    setFilters((s) => (s.league === only ? s : { ...s, league: only }));
  }, []);

  useEffect(() => {
    setInfiniteScrollEnabled?.(!postsCacheCapped);
  }, [postsCacheCapped, setInfiniteScrollEnabled]);

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
  }, []);

  const open = useCallback(
    (post: PredictionPostV2 | PostWithMillis, anchor: ResultCardOpenAnchor) => {
      setOpenPostId(post.id);
      setDetailAnchor(anchor);
      setMarket(null);
      setPointsDistribution(null);
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
    if (!post?.gameId) return;

    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "games", post.gameId));
        if (!snap.exists() || cancelled) return;
        const d = snap.data() as Record<string, unknown>;
        const marketRaw = d.market as Record<string, unknown> | undefined;
        const pdRaw = d.pointsDistributionV1 as Record<string, unknown> | undefined;
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

  const fc =
    language === "en"
      ? {
          panelTitle: "Filters",
          reset: "Reset",
          /** 折りたたみ時のみ表示（展開すると消える） */
          filterFoldCollapsedLabel: "Filters",
          filterFoldCollapse: "Close",
          outcome: "Outcome",
          settlement: "Match status",
          league: "League",
          upsetScore: "Upset score",
          scorePrecision: "Score accuracy",
          totalScore: "Total score",
          outcomeOpt: { all: "All", win: "Wins", loss: "Losses" } as const,
          settlementOpt: {
            all: "All",
            pending: "Pending",
            final: "Final",
          } as const,
          leagueAll: "All",
          upsetOpt: {
            none: "None",
            upsetBonus: "Bonus pts",
          } as const,
          tierOpt: {
            all: "All",
            high: "High (7+)",
            mid: "Mid (4–6)",
            low: "Low (≤3)",
          } as const,
          matchDaySection: "Match day (in list)",
          datePlaceholder: "Select…",
          noDaysYet: "No days loaded yet.",
          dateFromLabel: "From",
          dateToLabel: "To",
          clearDateRange: "Clear period",
          detailToggle: "More filters",
          detailHint: "Status, league, scores…",
          groupAria: "Filter result list",
        }
      : {
          panelTitle: "",
          reset: "リセット",
          filterFoldCollapsedLabel: "絞り込み条件を指定",
          filterFoldCollapse: "閉じる",
          outcome: "勝敗",
          settlement: "試合の状態",
          league: "リーグ",
          upsetScore: "Upset スコア",
          scorePrecision: "スコア精度",
          totalScore: "総合スコア",
          outcomeOpt: { all: "すべて", win: "勝ち", loss: "負け" } as const,
          settlementOpt: {
            all: "すべて",
            pending: "未確定",
            final: "確定",
          } as const,
          leagueAll: "すべて",
          upsetOpt: {
            none: "なし",
            upsetBonus: "加点あり",
          } as const,
          tierOpt: {
            all: "すべて",
            high: "高(7+)",
            mid: "中(4–6)",
            low: "3〜0",
          } as const,
          matchDaySection: "試合日（一覧にある日のみ）",
          datePlaceholder: "選択…",
          noDaysYet: "表示中の日付がまだありません。",
          dateFromLabel: "開始",
          dateToLabel: "終了",
          clearDateRange: "期間をクリア",
          detailToggle: "詳細条件",
          detailHint: "試合状態・リーグ・各スコア帯など",
          groupAria: "リザルトの絞り込み",
        };

  const filterChipClass = (active: boolean) =>
    [
      "rounded-xl border font-semibold tracking-wide transition-colors",
      isMobile ? "px-2 py-1.5 text-[11px]" : "px-3 py-2 text-xs sm:text-sm",
      active
        ? "border-cyan-200/35 bg-cyan-500/20 text-cyan-50 shadow-[0_0_14px_rgba(34,211,238,0.12)]"
        : "border-white/12 bg-white/[0.04] text-white/70 hover:border-white/18 hover:text-white/90",
    ].join(" ");

  const totalLoaded =
    grouped.reduce((a, d) => a + d.pending.length + d.final.length, 0);

  const easeOut = [0.22, 1, 0.36, 1] as const;
  const off = prefersReducedMotion
    ? { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }
    : undefined;

  return (
    <>
      <motion.div
        className={[
          "relative z-20",
          isMobile ? "space-y-3" : "space-y-4",
        ].join(" ")}
        initial={off ?? { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: easeOut }}
      >
        <div className="relative z-30 isolate mb-2">
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
                  className="rounded-lg border border-white/14 bg-white/[0.06] px-2.5 py-1 text-[11px] font-semibold text-white/80 transition hover:border-cyan-400/30 hover:text-white"
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
                          hidden: { opacity: 0, y: 10, filter: "blur(5px)" },
                          visible: {
                            opacity: 1,
                            y: 0,
                            filter: "blur(0px)",
                            transition: { duration: 0.35, ease: easeOut },
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
            <div className="mb-1.5 text-[10px] font-medium text-white/40 sm:text-[11px]">
              {fc.matchDaySection}
            </div>
            {availableDayKeysAsc.length === 0 ? (
              <p className="text-[10px] leading-relaxed text-white/45">
                {fc.noDaysYet}
              </p>
            ) : (
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
                <label className="flex min-w-[9rem] flex-1 flex-col gap-0.5">
                  <span className="text-[10px] text-white/45 sm:text-[11px]">
                    {fc.dateFromLabel}
                  </span>
                  <select
                    value={filters.dateFrom ?? ""}
                    onChange={(e) => setFilterDateFrom(e.target.value)}
                    className="min-h-9 w-full rounded-lg border border-white/15 bg-black/50 px-2 py-1.5 text-[11px] text-white outline-none [color-scheme:dark] focus:border-cyan-400/40 sm:text-sm"
                  >
                    <option value="">{fc.datePlaceholder}</option>
                    {dateFromOptions.map((k) => (
                      <option key={k} value={k}>
                        {dateLabelForDayKey(grouped, k)}
                      </option>
                    ))}
                  </select>
                </label>
                <span
                  className="hidden self-center pb-2 text-white/35 sm:inline"
                  aria-hidden
                >
                  〜
                </span>
                <label className="flex min-w-[9rem] flex-1 flex-col gap-0.5">
                  <span className="text-[10px] text-white/45 sm:text-[11px]">
                    {fc.dateToLabel}
                  </span>
                  <select
                    value={filters.dateTo ?? ""}
                    onChange={(e) => setFilterDateTo(e.target.value)}
                    className="min-h-9 w-full rounded-lg border border-white/15 bg-black/50 px-2 py-1.5 text-[11px] text-white outline-none [color-scheme:dark] focus:border-cyan-400/40 sm:text-sm"
                  >
                    <option value="">{fc.datePlaceholder}</option>
                    {dateToOptions.map((k) => (
                      <option key={k} value={k}>
                        {dateLabelForDayKey(grouped, k)}
                      </option>
                    ))}
                  </select>
                </label>
                {filters.dateFrom != null || filters.dateTo != null ? (
                  <button
                    type="button"
                    className="rounded-lg border border-white/14 bg-white/[0.06] px-2.5 py-1.5 text-[11px] font-semibold text-white/80 transition hover:border-cyan-400/30 hover:text-white"
                    onClick={clearDateRangeOnly}
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
              className="flex w-full items-center justify-between gap-2 rounded-lg border border-white/12 bg-white/[0.06] px-3 py-2.5 text-left backdrop-blur-sm transition hover:border-cyan-400/30 hover:bg-white/[0.09]"
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
                          hidden: { opacity: 0, y: 10, filter: "blur(5px)" },
                          visible: {
                            opacity: 1,
                            y: 0,
                            filter: "blur(0px)",
                            transition: { duration: 0.35, ease: easeOut },
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

          {LEAGUE_ORDER.length > 1 ? (
            <div className="mb-3">
              <div className="mb-1.5 text-[10px] font-medium text-white/40 sm:text-[11px]">
                {fc.league}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <motion.button
                  type="button"
                  aria-pressed={filters.league === "all"}
                  onClick={() => setFilters((s) => ({ ...s, league: "all" }))}
                  variants={
                    prefersReducedMotion
                      ? undefined
                      : {
                          hidden: { opacity: 0, y: 10, filter: "blur(5px)" },
                          visible: {
                            opacity: 1,
                            y: 0,
                            filter: "blur(0px)",
                            transition: { duration: 0.35, ease: easeOut },
                          },
                        }
                  }
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
                  whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
                  className={filterChipClass(filters.league === "all")}
                >
                  {fc.leagueAll}
                </motion.button>
                {LEAGUE_ORDER.map((lg) => (
                  <motion.button
                    key={lg}
                    type="button"
                    aria-pressed={filters.league === lg}
                    onClick={() => setFilters((s) => ({ ...s, league: lg }))}
                    variants={
                      prefersReducedMotion
                        ? undefined
                        : {
                            hidden: { opacity: 0, y: 10, filter: "blur(5px)" },
                            visible: {
                              opacity: 1,
                              y: 0,
                              filter: "blur(0px)",
                              transition: { duration: 0.35, ease: easeOut },
                            },
                          }
                    }
                    whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
                    whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
                    className={filterChipClass(filters.league === lg)}
                  >
                    {LEAGUE_DISPLAY[lg]}
                  </motion.button>
                ))}
              </div>
            </div>
          ) : null}

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
                          hidden: { opacity: 0, y: 10, filter: "blur(5px)" },
                          visible: {
                            opacity: 1,
                            y: 0,
                            filter: "blur(0px)",
                            transition: { duration: 0.35, ease: easeOut },
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
                          hidden: { opacity: 0, y: 10, filter: "blur(5px)" },
                          visible: {
                            opacity: 1,
                            y: 0,
                            filter: "blur(0px)",
                            transition: { duration: 0.35, ease: easeOut },
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
                          hidden: { opacity: 0, y: 10, filter: "blur(5px)" },
                          visible: {
                            opacity: 1,
                            y: 0,
                            filter: "blur(0px)",
                            transition: { duration: 0.35, ease: easeOut },
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
              className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-8 text-center text-sm text-white/55"
            >
              {language === "en"
                ? "No results for this filter."
                : "この条件に合うリザルトがありません。"}
            </motion.div>
          )}
        </AnimatePresence>

        {filteredGrouped.map((day, dayIndex) => {
          const pendingShown = day.pending;
          const finalShown = day.final;
          // 並びは groupPostsByResultDay に任せる（確定が新しいほど上・先に確定したものは下。pending は先に並ぶ）
          const displayPosts = [...pendingShown, ...finalShown];
          const dayPts = dayPointsHeaderForList(
            finalShown,
            pendingShown,
            language
          );

          return (
            <motion.div
              key={day.dateLabel}
              initial={
                off ?? {
                  opacity: 0,
                  y: 36,
                }
              }
              whileInView={
                prefersReducedMotion
                  ? undefined
                  : {
                      opacity: 1,
                      y: 0,
                      transition: {
                        duration: 0.55,
                        ease: easeOut,
                        delay: Math.min(dayIndex * 0.04, 0.2),
                      },
                    }
              }
              viewport={{ once: true, amount: 0.12, margin: "0px 0px -72px 0px" }}
              transition={prefersReducedMotion ? undefined : { duration: 0.5, ease: easeOut }}
            >
              <ResultDayPipeGroup
                dateLabel={day.dateLabel}
                isMobile={isMobile}
                reducedMotion={Boolean(prefersReducedMotion)}
                dayPoints={dayPts}
              >
                <div
                  className={
                    isMobile
                      ? "space-y-3"
                      : "grid grid-cols-1 gap-4 sm:grid-cols-2"
                  }
                >
                  {displayPosts.map((post, i) => (
                    <motion.div
                      key={post.id}
                      className="w-full"
                      initial={
                        off ?? {
                          opacity: 0,
                          y: 22,
                          scale: 0.97,
                        }
                      }
                      whileInView={
                        prefersReducedMotion
                          ? undefined
                          : {
                              opacity: 1,
                              y: 0,
                              scale: 1,
                              transition: {
                                duration: 0.42,
                                ease: easeOut,
                                delay: i * 0.055,
                              },
                            }
                      }
                      viewport={{ once: true, amount: 0.15, margin: "0px 0px -48px 0px" }}
                    >
                      <ResultCard
                        post={post}
                        onOpen={open}
                        language={language}
                        platform={platform}
                      />
                    </motion.div>
                  ))}
                </div>
              </ResultDayPipeGroup>
            </motion.div>
          );
        })}

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
            {language === "en" ? "Loading…" : "読み込み中…"}
          </motion.div>
        )}
        {postsCacheCapped && (
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: easeOut }}
            className="py-6 text-center text-white/60 text-xs sm:text-sm"
          >
            {language === "en"
              ? `Showing latest ${RESULT_POSTS_MAX_CACHED} results to keep the page responsive.`
              : `動作を軽く保つため、最新 ${RESULT_POSTS_MAX_CACHED} 件まで表示しています。`}
          </motion.div>
        )}
      </motion.div>

      {overlayPortalReady
        ? createPortal(
            <AnimatePresence>
              {openPostId && selectedPost && (
                <motion.div
                  key="result-overlay"
                  className={[
                    "fixed inset-0 pointer-events-auto",
                    isMobile ? "z-[100000]" : "z-[99999]",
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
                        aria-label={language === "en" ? "Close" : "閉じる"}
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
                          language={language}
                          inOverlay
                        />
                      ) : (
                        <ResultDetail
                          post={selectedPost}
                          market={market ?? undefined}
                          pointsDistribution={pointsDistribution}
                          language={language}
                          inOverlay
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
    </>
  );
}
