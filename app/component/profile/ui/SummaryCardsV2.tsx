"use client";

import React, { useState } from "react";
import {
  BarChartHorizontal,
  Trophy,
  Gauge,
  Target,
  CheckCircle,
  Flame,
  Crown,
  Zap,
} from "lucide-react";
import { Alfa_Slab_One } from "next/font/google";

// 既存 Tooltip を import
import Tooltip from "@/app/component/common/Tooltip";
import { useCountUp } from "@/lib/hooks/useCountUp";


const alfa = Alfa_Slab_One({ weight: "400", subsets: ["latin"] });

import {
  evaluateWinRateV2,
  evaluatePrecisionV2,
  evaluateAccuracyV2,
  evaluateUpsetV2,
  evaluateConsistencyV2,
  type HighlightV2,
} from "@/lib/stats/thresholdsV2";

export type SummaryDataV2 = {
  posts: number;
  fullPosts: number;
  winRate: number;
  avgPrecision: number;
  avgBrier: number;
  upsetHitRate: number; // ← これに変更
  avgCalibration: number | null;
};

type Props = {
  data: SummaryDataV2;
  compact?: boolean;
  period: "7d" | "30d" | "all";   // ← 追加
};

const MIN_POSTS = {
  "7d": 4,
  "30d": 10,
  "all": 20,
} as const;

export default function SummaryCardsV2({ data, compact = false, period }: Props) {
  /* Tooltip state */
  const [tooltip, setTooltip] = useState<{
    rect: DOMRect | null;
    message: string;
  } | null>(null);

  const postsCount = useCountUp(data.fullPosts, 700, true);
const postsText = postsCount;
  const winRateValue = Math.round(data.winRate * 100);
const winRateCount = useCountUp(winRateValue, 700, true);
const winRatePct = `${winRateCount}%`;
  const precisionValue = Number(data.avgPrecision.toFixed(1));
const precisionCount = useCountUp(precisionValue, 700, true);
const precisionText = precisionCount.toFixed(1);
  const accuracy =
    data.posts === 0
      ? 0
      : Math.max(0, Math.min(100, Math.round((1 - data.avgBrier) * 100)));
  const accuracyCount = useCountUp(accuracy, 700, true);
const accuracyText = `${accuracyCount}%`;


const upsetRateValue = Math.round(data.upsetHitRate * 100);
const upsetRateCount = useCountUp(upsetRateValue, 700, true);
const upsetText = `${upsetRateCount}%`;

  const min = MIN_POSTS[period];
const enoughPosts = data.fullPosts >= min;

// まず一時変数に入れる（これが重要）
// 一致度の安全処理
const calib = data.avgCalibration;

const validCalib =
  typeof calib === "number" && Number.isFinite(calib) && data.posts > 0;

const consistency = validCalib
  ? Math.max(0, Math.min(100, Math.round((1 - calib) * 100)))
  : 0;

// ★ Hooks は必ずトップレベルで呼ぶ
const consistencyCount = useCountUp(consistency, 700, validCalib);

const consistencyText = validCalib
  ? `${consistencyCount}%`
  : "NaN%";


 const NONE: HighlightV2 = { level: "none" };

const hWin       = enoughPosts ? evaluateWinRateV2(data.winRate)      : NONE;
const hPrecision = enoughPosts ? evaluatePrecisionV2(data.avgPrecision) : NONE;
const hAcc       = enoughPosts ? evaluateAccuracyV2(accuracy)          : NONE;
const hUpset = enoughPosts
  ? evaluateUpsetV2(upsetRateValue) // 0〜100 を渡す
  : NONE;
const hCons      = enoughPosts ? evaluateConsistencyV2(consistency)    : NONE;

  const padCls = compact ? "p-2 md:p-3" : "p-4";
  const gapCls = compact ? "gap-2" : "gap-3";
  const labelCls = compact ? "text-[12px] md:text-[13px]" : "text-[14px]";
  const valueCls =
    compact ? "text-[18px] md:text-[24px]" : "text-[20px] md:text-[28px]";
  const iconSize = compact ? 16 : 20;

  const isMobile =
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 768px)").matches;

  /* -------------------------
     Tooltip Helper
  -------------------------- */
  function openTooltip(e: React.MouseEvent, message: string) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setTooltip({ rect, message });
  }

  /* -------------------------
     Mobile layout
  -------------------------- */
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
            label={
              <div className="flex items-center gap-1">
                スコア精度
                <button
                  className="opacity-70 text-xs"
                  onClick={(e) =>
                    openTooltip(
                      e,
                      "予想した得点と実際の得点がどれくらい近かったかの精度。試合展開や実力差を分析できているかを評価します。15が最高値。"
                    )
                  }
                >
                  ⓘ
                </button>
              </div>
            }
            value={precisionText}
            padCls={padCls}
            labelCls={labelCls}
            valueCls={decorate(`${alfa.className} ${valueCls}`, hPrecision)}
            afterIcon={highlightIcon(hPrecision, iconSize)}
          />

          <Card
            icon={<Target size={iconSize} />}
            label={
              <div className="flex items-center gap-1">
                予測精度
                <button
                  className="opacity-70 text-xs"
                  onClick={(e) =>
                    openTooltip(
                      e,
                      "勝敗をどれだけ正確に当てているかを示します。\n外したときの「ズレの大きさ」も評価に含まれるため、単なる勝率よりも厳密な指標です。"
                    )
                  }
                >
                  ⓘ
                </button>
              </div>
            }
            value={accuracyText}
            padCls={padCls}
            labelCls={labelCls}
            valueCls={decorate(`${alfa.className} ${valueCls}`, hAcc)}
            afterIcon={highlightIcon(hAcc, iconSize)}
          />
          <Card
  icon={<CheckCircle size={iconSize} />}
  label={
    <div className="flex items-center gap-1">
      一致度
      <button
        className="opacity-70 text-xs"
        onClick={(e) =>
          openTooltip(
            e,
            "入力した自信度と、実際の結果が長期的にどれくらい一致しているかを示します。\n自信の付け方が正しいかを評価する指標です。"
          )
        }
      >
        ⓘ
      </button>
    </div>
  }
  value={consistencyText}
  padCls={padCls}
  labelCls={labelCls}
  valueCls={decorate(`${alfa.className} ${valueCls}`, hCons)}
  afterIcon={highlightIcon(hCons, iconSize)}
/>

          <Card
            icon={<Zap size={iconSize} />}
            label={
              <div className="flex items-center gap-1">
                UPSET的中率
                <button
                  className="opacity-70 text-xs"
                  onClick={(e) =>
                    openTooltip(
                      e,
                      "アップセット（市場と実力差を覆した試合）が起きた試合のうち、どれだけ勝敗を当てられたかを示します。"
                    )
                  }
                >
                  ⓘ
                </button>
              </div>
            }
            value={upsetText}
            padCls={padCls}
            labelCls={labelCls}
            valueCls={decorate(`${alfa.className} ${valueCls}`, hUpset)}
            afterIcon={highlightIcon(hUpset, iconSize)}
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

  /* -------------------------
    Web Layout
  -------------------------- */

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
          label={
            <div className="flex items-center gap-1">
              スコア精度
              <button
                className="opacity-70 text-xs"
                onClick={(e) =>
                  openTooltip(
                    e,
                    "予想した得点と実際の得点がどれくらい近かったかの精度。試合展開や実力差を分析できているかを評価します。15が最高値。"
                  )
                }
              >
                ⓘ
              </button>
            </div>
          }
          value={precisionText}
          padCls={padCls}
          labelCls={labelCls}
          valueCls={decorate(`${alfa.className} ${valueCls}`, hPrecision)}
          afterIcon={highlightIcon(hPrecision, iconSize)}
        />

        <Card
          label={
            <div className="flex items-center gap-1">
              予測精度
              <button
                className="opacity-70 text-xs"
                onClick={(e) =>
                  openTooltip(
                    e,
                    "勝敗をどれだけ正確に当てているかを示します。外したときの「ズレの大きさ」も評価に含まれるため、単なる勝率よりも厳密な指標です。"
                  )
                }
              >
                ⓘ
              </button>
            </div>
          }
          value={accuracyText}
          padCls={padCls}
          labelCls={labelCls}
          valueCls={decorate(`${alfa.className} ${valueCls}`, hAcc)}
          afterIcon={highlightIcon(hAcc, iconSize)}
        />
<Card
  label={
    <div className="flex items-center gap-1">
      一致度
      <button
        className="opacity-70 text-xs"
        onClick={(e) =>
          openTooltip(
            e,
            "入力した自信度と、実際の結果が長期的にどれくらい一致しているかを示します。\n自信の付け方が正しいかを評価する指標です。"
          )
        }
      >
        ⓘ
      </button>
    </div>
  }
  value={consistencyText}
  padCls={padCls}
  labelCls={labelCls}
  valueCls={decorate(`${alfa.className} ${valueCls}`, hCons)}
  afterIcon={highlightIcon(hCons, iconSize)}
/>
        <Card
          label={
            <div className="flex items-center gap-1">
              UPSET的中率
              <button
                className="opacity-70 text-xs"
                onClick={(e) =>
                  openTooltip(
                    e,
                    "『みんなが予想しなかった勝ち方』を当てたときに高くなる指標。市場の偏りやチーム順位に応じて0〜10で評価されます。"
                  )
                }
              >
                ⓘ
              </button>
            </div>
          }
          value={upsetText}
          padCls={padCls}
          labelCls={labelCls}
          valueCls={decorate(`${alfa.className} ${valueCls}`, hUpset)}
          afterIcon={highlightIcon(hUpset, iconSize)}
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

/* label を ReactNode に変更 */
function Card({
  icon,
  label,
  value,
  padCls,
  labelCls,
  valueCls,
  afterIcon,
}: {
  icon?: React.ReactNode;          // ← optional に変更
  label: React.ReactNode;
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
        {/* icon があるときだけ表示 */}
        {icon && (
          <span className="inline-flex">
            {icon}
          </span>
        )}
        <span className={`${labelCls} font-semibold tracking-[0.2px]`}>
          {label}
        </span>
      </div>

      <div className="leading-none truncate flex items-center justify-center">
        <span className={`${valueCls} truncate`}>{value}</span>
        {afterIcon}
      </div>
    </div>
  );
}
