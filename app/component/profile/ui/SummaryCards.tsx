// app/component/profile/ui/SummaryCards.tsx
"use client";

import React from "react";
import {
  BarChartHorizontal,
  Trophy,
  Coins,
  Target,
  Crown,
  Flame,
} from "lucide-react";
import { Alfa_Slab_One } from "next/font/google";

/* しきい値ロジック（Step1で作成済みのヘルパ） */
import {
  type RangeValue,
  evaluateWinRate,
  evaluateAvgOdds,
  evaluateUnits,
  type Highlight,
} from "@/lib/stats/thresholds";

const alfa = Alfa_Slab_One({ weight: "400", subsets: ["latin"] });

/** SummaryCards に渡す実データ */
type SummaryData = {
  /** 表示用の“投稿数”（= 総投稿数を渡す想定。無ければ確定投稿数） */
  posts: number;
  /** 0..1（確定投稿を母数に計算済みが来る想定） */
  winRate: number;
  /** 獲得ユニット（数値。ここで小数点2桁に整形） */
  units: number;
  /** 平均オッズ（数値。ここで小数点2桁に整形） */
  odds: number;
};

type Props = {
  range: RangeValue;
  compact?: boolean;   // モバイル圧縮表示
  data?: SummaryData;  // 実データがあればこちらを優先
  /**
   * しきい値判定に使うサンプル件数（未指定なら data.posts を採用）
   * - 勝率/平均オッズの最小サンプル判定用
   */
  sampleCount?: number;
};

/** 実データ未到達の瞬間のフォールバック（モック） */
function getFallback(range: RangeValue): SummaryData {
  const map: Record<RangeValue, SummaryData> = {
    "7d":  { posts: 12,  winRate: 0.58, units: 4.6,  odds: 1.95 },
    "30d": { posts: 52,  winRate: 0.55, units: 12.3, odds: 2.02 },
    "all": { posts: 128, winRate: 0.57, units: 143.2, odds: 1.98 },
  };
  return map[range];
}

/** ハイライトの段階→クラス名 */
function valueClassByHighlight(h: Highlight) {
  switch (h.level) {
    case "strong":
      // 濃い黄色（HOT感）
      return "text-yellow-300 drop-shadow-[0_0_6px_rgba(234,179,8,0.35)]";
    case "yellow":
      // 通常の黄色
      return "text-amber-300";
    default:
      return ""; // 通常色（親の text-color に従う）
  }
}

export default function SummaryCards({
  range,
  compact = false,
  data,
  sampleCount,
}: Props) {
  // 実データ > フォールバック
  const s = data ?? getFallback(range);

  // しきい値判定に使うサンプル数（未指定なら posts を採用）
  const samples = Number.isFinite(Number(sampleCount))
    ? Number(sampleCount)
    : Number(s.posts ?? 0);

  // 表示用に安全整形
  const postsText  = Number.isFinite(Number(s.posts))   ? String(Number(s.posts))       : "0";
  const winRatePct = Number.isFinite(Number(s.winRate)) ? `${Math.round(Number(s.winRate) * 100)}%` : "0%";
  const unitsText  = Number.isFinite(Number(s.units))   ? Number(s.units).toFixed(2)    : "0.00"; // ★ 2桁固定
  const oddsText   = Number.isFinite(Number(s.odds))    ? Number(s.odds).toFixed(2)     : "0.00";

  // ── しきい値評価 ───────────────────────────────────────────────
  const hWin   = evaluateWinRate(range, s.winRate ?? 0, samples);
  const hOdds  = evaluateAvgOdds(range, Number(s.odds ?? 0), samples);
  const hUnits = evaluateUnits(range, Number(s.units ?? 0), samples);

  // コンパクト時は全デバイスでアイコン/余白を調整
  const padCls   = compact ? "p-2 md:p-3" : "p-4";
  const gapCls   = compact ? "gap-2"      : "gap-3";
  const labelCls = compact ? "text-[12px] md:text-[13px]" : "text-[14px]";
  const valueCls = compact ? "text-[18px] md:text-[24px]" : "text-[20px] md:text-[28px]";
  const iconSize = compact ? 16 : 20;

  return (
    <div className={`grid grid-cols-2 lg:grid-cols-4 ${gapCls} mt-6`}>
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
        valueCls={[
          alfa.className,
          valueCls,
          valueClassByHighlight(hWin),
        ].join(" ")}
        afterIcon={
          hWin.icon === "crown" ? <Crown className="inline-block ml-1" size={iconSize - 2} /> :
          hWin.icon === "fire"  ? <Flame className="inline-block ml-1" size={iconSize - 2} /> :
          null
        }
      />

      <Card
        icon={<Coins size={iconSize} />}
        label="獲得ユニット"
        value={unitsText}
        padCls={padCls}
        labelCls={labelCls}
        valueCls={[
          alfa.className,
          valueCls,
          valueClassByHighlight(hUnits),
        ].join(" ")}
        afterIcon={
          hUnits.icon === "crown" ? <Crown className="inline-block ml-1" size={iconSize - 2} /> :
          hUnits.icon === "fire"  ? <Flame className="inline-block ml-1" size={iconSize - 2} /> :
          null
        }
      />

      <Card
        icon={<Target size={iconSize} />}
        label="平均オッズ"
        value={oddsText}
        padCls={padCls}
        labelCls={labelCls}
        valueCls={[
          alfa.className,
          valueCls,
          valueClassByHighlight(hOdds),
        ].join(" ")}
        afterIcon={
          hOdds.icon === "crown" ? <Crown className="inline-block ml-1" size={iconSize - 2} /> :
          hOdds.icon === "fire"  ? <Flame className="inline-block ml-1" size={iconSize - 2} /> :
          null
        }
      />
    </div>
  );
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
    <div className={`rounded-xl border border-white/10 bg-white/5 ${padCls} text-center min-w-0`}>
      <div className="flex items-center justify-center gap-2 mb-1 text-white/85">
        <span className="inline-flex">{icon}</span>
        <span className={`${labelCls} font-semibold tracking-[0.2px]`}>{label}</span>
      </div>
      <div className={`${valueCls} leading-none truncate flex items-center justify-center`}>
        <span className="truncate">{value}</span>
        {afterIcon}
      </div>
    </div>
  );
}
