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

import {
  evaluateWinRateV2,
  evaluateScorePrecisionSumV2,
  evaluatePointsSumV3V2,
  evaluateMaxStreakV2,
  type HighlightV2,
} from "@/lib/stats/thresholdsV2";
import SummaryCardReveal from "./SummaryCardReveal";
import { summaryMetricNumClass } from "@/lib/fonts";

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
  period: "7d" | "30d" | "all";
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
  language = "ja",
  reveal = false,
}: Props) {
  const isEn = language === "en";
  const [tooltip, setTooltip] = useState<{
    rect: DOMRect | null;
    message: string;
  } | null>(null);

  const animatedPeriodsRef = useRef<Set<"7d" | "30d" | "all">>(new Set());
  const shouldAnimate = !animatedPeriodsRef.current.has(period);

  useEffect(() => {
    animatedPeriodsRef.current.add(period);
  }, [period]);

  const postsCount = useCountUp(data.fullPosts, 700, shouldAnimate);
  const postsText = postsCount;

  const winRateValue = Math.round((data.winRate ?? 0) * 100);
  const winRateCount = useCountUp(winRateValue, 700, shouldAnimate);
  const winRatePct = `${winRateCount}%`;

  const scorePrecisionSumValue = Number(
    (data.scorePrecisionSum ?? 0).toFixed(1)
  );
  const scorePrecisionSumCount = useCountUp(
    scorePrecisionSumValue,
    700,
    shouldAnimate,
    1
  );
  const scorePrecisionSumText = scorePrecisionSumCount.toFixed(1);

  const upsetPointsValue = Math.max(
    0,
    Number((data.upsetPointsSum ?? 0).toFixed(1))
  );
  const upsetPointsCount = useCountUp(
    upsetPointsValue,
    700,
    shouldAnimate,
    1
  );
  const upsetPointsText = upsetPointsCount.toFixed(1);

  const maxStreakValue = Math.max(0, Math.round(data.maxStreak || 0));
  const maxStreakCount = useCountUp(maxStreakValue, 700, shouldAnimate);
  const maxStreakText = `${maxStreakCount}`;

  const totalPointsValue = Math.max(
    0,
    Number((data.pointsSumV3 ?? 0).toFixed(1))
  );
  const totalPointsCount = useCountUp(
    totalPointsValue,
    700,
    shouldAnimate,
    1
  );
  const totalPointsText = totalPointsCount.toFixed(1);

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

  const padCls = compact ? "p-1.5 md:p-3" : "p-4";
  const gapCls = compact ? "gap-1.5 md:gap-3" : "gap-3";
  const labelCls = compact
    ? "text-[10px] md:text-[13px] tracking-tight"
    : "text-[14px]";
  const valueCls = compact
    ? "text-[14px] md:text-[24px] tracking-tight"
    : "text-[20px] md:text-[28px]";
  const iconSize = compact ? 13 : 20;

  const isMobile = compact;

  function openTooltip(e: React.MouseEvent, message: string) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setTooltip({ rect, message });
  }

  const ScorePrecisionLabel = useMemo(
    () => (
      <div className="flex items-center gap-1">
        {isEn ? "Score Precision" : "スコア精度"}
        <button
          type="button"
          className="opacity-70 text-xs"
          onClick={(e) =>
            openTooltip(
              e,
              isEn
                ? "Evaluate how close your predicted score is to the actual score on a 0–10 scale, then sum it within the selected period (higher is better)."
                : "予想スコアと実際スコアの近さを0〜10で評価し、期間内で合計した値です（高いほど良い）。"
            )
          }
        >
          ⓘ
        </button>
      </div>
    ),
    [isEn]
  );

  const UpsetPointsLabel = useMemo(
    () => (
      <div className="flex items-center gap-1">
        {isEn ? "Upset Points" : "アップセット得点"}
        <button
          type="button"
          className="opacity-70 text-xs"
          onClick={(e) =>
            openTooltip(
              e,
              isEn
                ? "Upset Points are awarded only when you correctly predict an upset (0–10 per match). This is the total within the selected period."
                : "アップセットが起きた試合で少数派を当てたときだけ加点（1試合0〜10）。期間内の合計点です。"
            )
          }
        >
          ⓘ
        </button>
      </div>
    ),
    [isEn]
  );

  const MaxStreakLabel = useMemo(
    () => (
      <div className="flex items-center gap-1">
        {isEn ? "Max Win Streak" : "最大連勝"}
        <button
          type="button"
          className="opacity-70 text-xs"
          onClick={(e) =>
            openTooltip(
              e,
              isEn
                ? "The longest win streak you recorded within this period."
                : "この期間内で記録した最長の連勝数です。"
            )
          }
        >
          ⓘ
        </button>
      </div>
    ),
    [isEn]
  );

  const TotalPointsLabel = useMemo(
    () => (
      <div className="flex items-center gap-1">
        {isEn ? "Total Points" : "総合得点"}
        <button
          type="button"
          className="opacity-70 text-xs"
          onClick={(e) =>
            openTooltip(
              e,
              isEn
                ? "Total Points within the selected period of pointsV3: winner accuracy, closeness of point difference/total, plus (conditional) upset bonus."
                : "勝者的中・点差/合計の近さ・（条件付き）アップセットボーナスを合算した pointsV3 の期間内合計点です。"
            )
          }
        >
          ⓘ
        </button>
      </div>
    ),
    [isEn]
  );

  const wrap = (i: number, node: React.ReactNode) => (
    <SummaryCardReveal
      key={i}
      index={i}
      total={SUMMARY_CARD_TOTAL}
      enabled={reveal}
      className="min-w-0"
    >
      {node}
    </SummaryCardReveal>
  );

  if (isMobile) {
    return (
      <>
        <div className={`mt-6 grid grid-cols-2 ${gapCls}`}>
          {wrap(
            0,
            <Card
              icon={<BarChartHorizontal size={iconSize} />}
              label={isEn ? "Posts" : "投稿数"}
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
              label={isEn ? "Win Rate" : "勝率"}
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
            label={isEn ? "Posts" : "投稿数"}
            value={postsText}
            padCls={padCls}
            labelCls={labelCls}
            valueCls={`${summaryMetricNumClass} ${valueCls}`}
          />
        )}

        {wrap(
          1,
          <Card
            label={isEn ? "Win Rate" : "勝率"}
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
  compactShell,
}: {
  icon?: React.ReactNode;
  label: React.ReactNode;
  value: string | number;
  padCls: string;
  labelCls: string;
  valueCls: string;
  afterIcon?: React.ReactNode;
  compactShell?: boolean;
}) {
  const shell = compactShell
    ? "min-w-0 rounded-lg md:rounded-xl border border-white/15 md:border-white/10 bg-[#050814]/80 text-center shadow-[0_2px_10px_rgba(0,0,0,0.28)] md:shadow-[0_10px_30px_rgba(0,0,0,0.45)]"
    : "min-w-0 rounded-xl border border-white/10 bg-[#050814]/80 text-center shadow-[0_10px_30px_rgba(0,0,0,0.45)]";

  return (
    <div className={`${shell} ${padCls}`}>
      <div
        className={`flex items-center justify-center gap-1.5 text-white/85 md:gap-2 ${compactShell ? "mb-0.5 md:mb-1" : "mb-1"}`}
      >
        {icon && <span className="inline-flex">{icon}</span>}
        <span className={`${labelCls} font-semibold tracking-[0.2px]`}>
          {label}
        </span>
      </div>

      <div className="flex items-center justify-center truncate leading-none">
        <span className={`${valueCls} truncate`}>{value}</span>
        {afterIcon}
      </div>
    </div>
  );
}