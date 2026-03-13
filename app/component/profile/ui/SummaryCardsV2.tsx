"use client";

import React, { useState } from "react";
import {
  BarChartHorizontal,
  Trophy,
  Gauge,
  Target,
  Flame,
  Crown,
  Zap,
} from "lucide-react";
import { Alfa_Slab_One } from "next/font/google";

import Tooltip from "@/app/component/common/Tooltip";
import { useCountUp } from "@/lib/hooks/useCountUp";

import {
  evaluateWinRateV2,
  evaluatePrecisionV2,
  evaluateAccuracyV2,
  type HighlightV2,
} from "@/lib/stats/thresholdsV2";

const alfa = Alfa_Slab_One({ weight: "400", subsets: ["latin"] });

export type SummaryDataV2 = {
  posts: number;
  fullPosts: number;
  winRate: number;
  wins: number;
  scorePrecisionSum: number;
  avgBrier: number;
  upsetPointsSum: number;
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
  "all": 20,
} as const;

export default function SummaryCardsV2({ data, compact = false, period }: Props) {
  const [tooltip, setTooltip] = useState<{
    rect: DOMRect | null;
    message: string;
  } | null>(null);

  const postsCount = useCountUp(data.fullPosts, 700, true);
  const postsText = postsCount;

  const winRateValue = Math.round((data.winRate ?? 0) * 100);
  const winRateCount = useCountUp(winRateValue, 700, true);
  const winRatePct = `${winRateCount}%`;

  const scorePrecisionSumValue = Number((data.scorePrecisionSum ?? 0).toFixed(1));
  const scorePrecisionSumCount = useCountUp(scorePrecisionSumValue, 700, true);
  const scorePrecisionSumText = scorePrecisionSumCount.toFixed(1);

  const probAccuracy =
    data.posts === 0
      ? 0
      : Math.max(0, Math.min(100, Math.round((1 - (data.avgBrier ?? 0)) * 100)));
  const probAccuracyCount = useCountUp(probAccuracy, 700, true);
  const probAccuracyText = `${probAccuracyCount}%`;

  const upsetPointsValue = Math.max(0, Math.round(data.upsetPointsSum || 0));
  const upsetPointsCount = useCountUp(upsetPointsValue, 700, true);
  const upsetPointsText = `${upsetPointsCount}`;

  const totalPointsValue = Math.max(0, Math.round(data.pointsSumV3 || 0));
  const totalPointsCount = useCountUp(totalPointsValue, 700, true);
  const totalPointsText = `${totalPointsCount}`;

  const min = MIN_POSTS[period];
  const enoughPosts = data.fullPosts >= min;

  const NONE: HighlightV2 = { level: "none" };

  const avgPrecisionForHighlight =
    data.posts > 0 ? (data.scorePrecisionSum ?? 0) / data.posts : 0;

  const hWin = enoughPosts ? evaluateWinRateV2(data.winRate ?? 0) : NONE;
  const hPrecision = enoughPosts
    ? evaluatePrecisionV2(avgPrecisionForHighlight)
    : NONE;
  const hProb = enoughPosts ? evaluateAccuracyV2(probAccuracy) : NONE;

  const hUpset = NONE;
  const hTotal = NONE;

  const padCls = compact ? "p-2 md:p-3" : "p-4";
  const gapCls = compact ? "gap-2" : "gap-3";
  const labelCls = compact ? "text-[12px] md:text-[13px]" : "text-[14px]";
  const valueCls =
    compact ? "text-[18px] md:text-[24px]" : "text-[20px] md:text-[28px]";
  const iconSize = compact ? 16 : 20;

  const isMobile =
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 768px)").matches;

  function openTooltip(e: React.MouseEvent, message: string) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setTooltip({ rect, message });
  }

  const ScorePrecisionLabel = (
    <div className="flex items-center gap-1">
      スコア精度
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
  );

  const ProbPrecisionLabel = (
    <div className="flex items-center gap-1">
      確率精度
      <button
        type="button"
        className="opacity-70 text-xs"
        onClick={(e) =>
          openTooltip(
            e,
            "自信度（確率）と結果の整合性を評価します。表示は高いほど良い（Brierを反転して%化）です。"
          )
        }
      >
        ⓘ
      </button>
    </div>
  );

  const UpsetPointsLabel = (
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
  );

  const TotalPointsLabel = (
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
  );

  if (isMobile) {
    return (
      <>
        <div className={`grid grid-cols-2 ${gapCls} mt-6`}>
          <Card
            icon={<BarChartHorizontal size={iconSize} />}
            label="確定分析数"
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
            icon={<Target size={iconSize} />}
            label={ProbPrecisionLabel}
            value={probAccuracyText}
            padCls={padCls}
            labelCls={labelCls}
            valueCls={decorate(`${alfa.className} ${valueCls}`, hProb)}
            afterIcon={highlightIcon(hProb, iconSize)}
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
      <div className={`grid grid-cols-6 ${gapCls} mt-6`}>
        <Card
          label="確定分析数"
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
          label={ProbPrecisionLabel}
          value={probAccuracyText}
          padCls={padCls}
          labelCls={labelCls}
          valueCls={decorate(`${alfa.className} ${valueCls}`, hProb)}
          afterIcon={highlightIcon(hProb, iconSize)}
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
    return <Crown className="inline-block ml-1" size={size - 2} />;
  }
  if (h.icon === "fire") {
    return <Flame className="inline-block ml-1" size={size - 2} />;
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
      className={`rounded-xl border border-white/10 bg-[#050814]/80 shadow-[0_10px_30px_rgba(0,0,0,0.45)] ${padCls} text-center min-w-0`}
    >
      <div className="mb-1 flex items-center justify-center gap-2 text-white/85">
        {icon && <span className="inline-flex">{icon}</span>}
        <span className={`${labelCls} font-semibold tracking-[0.2px]`}>
          {label}
        </span>
      </div>

      <div className="flex items-center justify-center leading-none truncate">
        <span className={`${valueCls} truncate`}>{value}</span>
        {afterIcon}
      </div>
    </div>
  );
}