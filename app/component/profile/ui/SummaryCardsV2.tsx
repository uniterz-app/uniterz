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
import { Alfa_Slab_One } from "next/font/google";

import Tooltip from "@/app/component/common/Tooltip";
import { useCountUp } from "@/lib/hooks/useCountUp";

import {
  evaluateWinRateV2,
  evaluateScorePrecisionSumV2,
  evaluatePointsSumV3V2,
  evaluateMaxStreakV2,
  type HighlightV2,
} from "@/lib/stats/thresholdsV2";

const alfa = Alfa_Slab_One({ weight: "400", subsets: ["latin"] });

export type SummaryDataV2 = {
  posts: number;
  fullPosts: number;
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
};

const MIN_POSTS = {
  "7d": 4,
  "30d": 10,
  all: 20,
} as const;

export default function SummaryCardsV2({
  data,
  compact = false,
  period,
}: Props) {
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
    shouldAnimate
  );
  const scorePrecisionSumText = scorePrecisionSumCount.toFixed(1);

  const upsetPointsValue = Math.max(0, Math.round(data.upsetPointsSum || 0));
  const upsetPointsCount = useCountUp(upsetPointsValue, 700, shouldAnimate);
  const upsetPointsText = `${upsetPointsCount}`;

  const maxStreakValue = Math.max(0, Math.round(data.maxStreak || 0));
  const maxStreakCount = useCountUp(maxStreakValue, 700, shouldAnimate);
  const maxStreakText = `${maxStreakCount}`;

  const totalPointsValue = Math.max(0, Math.round(data.pointsSumV3 || 0));
  const totalPointsCount = useCountUp(totalPointsValue, 700, shouldAnimate);
  const totalPointsText = `${totalPointsCount}`;

  const min = MIN_POSTS[period];
  const enoughPosts = data.fullPosts >= min;

  const NONE: HighlightV2 = { level: "none" };

  const hWin = enoughPosts ? evaluateWinRateV2(data.winRate ?? 0) : NONE;
  const hPrecision = enoughPosts
    ? evaluateScorePrecisionSumV2(data.scorePrecisionSum ?? 0, period)
    : NONE;
  const hUpset = NONE;
  const hStreak = evaluateMaxStreakV2(data.maxStreak ?? 0);
  const hTotal = enoughPosts
    ? evaluatePointsSumV3V2(data.pointsSumV3 ?? 0, period)
    : NONE;

  const padCls = compact ? "p-2 md:p-3" : "p-4";
  const gapCls = compact ? "gap-2" : "gap-3";
  const labelCls = compact ? "text-[12px] md:text-[13px]" : "text-[14px]";
  const valueCls =
    compact ? "text-[18px] md:text-[24px]" : "text-[20px] md:text-[28px]";
  const iconSize = compact ? 16 : 20;

  const isMobile = compact;

  function openTooltip(e: React.MouseEvent, message: string) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setTooltip({ rect, message });
  }

  const ScorePrecisionLabel = useMemo(
    () => (
      <div className="flex items-center gap-1">
        点差精度
        <button
          type="button"
          className="opacity-70 text-xs"
          onClick={(e) =>
            openTooltip(
              e,
              "予想スコアと実際スコアの近さを0〜10で評価し、期間内で合計した値です（高いほど良い）。"
            )
          }
        >
          ⓘ
        </button>
      </div>
    ),
    []
  );

  const UpsetPointsLabel = useMemo(
    () => (
      <div className="flex items-center gap-1">
        アップセット得点
        <button
          type="button"
          className="opacity-70 text-xs"
          onClick={(e) =>
            openTooltip(
              e,
              "アップセットが起きた試合で少数派を当てたときだけ加点（1試合0〜10）。期間内の合計点です。"
            )
          }
        >
          ⓘ
        </button>
      </div>
    ),
    []
  );

  const MaxStreakLabel = useMemo(
    () => (
      <div className="flex items-center gap-1">
        最大連勝
        <button
          type="button"
          className="opacity-70 text-xs"
          onClick={(e) =>
            openTooltip(
              e,
              "この期間内で記録した最長の連勝数です。"
            )
          }
        >
          ⓘ
        </button>
      </div>
    ),
    []
  );

  const TotalPointsLabel = useMemo(
    () => (
      <div className="flex items-center gap-1">
        総合得点
        <button
          type="button"
          className="opacity-70 text-xs"
          onClick={(e) =>
            openTooltip(
              e,
              "勝者的中・点差/合計の近さ・（条件付き）アップセットボーナスを合算した pointsV3 の期間内合計点です。"
            )
          }
        >
          ⓘ
        </button>
      </div>
    ),
    []
  );

  if (isMobile) {
    return (
      <>
        <div className={`mt-6 grid grid-cols-2 ${gapCls}`}>
          <Card
            icon={<BarChartHorizontal size={iconSize} />}
            label="投稿数"
            value={postsText}
            padCls={padCls}
            labelCls={labelCls}
            valueCls={`${alfa.className} ${valueCls}`}
          />

          <Card
            icon={<Trophy size={iconSize} />}
            label="勝率"
            value={winRatePct}
            padCls={padCls}
            labelCls={labelCls}
            valueCls={decorate(`${alfa.className} ${valueCls}`, hWin)}
            afterIcon={highlightIcon(hWin, iconSize)}
          />

          <Card
            icon={<Gauge size={iconSize} />}
            label={ScorePrecisionLabel}
            value={scorePrecisionSumText}
            padCls={padCls}
            labelCls={labelCls}
            valueCls={decorate(`${alfa.className} ${valueCls}`, hPrecision)}
            afterIcon={highlightIcon(hPrecision, iconSize)}
          />

          <Card
            icon={<Zap size={iconSize} />}
            label={UpsetPointsLabel}
            value={upsetPointsText}
            padCls={padCls}
            labelCls={labelCls}
            valueCls={decorate(`${alfa.className} ${valueCls}`, hUpset)}
            afterIcon={highlightIcon(hUpset, iconSize)}
          />

          <Card
            icon={<Flame size={iconSize} />}
            label={MaxStreakLabel}
            value={maxStreakText}
            padCls={padCls}
            labelCls={labelCls}
            valueCls={decorate(`${alfa.className} ${valueCls}`, hStreak)}
            afterIcon={highlightIcon(hStreak, iconSize)}
          />

          <Card
            icon={<Crown size={iconSize} />}
            label={TotalPointsLabel}
            value={totalPointsText}
            padCls={padCls}
            labelCls={labelCls}
            valueCls={decorate(`${alfa.className} ${valueCls}`, hTotal)}
            afterIcon={highlightIcon(hTotal, iconSize)}
          />
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
        <Card
          label="投稿数"
          value={postsText}
          padCls={padCls}
          labelCls={labelCls}
          valueCls={`${alfa.className} ${valueCls}`}
        />

        <Card
          label="勝率"
          value={winRatePct}
          padCls={padCls}
          labelCls={labelCls}
          valueCls={decorate(`${alfa.className} ${valueCls}`, hWin)}
          afterIcon={highlightIcon(hWin, iconSize)}
        />

        <Card
          label={ScorePrecisionLabel}
          value={scorePrecisionSumText}
          padCls={padCls}
          labelCls={labelCls}
          valueCls={decorate(`${alfa.className} ${valueCls}`, hPrecision)}
          afterIcon={highlightIcon(hPrecision, iconSize)}
        />

        <Card
          label={UpsetPointsLabel}
          value={upsetPointsText}
          padCls={padCls}
          labelCls={labelCls}
          valueCls={decorate(`${alfa.className} ${valueCls}`, hUpset)}
          afterIcon={highlightIcon(hUpset, iconSize)}
        />

        <Card
          label={MaxStreakLabel}
          value={maxStreakText}
          padCls={padCls}
          labelCls={labelCls}
          valueCls={decorate(`${alfa.className} ${valueCls}`, hStreak)}
          afterIcon={highlightIcon(hStreak, iconSize)}
        />

        <Card
          label={TotalPointsLabel}
          value={totalPointsText}
          padCls={padCls}
          labelCls={labelCls}
          valueCls={decorate(`${alfa.className} ${valueCls}`, hTotal)}
          afterIcon={highlightIcon(hTotal, iconSize)}
        />
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
    return `${base} text-yellow-300 drop-shadow-[0_0_6px_rgba(234,179,8,0.35)]`;
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
}: {
  icon?: React.ReactNode;
  label: React.ReactNode;
  value: string | number;
  padCls: string;
  labelCls: string;
  valueCls: string;
  afterIcon?: React.ReactNode;
}) {
  return (
    <div
      className={`min-w-0 rounded-xl border border-white/10 bg-[#050814]/80 text-center shadow-[0_10px_30px_rgba(0,0,0,0.45)] ${padCls}`}
    >
      <div className="mb-1 flex items-center justify-center gap-2 text-white/85">
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