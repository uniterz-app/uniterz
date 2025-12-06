"use client";

import React from "react";
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

const alfa = Alfa_Slab_One({ weight: "400", subsets: ["latin"] });

/* 新しい V2 ハイライトロジック */
import {
  evaluateWinRateV2,
  evaluatePrecisionV2,
  evaluateAccuracyV2,
  evaluateUpsetV2,
  type HighlightV2,
} from "@/lib/stats/thresholdsV2";

/* 受け取るデータ構造 */
export type SummaryDataV2 = {
  posts: number;
  winRate: number;       // 0..1
  avgPrecision: number;  // 0..15 新しい点差精度
  avgBrier: number;      // 0..1
  avgUpset: number;      // 0..10
};

type Props = {
  data: SummaryDataV2;
  compact?: boolean;
};

export default function SummaryCardsV2({ data, compact = false }: Props) {
  const postsText = `${data.posts}`;
  const winRatePct = `${Math.round(data.winRate * 100)}%`;
  const precisionText = data.avgPrecision.toFixed(1); // ← 差し替え
  const accuracy = Math.max(0, Math.min(100, Math.round((1 - data.avgBrier) * 100)));
  const accuracyText = `${accuracy}%`;
  const upsetText = data.avgUpset.toFixed(1);

  // ── ハイライト判定 ─────────────
  const hWin = evaluateWinRateV2(data.winRate);
  const hPrecision = evaluatePrecisionV2(data.avgPrecision); // ← 差し替え
  const hAcc = evaluateAccuracyV2(accuracy);
  const hUpset = evaluateUpsetV2(data.avgUpset);

  const padCls = compact ? "p-2 md:p-3" : "p-4";
  const gapCls = compact ? "gap-2" : "gap-3";
  const labelCls = compact ? "text-[12px] md:text-[13px]" : "text-[14px]";
  const valueCls =
    compact ? "text-[18px] md:text-[24px]" : "text-[20px] md:text-[28px]";
  const iconSize = compact ? 16 : 20;

  // ── モバイル判定 ─────────────
  const isMobile =
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 768px)").matches;

  /* モバイルでは 1-2-2 レイアウト */
  if (isMobile) {
    return (
      <div className={`grid grid-cols-2 ${gapCls} mt-6`}>
        {/* 1段目：投稿数 */}
        <div className="col-span-2">
          <Card
            icon={<BarChartHorizontal size={iconSize} />}
            label="分析数"
            value={postsText}
            padCls={padCls}
            labelCls={labelCls}
            valueCls={`${alfa.className} ${valueCls}`}
          />
        </div>

        {/* 2段目：勝率 / 点差精度 */}
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
          label="点差精度"
          value={precisionText}
          padCls={padCls}
          labelCls={labelCls}
          valueCls={decorate(`${alfa.className} ${valueCls}`, hPrecision)}
          afterIcon={highlightIcon(hPrecision, iconSize)}
        />

        {/* 3段目：自信精度 / UPSET */}
        <Card
          icon={<Target size={iconSize} />}
          label="正確性"
          value={accuracyText}
          padCls={padCls}
          labelCls={labelCls}
          valueCls={decorate(`${alfa.className} ${valueCls}`, hAcc)}
          afterIcon={highlightIcon(hAcc, iconSize)}
        />

        <Card
          icon={<Zap size={iconSize} />}
          label="UPSET指数"
          value={upsetText}
          padCls={padCls}
          labelCls={labelCls}
          valueCls={decorate(`${alfa.className} ${valueCls}`, hUpset)}
          afterIcon={highlightIcon(hUpset, iconSize)}
        />
      </div>
    );
  }

  /* Web版（5枚横並び） */
  return (
    <div className={`grid grid-cols-5 ${gapCls} mt-6`}>
      <Card
        icon={<BarChartHorizontal size={iconSize} />}
        label="分析数"
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
        label="点差精度"
        value={precisionText}
        padCls={padCls}
        labelCls={labelCls}
        valueCls={decorate(`${alfa.className} ${valueCls}`, hPrecision)}
        afterIcon={highlightIcon(hPrecision, iconSize)}
      />

      <Card
        icon={<Target size={iconSize} />}
        label="正確性"
        value={accuracyText}
        padCls={padCls}
        labelCls={labelCls}
        valueCls={decorate(`${alfa.className} ${valueCls}`, hAcc)}
        afterIcon={highlightIcon(hAcc, iconSize)}
      />

      <Card
        icon={<Zap size={iconSize} />}
        label="UPSET指数"
        value={upsetText}
        padCls={padCls}
        labelCls={labelCls}
        valueCls={decorate(`${alfa.className} ${valueCls}`, hUpset)}
        afterIcon={highlightIcon(hUpset, iconSize)}
      />
    </div>
  );
}

/* ---------------- 共通 UI パーツ ---------------- */

function decorate(base: string, h: HighlightV2) {
  if (h.level === "strong")
    return `${base} text-yellow-300 drop-shadow-[0_0_6px_rgba(234,179,8,0.35)]`;
  if (h.level === "yellow") return `${base} text-amber-300`;
  return base;
}

function highlightIcon(h: HighlightV2, size: number) {
  if (h.icon === "crown")
    return <Crown className="inline-block ml-1" size={size - 2} />;
  if (h.icon === "fire")
    return <Flame className="inline-block ml-1" size={size - 2} />;
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
  icon: React.ReactNode;
  label: string;
  value: string | number;
  padCls: string;
  labelCls: string;
  valueCls: string;
  afterIcon?: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-xl border border-white/10 bg-white/5 ${padCls} text-center min-w-0`}
    >
      <div className="flex items-center justify-center gap-2 mb-1 text-white/85">
        <span className="inline-flex">{icon}</span>
        <span className={`${labelCls} font-semibold tracking-[0.2px]`}>
          {label}
        </span>
      </div>

      {/* ★ ここを修正 */}
      <div className="leading-none truncate flex items-center justify-center">
        <span className={`${valueCls} truncate`}>{value}</span>
        {afterIcon}
      </div>
    </div>
  );
}

