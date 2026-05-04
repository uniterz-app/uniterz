"use client";

import type { KeyboardEvent, ReactNode } from "react";
import { forwardRef, useId, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  ChevronDown,
  Crosshair,
  Crown,
  Minus,
  Target,
  Zap,
} from "lucide-react";
import type { Language } from "@/lib/i18n/language";
import WinRateOverviewDonut from "@/app/component/profile/ui/summary/WinRateOverviewDonut";
import ResultStatRatingBar from "@/app/component/result/ResultStatRatingBar";
import { ShellGridOverlay } from "@/app/component/ui/ShellGridOverlay";
import { formatMetricDecimals } from "@/lib/format/metricDecimals";
import { resultStatsMetricNumClass } from "@/lib/fonts";
import { LEAGUE_DISPLAY, type League } from "@/lib/leagues";
import { useCountUp } from "@/lib/hooks/useCountUp";
import { useInViewOnce } from "@/lib/hooks/useInViewOnce";

type Percentiles = {
  winRate: number;
  precision: number;
  pointsV3: number;
  upset: number;
  volume: number;
};

type MonthlyDoc = {
  raw?: {
    posts?: number;
    wins?: number;
    winRate?: number;
    avgPrecision?: number;
    avgPointsV3?: number;
    upsetPointsSum?: number;
    pointsSumV3?: number;
    scorePrecisionSum?: number;
    basePointsSum?: number;
    upsetBonusSum?: number;
    streakBonusSum?: number;
    /** 月内アップセット的中回数（月次ジョブが埋める） */
    upsetHit?: number;
    /** 月内総合得点（合計）の全ユーザー中順位（月次ジョブが埋める） */
    pointsSumV3Rank?: number | null;
    /** リーグ ID → 投稿数（月次ジョブが埋める） */
    leaguePosts?: Record<string, number>;
  };
  percentiles?: Percentiles;
};

const CARD_SHELL =
  "relative overflow-hidden rounded-2xl border border-white/15 bg-[#050814]/80 p-4 shadow-[0_14px_40px_rgba(0,0,0,0.55)]";

const KNOWN_LEAGUE_KEYS = new Set<string>(["bj", "j1", "nba", "pl"]);

function formatLeaguePostsLabel(key: string): string {
  const k = key.trim().toLowerCase();
  if (KNOWN_LEAGUE_KEYS.has(k)) return LEAGUE_DISPLAY[k as League];
  return k.length > 0 ? k.toUpperCase() : key;
}

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function ordinalSuffixEn(n: number): string {
  const v = n % 100;
  if (v >= 11 && v <= 13) return "th";
  switch (n % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

function DeltaBadge({
  language,
  deltaPct,
  deltaPts,
  higherIsBetter,
  absoluteDecimals,
  absoluteSuffix,
  textSizeClass = "text-[10px]",
  iconSizeClass = "h-3 w-3",
}: {
  language: Language;
  deltaPct: number | null;
  deltaPts: number | null;
  higherIsBetter: boolean;
  absoluteDecimals?: number;
  /** Appended after the number when using `absoluteDecimals` (e.g. `"pts"`). */
  absoluteSuffix?: string;
  textSizeClass?: string;
  iconSizeClass?: string;
}) {
  const useAbs =
    absoluteDecimals !== undefined && deltaPts !== null && deltaPct === null;
  const absTail =
    useAbs && absoluteSuffix ? ` ${absoluteSuffix}` : "";
  const usePts = !useAbs && deltaPts !== null;
  const v = useAbs ? deltaPts! : usePts ? deltaPts! : deltaPct;
  if (v === null) {
    return (
      <span
        className={`inline-flex items-center gap-0.5 ${textSizeClass} text-white/35 ${resultStatsMetricNumClass}`}
      >
        <Minus className={iconSizeClass} />
        {language === "en" ? "n/a" : "—"}
      </span>
    );
  }
  if (usePts && Math.abs(v) < 0.05 && deltaPct === null) {
    return (
      <span
        className={`${textSizeClass} text-white/40 ${resultStatsMetricNumClass}`}
      >
        ±0
      </span>
    );
  }
  if (!usePts && !useAbs && Math.abs(v) < 0.05) {
    return (
      <span
        className={`${textSizeClass} text-white/40 ${resultStatsMetricNumClass}`}
      >
        ±0%
      </span>
    );
  }

  if (useAbs && Math.abs(v) < 0.005) {
    return (
      <span
        className={`${textSizeClass} text-white/40 ${resultStatsMetricNumClass}`}
      >
        ±0{absTail}
      </span>
    );
  }

  const better = higherIsBetter ? v > 0 : v < 0;
  const Icon = v > 0 ? ArrowUpRight : v < 0 ? ArrowDownRight : Minus;
  const color = better
    ? "text-emerald-400"
    : v === 0
      ? "text-white/45"
      : "text-rose-300";

  const text = useAbs
    ? `${v > 0 ? "+" : ""}${formatMetricDecimals(v, absoluteDecimals!)}${absTail}`
    : usePts
      ? `${v > 0 ? "+" : ""}${formatMetricDecimals(v, 1)}pt`
      : `${v > 0 ? "+" : ""}${formatMetricDecimals(v, 1)}%`;

  return (
    <span
      className={`inline-flex items-center gap-0.5 ${textSizeClass} font-semibold tabular-nums ${color} ${resultStatsMetricNumClass}`}
    >
      <Icon className={`${iconSizeClass} shrink-0`} />
      {text}
    </span>
  );
}

function MetaBits({ children }: { children: ReactNode }) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-white/10 pt-3 text-[10px] text-white/50">
      {children}
    </div>
  );
}

function EmptyMetricPlaceholder({ language }: { language: Language }) {
  return (
    <p className="py-5 text-center text-sm text-white/55">
      {language === "en" ? "No data available" : "データがありません"}
    </p>
  );
}

function LeaguePostCountUp({
  count,
  enabled,
}: {
  count: number;
  enabled: boolean;
}) {
  const v = useCountUp(count, 520, enabled, 0, "zero");
  return <span className="ml-0.5 tabular-nums text-white/90">{v}</span>;
}

const MetricCard = forwardRef<
  HTMLDivElement,
  {
    icon: ReactNode;
    title: string;
    children: ReactNode;
    meta?: ReactNode;
  }
>(function MetricCard({ icon, title, children, meta }, ref) {
  return (
    <div ref={ref} className={`${CARD_SHELL} h-full min-h-0`}>
      <ShellGridOverlay roundedClassName="rounded-2xl" />
      <div className="relative z-1">
        <div className="mb-2 flex items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-orange-400">
            {icon}
          </span>
          <span className="text-xs font-semibold text-white/85 lg:text-sm">{title}</span>
        </div>
        {children}
        {meta ? <MetaBits>{meta}</MetaBits> : null}
      </div>
    </div>
  );
});

MetricCard.displayName = "MetricCard";

type Props = {
  language: Language;
  summaryMonthKey: string;
  stats: MonthlyDoc;
  olderStats: MonthlyDoc | null;
  /** そのサマリー月の総合得点（合計）の母集団基準。無い月はタップ展開なし */
  pointsSumBenchmarks?: {
    mean: number;
    median: number;
    p90: number;
    max: number;
  } | null;
};

export default function PrevMonthSummaryCard({
  language,
  summaryMonthKey: _summaryMonthKey,
  stats,
  olderStats,
  pointsSumBenchmarks = null,
}: Props) {
  const raw = stats.raw ?? {};
  const oldRaw = olderStats?.raw ?? {};

  const posts = raw.posts ?? 0;
  const showEmptyMetrics = posts === 0;
  const postsOld = oldRaw.posts ?? null;

  const leaguePostLines = Object.entries(raw.leaguePosts ?? {})
    .filter(([, n]) => typeof n === "number" && Number.isFinite(n) && n > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([key, n]) => ({
      key,
      label: formatLeaguePostsLabel(key),
      count: Math.max(0, Math.floor(n)),
    }));

  const winRate = raw.winRate ?? 0;

  const winsCount =
    raw.wins !== undefined
      ? Math.max(0, Math.floor(raw.wins))
      : posts > 0
        ? Math.max(0, Math.round(winRate * posts))
        : 0;
  const lossesCount = Math.max(0, posts - winsCount);

  const avgPrecision = raw.avgPrecision ?? 0;
  const avgPrecisionOld =
    oldRaw.avgPrecision !== undefined ? oldRaw.avgPrecision : null;

  const scorePrecisionSum =
    raw.scorePrecisionSum ?? avgPrecision * posts;
  const scorePrecisionSumOld =
    oldRaw.scorePrecisionSum !== undefined
      ? oldRaw.scorePrecisionSum
      : avgPrecisionOld !== null && postsOld !== null
        ? avgPrecisionOld * postsOld
        : null;

  const precisionBarRatio = clamp01(avgPrecision / 10);

  const upsetSum = raw.upsetPointsSum ?? 0;
  const upsetSumOld =
    oldRaw.upsetPointsSum !== undefined ? oldRaw.upsetPointsSum : null;

  const upsetHitCount =
    typeof raw.upsetHit === "number" && Number.isFinite(raw.upsetHit)
      ? Math.max(0, Math.floor(raw.upsetHit))
      : null;

  const pointsSum =
    raw.pointsSumV3 ?? (raw.avgPointsV3 ?? 0) * posts;
  const pointsSumOld =
    oldRaw.pointsSumV3 !== undefined
      ? oldRaw.pointsSumV3
      : oldRaw.avgPointsV3 !== undefined && postsOld !== null
        ? oldRaw.avgPointsV3 * postsOld
        : null;

  const upsetBonus = raw.upsetBonusSum ?? 0;
  const streakBonus = raw.streakBonusSum ?? 0;
  const basePoints =
    raw.basePointsSum ??
    Math.max(0, pointsSum - upsetBonus - streakBonus);

  const totalPointsRankRaw =
    typeof raw.pointsSumV3Rank === "number" &&
    Number.isFinite(raw.pointsSumV3Rank)
      ? Math.max(1, Math.floor(raw.pointsSumV3Rank))
      : null;
  const showTotalPointsRankBadge = totalPointsRankRaw !== null;

  const totalIv = useInViewOnce();
  const postsIv = useInViewOnce();
  const winIvWeb = useInViewOnce();
  const winIvMobile = useInViewOnce();
  const precIv = useInViewOnce();
  const upsetIv = useInViewOnce();

  const cuPoints = useCountUp(pointsSum, 960, totalIv.inView, 1, "zero");
  const cuBase = useCountUp(basePoints, 840, totalIv.inView, 1, "zero");
  const cuStreakB = useCountUp(streakBonus, 840, totalIv.inView, 1, "zero");
  const cuUpsetB = useCountUp(upsetBonus, 840, totalIv.inView, 1, "zero");
  const cuRank = useCountUp(
    totalPointsRankRaw ?? 0,
    720,
    totalIv.inView && showTotalPointsRankBadge,
    0,
    "zero"
  );

  const cuPosts = useCountUp(posts, 880, postsIv.inView, 0, "zero");
  const winVisible = winIvWeb.inView || winIvMobile.inView;
  const cuWins = useCountUp(winsCount, 920, winVisible, 0, "zero");
  const cuLosses = useCountUp(lossesCount, 920, winVisible, 0, "zero");
  const cuWinPct = useCountUp(
    Math.round(winRate * 100),
    1000,
    winVisible,
    0,
    "zero"
  );

  const cuPrecSum = useCountUp(scorePrecisionSum, 960, precIv.inView, 1, "zero");
  const cuAvgPrec = useCountUp(
    avgPrecision,
    900,
    precIv.inView,
    posts > 0 ? 2 : 1,
    "zero"
  );

  const cuUpsetSum = useCountUp(upsetSum, 960, upsetIv.inView, 2, "zero");
  const cuUpsetHit = useCountUp(
    upsetHitCount ?? 0,
    620,
    upsetIv.inView && upsetHitCount !== null,
    0,
    "zero"
  );

  const lb = {
    base: language === "en" ? "Base" : "基本点",
    upsetB: language === "en" ? "Upset bonus" : "アップセット",
    streakB: language === "en" ? "Streak bonus" : "連勝ボーナス",
    totalPts: language === "en" ? "Total points" : "総合得点",
    priorMoM: language === "en" ? "MoM" : "先々月比",
    sumTotal: language === "en" ? "Total" : "総計",
    upsetHitLabel:
      language === "en" ? "Upset hits" : "upset的中数",
    benchMean: language === "en" ? "User avg" : "ユーザー平均",
    benchMed: language === "en" ? "Median" : "中央値",
    benchP90: language === "en" ? "Top 10% line" : "Top10の境界線",
    benchMax: language === "en" ? "1st" : "1位",
    benchHint:
      language === "en"
        ? "Tap for cohort benchmarks"
        : "タップで母集団の基準を表示",
  };

  const [benchOpen, setBenchOpen] = useState(false);
  const benchSectionId = useId().replace(/:/g, "");
  const hasBench = pointsSumBenchmarks != null && !showEmptyMetrics;

  const totalShellClass = [
    CARD_SHELL,
    hasBench
      ? "cursor-pointer select-none outline-none transition hover:border-white/22 focus-visible:ring-2 focus-visible:ring-amber-400/35"
      : "",
  ].join(" ");

  const toggleBench = () => {
    if (!hasBench) return;
    setBenchOpen((o) => !o);
  };

  const onTotalKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!hasBench) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleBench();
    }
  };

  return (
    <div className="w-full space-y-3">
      <div className="grid w-full grid-cols-1 items-stretch gap-2 sm:gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div
        ref={totalIv.ref}
        className={totalShellClass}
        role={hasBench ? "button" : undefined}
        tabIndex={hasBench ? 0 : undefined}
        aria-expanded={hasBench ? benchOpen : undefined}
        aria-controls={hasBench ? benchSectionId : undefined}
        onClick={hasBench ? toggleBench : undefined}
        onKeyDown={hasBench ? onTotalKeyDown : undefined}
        >
        <ShellGridOverlay roundedClassName="rounded-2xl" />
        <div className="relative z-1">
          {showEmptyMetrics ? (
            <>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Crown
                  className="h-4 w-4 shrink-0 text-amber-200/90 lg:h-[1.35rem] lg:w-[1.35rem]"
                  strokeWidth={2}
                />
                <span className="text-sm font-semibold text-white/90 lg:text-lg">
                  {lb.totalPts}
                </span>
              </div>
              <EmptyMetricPlaceholder language={language} />
            </>
          ) : (
            <>
              {showTotalPointsRankBadge && totalPointsRankRaw !== null ? (
                <>
                  <p
                    className={[
                      "pointer-events-none absolute left-2 top-2 z-2 max-w-[calc(100%-0.75rem)] truncate leading-tight",
                      "text-[13px] font-semibold tracking-tight text-amber-200/95",
                      "sm:left-3 sm:top-3 sm:text-base lg:text-lg",
                      resultStatsMetricNumClass,
                    ].join(" ")}
                    aria-hidden
                  >
                    {language === "en" ? (
                      <>
                        {cuRank}
                        {ordinalSuffixEn(totalPointsRankRaw)}
                      </>
                    ) : (
                      <>
                        {cuRank}
                        位
                      </>
                    )}
                  </p>
                  <span className="sr-only">
                    {language === "en"
                      ? `Rank ${totalPointsRankRaw}${ordinalSuffixEn(totalPointsRankRaw)} by total points`
                      : `総合得点 第${totalPointsRankRaw}位`}
                  </span>
                </>
              ) : null}
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Crown
                  className="h-4 w-4 shrink-0 text-amber-200/90 lg:h-[1.35rem] lg:w-[1.35rem]"
                  strokeWidth={2}
                />
                <span className="text-sm font-semibold text-white/90 lg:text-lg">
                  {lb.totalPts}
                </span>
              </div>

              <div className="mt-3 flex w-full justify-center px-1">
                <div className="flex translate-x-8 items-center gap-x-4 sm:translate-x-0 sm:gap-x-5">
                  <span className="inline-flex shrink-0 items-baseline gap-1.5">
                    <span
                      className={`text-2xl leading-none text-white sm:text-3xl lg:text-[2.55rem] ${resultStatsMetricNumClass}`}
                    >
                      {formatMetricDecimals(cuPoints, 1)}
                    </span>
                    <span
                      className={`text-base leading-none text-white/65 sm:text-lg lg:text-[1.35rem] ${resultStatsMetricNumClass}`}
                    >
                      pts
                    </span>
                  </span>
                  <div className="flex shrink-0 flex-col items-end justify-center gap-0.5 text-right">
                    <span className="text-[10px] leading-tight text-white/40 lg:text-sm">
                      {lb.priorMoM}
                    </span>
                    <DeltaBadge
                      language={language}
                      deltaPct={null}
                      deltaPts={
                        pointsSumOld == null
                          ? null
                          : pointsSum - pointsSumOld
                      }
                      higherIsBetter
                      absoluteDecimals={1}
                      absoluteSuffix="pts"
                      textSizeClass="text-[10px] lg:text-[15px]"
                      iconSizeClass="h-3 w-3 lg:h-4 lg:w-4"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-2 grid grid-cols-3 gap-2 sm:gap-4">
                <div className="min-w-0 text-center sm:text-left">
                  <div className="text-[10px] font-medium text-white/45 lg:text-[15px]">{lb.base}</div>
                  <div
                    className={`mt-1 text-base leading-none text-white sm:text-lg lg:text-[1.4rem] ${resultStatsMetricNumClass}`}
                  >
                    {formatMetricDecimals(cuBase, 1)}
                  </div>
                </div>
                <div className="min-w-0 text-center sm:text-left">
                  <div className="text-[10px] font-medium text-white/45 lg:text-[15px]">{lb.streakB}</div>
                  <div
                    className={`mt-1 text-base leading-none text-sky-100 sm:text-lg lg:text-[1.4rem] ${resultStatsMetricNumClass}`}
                  >
                    {formatMetricDecimals(cuStreakB, 1)}
                  </div>
                </div>
                <div className="min-w-0 text-center sm:text-left">
                  <div className="text-[10px] font-medium text-white/45 lg:text-[15px]">{lb.upsetB}</div>
                  <div
                    className={`mt-1 text-base leading-none text-amber-100 sm:text-lg lg:text-[1.4rem] ${resultStatsMetricNumClass}`}
                  >
                    {formatMetricDecimals(cuUpsetB, 1)}
                  </div>
                </div>
              </div>

              {hasBench ? (
                <div className="mt-2 flex items-center justify-center gap-1 text-[9px] text-white/38 sm:justify-between sm:pr-0.5 lg:text-xs">
                  <span>{lb.benchHint}</span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 shrink-0 text-white/45 transition-transform ${benchOpen ? "rotate-180" : ""}`}
                    aria-hidden
                  />
                </div>
              ) : null}

              <AnimatePresence initial={false}>
                {benchOpen && hasBench && pointsSumBenchmarks ? (
                  <motion.div
                    id={benchSectionId}
                    key="bench"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className="mt-2 border-t border-white/10 pt-3"
                  >
                    <div className="grid grid-cols-2 gap-x-2 gap-y-2.5 sm:grid-cols-4 sm:gap-4">
                      <div className="min-w-0 text-center sm:text-left">
                        <div className="text-[10px] font-medium text-white/45 lg:text-xs">
                          {lb.benchMean}
                        </div>
                        <div
                          className={`mt-1 text-base leading-none text-white sm:text-lg lg:text-xl ${resultStatsMetricNumClass}`}
                        >
                          {formatMetricDecimals(pointsSumBenchmarks.mean, 1)}
                        </div>
                      </div>
                      <div className="min-w-0 text-center sm:text-left">
                        <div className="text-[10px] font-medium text-white/45 lg:text-xs">
                          {lb.benchMed}
                        </div>
                        <div
                          className={`mt-1 text-base leading-none text-white sm:text-lg lg:text-xl ${resultStatsMetricNumClass}`}
                        >
                          {formatMetricDecimals(pointsSumBenchmarks.median, 1)}
                        </div>
                      </div>
                      <div className="min-w-0 text-center sm:text-left">
                        <div className="text-[10px] font-medium text-white/45 lg:text-xs">
                          {lb.benchP90}
                        </div>
                        <div
                          className={`mt-1 text-base leading-none text-violet-200/95 sm:text-lg lg:text-xl ${resultStatsMetricNumClass}`}
                        >
                          {formatMetricDecimals(pointsSumBenchmarks.p90, 1)}
                        </div>
                      </div>
                      <div className="min-w-0 text-center sm:text-left">
                        <div className="text-[10px] font-medium text-white/45 lg:text-xs">
                          {lb.benchMax}
                        </div>
                        <div
                          className={`mt-1 text-base leading-none text-amber-100 sm:text-lg lg:text-xl ${resultStatsMetricNumClass}`}
                        >
                          {formatMetricDecimals(pointsSumBenchmarks.max, 1)}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </>
          )}
        </div>
      </div>
        <div className="hidden min-h-0 min-w-0 lg:block">
          <MetricCard
            ref={winIvWeb.ref}
            icon={<Target className="h-4 w-4" />}
            title={language === "en" ? "Win rate" : "勝率"}
          >
            {showEmptyMetrics ? (
              <EmptyMetricPlaceholder language={language} />
            ) : (
              <div className="flex items-center justify-start gap-6 sm:gap-5">
                <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-2 sm:gap-x-3">
                  <span className="self-baseline text-xs font-medium text-orange-300/95 sm:text-xs lg:text-[15px]">
                    Hit
                  </span>
                  <span
                    className={`w-full self-baseline text-right text-2xl tabular-nums text-white sm:text-3xl lg:text-[2.5rem] ${resultStatsMetricNumClass}`}
                  >
                    {cuWins}
                  </span>
                  <span className="self-baseline text-xs font-medium text-zinc-400 sm:text-xs lg:text-[15px]">
                    Miss
                  </span>
                  <span
                    className={`w-full self-baseline text-right text-2xl tabular-nums text-white/45 sm:text-3xl lg:text-[2.5rem] ${resultStatsMetricNumClass}`}
                  >
                    {cuLosses}
                  </span>
                </div>
                <WinRateOverviewDonut
                  ratio01={winRate}
                  percentDisplay={cuWinPct}
                  language={language}
                  compact
                  animationEnabled={winIvWeb.inView}
                  className="ml-1 shrink-0 scale-[0.84] max-sm:translate-x-0 sm:ml-1 sm:scale-[0.86] lg:ml-6 lg:translate-x-4 lg:scale-[1.25]"
                  percentTextClassName="lg:!text-[1.35rem]"
                  labelTextClassName="lg:!text-[10px]"
                />
              </div>
            )}
          </MetricCard>
        </div>
      </div>

      <div className="grid w-full grid-cols-[minmax(0,35fr)_minmax(0,65fr)] items-stretch gap-2 sm:gap-3 lg:grid-cols-3">
        <div className="min-h-0 min-w-0">
          <MetricCard
            ref={postsIv.ref}
            icon={<BarChart3 className="h-4 w-4" />}
            title={language === "en" ? "Total posts" : "投稿総数"}
          >
            {showEmptyMetrics ? (
              <EmptyMetricPlaceholder language={language} />
            ) : (
              <>
                <div className="flex items-end justify-between gap-2">
                  <div
                    className={`text-3xl leading-none text-white sm:text-4xl lg:text-[2.5rem] ${resultStatsMetricNumClass}`}
                  >
                    {cuPosts}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-0.5 pb-0.5 text-right">
                    <span className="text-[10px] leading-tight text-white/40 lg:text-[13px]">
                      {lb.priorMoM}
                    </span>
                    <DeltaBadge
                      language={language}
                      deltaPct={null}
                      deltaPts={
                        postsOld == null ? null : posts - postsOld
                      }
                      higherIsBetter
                      absoluteDecimals={0}
                      textSizeClass="text-[10px] lg:text-[15px]"
                      iconSizeClass="h-3 w-3 lg:h-4 lg:w-4"
                    />
                  </div>
                </div>
                {leaguePostLines.length > 0 ? (
                  <div className="mt-3 border-t border-white/10 pt-2">
                    <ul className="space-y-1">
                      {leaguePostLines.map(({ key, label, count }) => (
                        <li
                          key={key}
                          className={`text-[11px] leading-snug text-white/80 lg:text-[1.05rem] ${resultStatsMetricNumClass}`}
                        >
                          <span className="text-white/55">{label}</span>
                          <span className="text-white/40">:</span>
                          <LeaguePostCountUp
                            count={count}
                            enabled={postsIv.inView}
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </>
            )}
          </MetricCard>
        </div>
        <div className="min-h-0 min-w-0 lg:hidden">
          <MetricCard
            ref={winIvMobile.ref}
            icon={<Target className="h-4 w-4" />}
            title={language === "en" ? "Win rate" : "勝率"}
          >
            {showEmptyMetrics ? (
              <EmptyMetricPlaceholder language={language} />
            ) : (
              <div className="flex items-center justify-start gap-6 sm:gap-5">
                <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-2 sm:gap-x-3">
                  <span className="self-baseline text-xs font-medium text-orange-300/95 sm:text-xs lg:text-[15px]">
                    Hit
                  </span>
                  <span
                    className={`w-full self-baseline text-right text-2xl tabular-nums text-white sm:text-3xl lg:text-[2.5rem] ${resultStatsMetricNumClass}`}
                  >
                    {cuWins}
                  </span>
                  <span className="self-baseline text-xs font-medium text-zinc-400 sm:text-xs lg:text-[15px]">
                    Miss
                  </span>
                  <span
                    className={`w-full self-baseline text-right text-2xl tabular-nums text-white/45 sm:text-3xl lg:text-[2.5rem] ${resultStatsMetricNumClass}`}
                  >
                    {cuLosses}
                  </span>
                </div>
                <WinRateOverviewDonut
                  ratio01={winRate}
                  percentDisplay={cuWinPct}
                  language={language}
                  compact
                  animationEnabled={winIvMobile.inView}
                  className="ml-3 shrink-0 max-sm:translate-x-0.5 sm:ml-2 sm:translate-x-0 lg:ml-6 lg:translate-x-4 lg:scale-[1.25]"
                  percentTextClassName="lg:!text-[1.35rem]"
                  labelTextClassName="lg:!text-[10px]"
                />
              </div>
            )}
          </MetricCard>
        </div>
        <div className="col-span-2 grid grid-cols-2 items-stretch gap-2 sm:gap-3 lg:col-span-1 lg:contents">
          <div className="min-h-0 min-w-0">
          <MetricCard
            ref={precIv.ref}
            icon={<Crosshair className="h-4 w-4" />}
            title={language === "en" ? "Score precision" : "スコア精度"}
          >
            {showEmptyMetrics ? (
              <EmptyMetricPlaceholder language={language} />
            ) : (
              <>
                <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
                  <div>
                    <div className="text-[10px] text-white/45 lg:text-[13px]">{lb.sumTotal}</div>
                    <span className="inline-flex items-baseline gap-1">
                      <span
                        className={`text-xl leading-none text-white sm:text-2xl lg:text-[2.25rem] ${resultStatsMetricNumClass}`}
                      >
                        {formatMetricDecimals(cuPrecSum, 1)}
                      </span>
                      <span
                        className={`text-sm leading-none text-white/60 sm:text-base lg:text-xl ${resultStatsMetricNumClass}`}
                      >
                        pts
                      </span>
                    </span>
                  </div>
                  <div className="flex flex-col items-start gap-0.5 pb-0.5">
                    <span className="text-[10px] leading-tight text-white/40 lg:text-[13px]">
                      {lb.priorMoM}
                    </span>
                    <DeltaBadge
                      language={language}
                      deltaPct={null}
                      deltaPts={
                        scorePrecisionSumOld == null
                          ? null
                          : scorePrecisionSum - scorePrecisionSumOld
                      }
                      higherIsBetter
                      absoluteDecimals={1}
                      absoluteSuffix="pts"
                      textSizeClass="text-[10px] lg:text-[15px]"
                      iconSizeClass="h-3 w-3 lg:h-4 lg:w-4"
                    />
                  </div>
                </div>
                <div className="mt-3 flex w-full min-w-0 items-center gap-2 sm:gap-3">
                  <ResultStatRatingBar
                    ratio={precisionBarRatio}
                    animateMs={520}
                    delayMs={0}
                    size="md"
                    animationActive={precIv.inView}
                  />
                  <span
                    className={`shrink-0 whitespace-nowrap text-[13px] sm:text-[15px] lg:text-xl ${resultStatsMetricNumClass}`}
                  >
                    <span className="text-white/50">avg </span>
                    <span className="text-white">
                      {formatMetricDecimals(cuAvgPrec, posts > 0 ? 2 : 1)}
                    </span>
                  </span>
                </div>
              </>
            )}
          </MetricCard>
          </div>
          <div className="min-h-0 min-w-0">
          <MetricCard
            ref={upsetIv.ref}
            icon={<Zap className="h-4 w-4" />}
            title={language === "en" ? "Upset points" : "アップセット得点"}
          >
            {showEmptyMetrics ? (
              <EmptyMetricPlaceholder language={language} />
            ) : (
              <>
                <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
                  <div>
                    <div className="text-[10px] text-white/45 lg:text-[13px]">{lb.sumTotal}</div>
                    <span className="inline-flex items-baseline gap-1">
                      <span
                        className={`text-xl leading-none text-white sm:text-2xl lg:text-[2.25rem] ${resultStatsMetricNumClass}`}
                      >
                        {formatMetricDecimals(cuUpsetSum, 2)}
                      </span>
                      <span
                        className={`text-sm leading-none text-white/60 sm:text-base lg:text-xl ${resultStatsMetricNumClass}`}
                      >
                        pts
                      </span>
                    </span>
                  </div>
                  <div className="flex flex-col items-start gap-0.5 pb-0.5">
                    <span className="text-[10px] leading-tight text-white/40 lg:text-[13px]">
                      {lb.priorMoM}
                    </span>
                    <DeltaBadge
                      language={language}
                      deltaPct={null}
                      deltaPts={
                        upsetSumOld == null
                          ? null
                          : upsetSum - upsetSumOld
                      }
                      higherIsBetter
                      absoluteDecimals={2}
                      absoluteSuffix="pts"
                      textSizeClass="text-[10px] lg:text-[15px]"
                      iconSizeClass="h-3 w-3 lg:h-4 lg:w-4"
                    />
                  </div>
                </div>
                {upsetHitCount !== null ? (
                  <div className="mt-3 border-t border-white/10 pt-2">
                    <p
                      className={`text-[11px] leading-snug text-white/80 lg:text-sm ${resultStatsMetricNumClass}`}
                    >
                      <span className="text-white/55">{lb.upsetHitLabel}</span>
                      <span className="text-white/40"> : </span>
                      <span className="tabular-nums text-white/90">
                        {cuUpsetHit}
                      </span>
                      {language === "en" ? null : (
                        <span className="text-white/55">件</span>
                      )}
                    </p>
                  </div>
                ) : null}
              </>
            )}
          </MetricCard>
          </div>
        </div>
      </div>
    </div>
  );
}
