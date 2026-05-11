"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChartHorizontal,
  Trophy,
  Gauge,
  Flame,
  Crown,
  Zap,
} from "lucide-react";
import Tooltip from "@/app/component/common/Tooltip";
import { useCountUp } from "@/lib/hooks/useCountUp";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";

import {
  evaluateWinRateV2,
  evaluateScorePrecisionSumV2,
  evaluatePointsSumV3V2,
  evaluateMaxStreakV2,
  type HighlightV2,
} from "@/lib/stats/thresholdsV2";
import SummaryCardReveal from "./SummaryCardReveal";
import { summaryMetricNumClass } from "@/lib/fonts";
import { PROFILE_SHELL_GRID_STYLE } from "@/lib/profile/profileShellGrid";
import {
  summaryCardShadowDesktopClass,
  summaryCardShadowLgClass,
  summaryCardShadowSmClass,
} from "@/lib/ui/profileCardEdgeGlow";
import { formatMetricDecimals, roundMetricDecimals } from "@/lib/format/metricDecimals";
import type { SummaryRanksV2 } from "../useUserStatsV2";

export type SummaryDataV2 = {
  posts: number;
  fullPosts: number;
  recent3Posts: number;
  winRate: number;
  wins: number;
  scorePrecisionSum: number;
  upsetPointsSum: number;
  maxStreak: number;
  pointsSumV3: number;
};

type Props = {
  data: SummaryDataV2;
  compact?: boolean;
  period: "7d" | "30d";
  summaryRanks?: SummaryRanksV2;
  language?: Language;
  /** 取得完了後にカードを順番に浮き上がらせる */
  reveal?: boolean;
};

const MIN_RECENT3_POSTS = 4;

const SUMMARY_CARD_TOTAL = 6;

export default function SummaryCardsV2({
  data,
  compact = false,
  period,
  summaryRanks,
  language = "ja",
  reveal = false,
}: Props) {
  const m = t(language);
  const [tooltip, setTooltip] = useState<{
    rect: DOMRect | null;
    message: string;
  } | null>(null);

  const animatedPeriodsRef = useRef<Set<"7d" | "30d">>(new Set());
  const shouldAnimate = !animatedPeriodsRef.current.has(period);

  useEffect(() => {
    animatedPeriodsRef.current.add(period);
  }, [period]);

  const postsCount = useCountUp(data.fullPosts, 700, shouldAnimate);
  const postsText = postsCount;

  const winRateValue = Math.round((data.winRate ?? 0) * 100);
  const winRateCount = useCountUp(winRateValue, 700, shouldAnimate);
  const winRatePct = `${winRateCount}%`;

  const scorePrecisionSumValue = roundMetricDecimals(
    data.scorePrecisionSum ?? 0,
    1
  );
  const scorePrecisionSumCount = useCountUp(
    scorePrecisionSumValue,
    700,
    shouldAnimate,
    1
  );
  const scorePrecisionSumText = formatMetricDecimals(scorePrecisionSumCount, 1);

  const upsetPointsValue = Math.max(
    0,
    roundMetricDecimals(data.upsetPointsSum ?? 0, 1)
  );
  const upsetPointsCount = useCountUp(
    upsetPointsValue,
    700,
    shouldAnimate,
    1
  );
  const upsetPointsText = formatMetricDecimals(upsetPointsCount, 1);

  const maxStreakValue = Math.max(0, Math.round(data.maxStreak || 0));
  const maxStreakCount = useCountUp(maxStreakValue, 700, shouldAnimate);
  const maxStreakText = `${maxStreakCount}`;

  const totalPointsValue = Math.max(
    0,
    roundMetricDecimals(data.pointsSumV3 ?? 0, 1)
  );
  const totalPointsCount = useCountUp(
    totalPointsValue,
    700,
    shouldAnimate,
    1
  );
  const totalPointsText = formatMetricDecimals(totalPointsCount, 1);

  const enoughPosts = (data.recent3Posts ?? 0) >= MIN_RECENT3_POSTS;

  const NONE: HighlightV2 = { level: "none" };

  const hWinRaw = enoughPosts ? evaluateWinRateV2(data.winRate ?? 0) : NONE;
  const hWin = hWinRaw.level === "none" ? hWinRaw : { level: "yellow" as const };
  const hPrecisionRaw = enoughPosts
    ? evaluateScorePrecisionSumV2(data.scorePrecisionSum ?? 0, period)
    : NONE;
  const hPrecision =
    hPrecisionRaw.level === "none" ? hPrecisionRaw : { level: "yellow" as const };
  const hUpset = NONE;
  const hStreak = evaluateMaxStreakV2(data.maxStreak ?? 0);
  const hTotalRaw = enoughPosts
    ? evaluatePointsSumV3V2(data.pointsSumV3 ?? 0, period)
    : NONE;
  const hTotal =
    hTotalRaw.level === "none" ? hTotalRaw : { level: "yellow" as const };

  const padCls = compact
    ? "px-2 pt-[5px] pb-[7px] md:px-2.5 md:pt-1.5 md:pb-2"
    : "p-4";
  const gapCls = compact ? "gap-1.5 md:gap-2.5" : "gap-3";
  const labelCls = compact
    ? "text-[11px] md:text-[14px] tracking-tight"
    : "text-[14px]";
  const valueCls = compact
    ? "text-[15px] md:text-[24px] tracking-tight"
    : "text-[20px] md:text-[28px]";
  const iconSize = compact ? 13 : 20;

  const isMobile = compact;

  const formatOrdinal = (rank: number): string => {
    const mod100 = rank % 100;
    if (mod100 >= 11 && mod100 <= 13) return `${rank}th`;
    const mod10 = rank % 10;
    if (mod10 === 1) return `${rank}st`;
    if (mod10 === 2) return `${rank}nd`;
    if (mod10 === 3) return `${rank}rd`;
    return `${rank}th`;
  };
  const toRankLabel = (rank: number | null | undefined): string | null =>
    typeof rank === "number" && Number.isFinite(rank) && rank > 0
      ? ` / ${formatOrdinal(Math.floor(rank))}`
      : null;

  function openTooltip(e: React.MouseEvent, message: string) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setTooltip({ rect, message });
  }

  const ScorePrecisionLabel = useMemo(
    () => (
      <div className="flex items-center gap-1">
        {m.profile.scorePrecision}
        <button
          type="button"
          className="opacity-70 text-xs"
          onClick={(e) =>
            openTooltip(
              e,
              language === "ja"
                ? "予想スコアと実際スコアの近さを0〜10で評価し、期間内で合計した値です（高いほど良い）。"
                : "Evaluate how close your predicted score is to the actual score on a 0–10 scale, then sum it within the selected period (higher is better)."
            )
          }
        >
          ⓘ
        </button>
      </div>
    ),
    [m, language]
  );

  const UpsetPointsLabel = useMemo(
    () => (
      <div className="flex items-center gap-1">
        {m.profile.upsetPoints}
        <button
          type="button"
          className="opacity-70 text-xs"
          onClick={(e) =>
            openTooltip(
              e,
              language === "ja"
                ? "アップセットが起きた試合で少数派を当てたときだけ加点（1試合0〜10）。期間内の合計点です。"
                : "Upset Points are awarded only when you correctly predict an upset (0–10 per match). This is the total within the selected period."
            )
          }
        >
          ⓘ
        </button>
      </div>
    ),
    [m, language]
  );

  const MaxStreakLabel = useMemo(
    () => (
      <div className="flex items-center gap-1">
        {m.profile.maxWinStreak}
        <button
          type="button"
          className="opacity-70 text-xs"
          onClick={(e) =>
            openTooltip(
              e,
              language === "ja"
                ? "この期間内で記録した最長の連勝数です。"
                : "The longest win streak you recorded within this period."
            )
          }
        >
          ⓘ
        </button>
      </div>
    ),
    [m, language]
  );

  const TotalPointsLabel = useMemo(
    () => (
      <div className="flex items-center gap-1">
        {m.profile.totalPoints}
        <button
          type="button"
          className="opacity-70 text-xs"
          onClick={(e) =>
            openTooltip(
              e,
              language === "ja"
                ? "勝者的中・点差/合計の近さ・（条件付き）アップセットボーナスを合算した pointsV3 の期間内合計点です。"
                : "Total Points within the selected period of pointsV3: winner accuracy, closeness of point difference/total, plus (conditional) upset bonus."
            )
          }
        >
          ⓘ
        </button>
      </div>
    ),
    [m, language]
  );

  const wrap = (i: number, node: React.ReactNode) => (
    <SummaryCardReveal
      key={i}
      index={i}
      total={SUMMARY_CARD_TOTAL}
      enabled={reveal}
      enterVariant="fade"
      className="min-w-0"
    >
      {node}
    </SummaryCardReveal>
  );

  if (isMobile) {
    return (
      <>
        <div className={`mt-3 grid grid-cols-2 items-start ${gapCls}`}>
          {wrap(
            0,
            <Card
              icon={<BarChartHorizontal size={iconSize} />}
              label={m.profile.postsCount}
              value={postsText}
              padCls={padCls}
              labelCls={labelCls}
              valueCls={`${summaryMetricNumClass} ${valueCls}`}
              compactShell={compact}
            />
          )}

          {wrap(
            1,
            <Card
              icon={<Trophy size={iconSize} />}
              label={m.profile.winRate}
              value={winRatePct}
              padCls={padCls}
              labelCls={labelCls}
              valueCls={decorate(`${summaryMetricNumClass} ${valueCls}`, hWin)}
              afterIcon={highlightIcon(hWin, iconSize)}
              compactShell={compact}
            />
          )}

          {wrap(
            2,
            <Card
              icon={<Gauge size={iconSize} />}
              label={ScorePrecisionLabel}
              value={scorePrecisionSumText}
              padCls={padCls}
              labelCls={labelCls}
              valueCls={decorate(`${summaryMetricNumClass} ${valueCls}`, hPrecision)}
              afterIcon={highlightIcon(hPrecision, iconSize)}
              rankLabel={toRankLabel(summaryRanks?.totalPrecision)}
              rankHighlight={summaryRanks?.totalPrecision != null && summaryRanks.totalPrecision <= 20}
              compactShell={compact}
            />
          )}

          {wrap(
            3,
            <Card
              icon={<Zap size={iconSize} />}
              label={UpsetPointsLabel}
              value={upsetPointsText}
              padCls={padCls}
              labelCls={labelCls}
              valueCls={decorate(`${summaryMetricNumClass} ${valueCls}`, hUpset)}
              afterIcon={highlightIcon(hUpset, iconSize)}
              rankLabel={toRankLabel(summaryRanks?.totalUpset)}
              rankHighlight={summaryRanks?.totalUpset != null && summaryRanks.totalUpset <= 20}
              compactShell={compact}
            />
          )}

          {wrap(
            4,
            <Card
              icon={<Flame size={iconSize} />}
              label={MaxStreakLabel}
              value={maxStreakText}
              padCls={padCls}
              labelCls={labelCls}
              valueCls={decorate(`${summaryMetricNumClass} ${valueCls}`, hStreak)}
              afterIcon={highlightIcon(hStreak, iconSize)}
              compactShell={compact}
            />
          )}

          {wrap(
            5,
            <Card
              icon={<Crown size={iconSize} />}
              label={TotalPointsLabel}
              value={totalPointsText}
              padCls={padCls}
              labelCls={labelCls}
              valueCls={decorate(`${summaryMetricNumClass} ${valueCls}`, hTotal)}
              afterIcon={highlightIcon(hTotal, iconSize)}
              rankLabel={toRankLabel(summaryRanks?.totalPoints)}
              rankHighlight={summaryRanks?.totalPoints != null && summaryRanks.totalPoints <= 20}
              compactShell={compact}
            />
          )}
        </div>

        {tooltip && (
          <Tooltip
            anchorRect={tooltip.rect}
            message={tooltip.message}
            onClose={() => setTooltip(null)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className={`mt-6 grid grid-cols-6 ${gapCls}`}>
        {wrap(
          0,
          <Card
            label={m.profile.postsCount}
            value={postsText}
            padCls={padCls}
            labelCls={labelCls}
            valueCls={`${summaryMetricNumClass} ${valueCls}`}
          />
        )}

        {wrap(
          1,
          <Card
            label={m.profile.winRate}
            value={winRatePct}
            padCls={padCls}
            labelCls={labelCls}
            valueCls={decorate(`${summaryMetricNumClass} ${valueCls}`, hWin)}
            afterIcon={highlightIcon(hWin, iconSize)}
            compactShell={compact}
          />
        )}

        {wrap(
          2,
          <Card
            label={ScorePrecisionLabel}
            value={scorePrecisionSumText}
            padCls={padCls}
            labelCls={labelCls}
            valueCls={decorate(`${summaryMetricNumClass} ${valueCls}`, hPrecision)}
            afterIcon={highlightIcon(hPrecision, iconSize)}
            rankLabel={toRankLabel(summaryRanks?.totalPrecision)}
            rankHighlight={summaryRanks?.totalPrecision != null && summaryRanks.totalPrecision <= 20}
            compactShell={compact}
          />
        )}

        {wrap(
          3,
          <Card
            label={UpsetPointsLabel}
            value={upsetPointsText}
            padCls={padCls}
            labelCls={labelCls}
            valueCls={decorate(`${summaryMetricNumClass} ${valueCls}`, hUpset)}
            afterIcon={highlightIcon(hUpset, iconSize)}
            rankLabel={toRankLabel(summaryRanks?.totalUpset)}
            rankHighlight={summaryRanks?.totalUpset != null && summaryRanks.totalUpset <= 20}
            compactShell={compact}
          />
        )}

        {wrap(
          4,
          <Card
            label={MaxStreakLabel}
            value={maxStreakText}
            padCls={padCls}
            labelCls={labelCls}
            valueCls={decorate(`${summaryMetricNumClass} ${valueCls}`, hStreak)}
            afterIcon={highlightIcon(hStreak, iconSize)}
            compactShell={compact}
          />
        )}

        {wrap(
          5,
          <Card
            label={TotalPointsLabel}
            value={totalPointsText}
            padCls={padCls}
            labelCls={labelCls}
            valueCls={decorate(`${summaryMetricNumClass} ${valueCls}`, hTotal)}
            afterIcon={highlightIcon(hTotal, iconSize)}
            rankLabel={toRankLabel(summaryRanks?.totalPoints)}
            rankHighlight={summaryRanks?.totalPoints != null && summaryRanks.totalPoints <= 20}
            compactShell={compact}
          />
        )}
      </div>

      {tooltip && (
        <Tooltip
          anchorRect={tooltip.rect}
          message={tooltip.message}
          onClose={() => setTooltip(null)}
        />
      )}
    </>
  );
}

function decorate(base: string, h: HighlightV2) {
  if (h.level === "strong") {
    return `${base} text-yellow-300`;
  }
  if (h.level === "yellow") {
    return `${base} text-amber-300`;
  }
  return `${base} text-white`;
}

function highlightIcon(h: HighlightV2, size: number) {
  if (h.icon === "crown") {
    return <Crown className="ml-1 inline-block" size={size - 2} />;
  }
  if (h.icon === "fire") {
    return <Flame className="ml-1 inline-block" size={size - 2} />;
  }
  return null;
}

function Card({
  icon,
  label,
  value,
  padCls,
  labelCls,
  valueCls,
  afterIcon,
  rankLabel,
  rankHighlight = false,
  compactShell,
}: {
  icon?: React.ReactNode;
  label: React.ReactNode;
  value: string | number;
  padCls: string;
  labelCls: string;
  valueCls: string;
  afterIcon?: React.ReactNode;
  rankLabel?: string | null;
  rankHighlight?: boolean;
  compactShell?: boolean;
}) {
  const shell = compactShell
    ? [
        "relative min-w-0 overflow-hidden rounded-lg border border-white/15 bg-[#050814]/80 text-center",
        summaryCardShadowSmClass,
        "md:rounded-xl md:border-white/10",
        summaryCardShadowLgClass,
      ].join(" ")
    : [
        "relative min-w-0 overflow-hidden rounded-xl border border-white/10 bg-[#050814]/80 text-center",
        summaryCardShadowDesktopClass,
      ].join(" ");

  return (
    <div className={`${shell} ${padCls}`}>
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.36]"
        style={PROFILE_SHELL_GRID_STYLE}
        aria-hidden
      />
      <div className="relative z-1">
        <div
          className={`flex items-center justify-center gap-1 text-white/85 md:gap-1.5 ${compactShell ? "mb-1 md:mb-1.5" : "mb-1"}`}
        >
          {icon && <span className="inline-flex">{icon}</span>}
          <span className={`${labelCls} font-semibold tracking-[0.2px]`}>
            {label}
          </span>
        </div>

        <div className="flex items-center justify-center truncate leading-none">
          {rankLabel ? (
            <span
              className={[
                "invisible ml-0.5 text-[9px] font-semibold md:ml-1 md:text-[11px]",
                rankHighlight ? "text-yellow-300" : "text-white/55",
              ].join(" ")}
              aria-hidden
            >
              {rankLabel}
            </span>
          ) : null}
          <span className={`${valueCls} truncate`}>{value}</span>
          {rankLabel ? (
            <span
              className={[
                "ml-0.5 text-[9px] font-semibold md:ml-1 md:text-[11px]",
                rankHighlight ? "text-yellow-300" : "text-white/55",
              ].join(" ")}
            >
              {rankLabel}
            </span>
          ) : null}
          {afterIcon}
        </div>
      </div>
    </div>
  );
}