"use client";

import { useEffect, useRef, useState } from "react";
import { ShellGridOverlay } from "@/app/component/ui/ShellGridOverlay";
import DonutChart from "@/app/component/predict/DonutChart";
import { resultStatsMetricNumClass } from "@/lib/fonts";

type Props = {
  favorableWinRate: number;
  contrarianWinRate: number;
  favorableShare: number;
  contrarianShare: number;
  /**
   * Pro Stats: 親 SummaryCardReveal の入場後に表示・アニメ開始。
   * false のときはビューポート intersection。
   */
  orchestrateWithParent?: boolean;
  parentRevealDone?: boolean;
};

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

export default function MarketBiasBars({
  favorableWinRate,
  contrarianWinRate,
  favorableShare,
  contrarianShare,
  orchestrateWithParent = false,
  parentRevealDone = false,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [ioVisible, setIoVisible] = useState(false);

  useEffect(() => {
    if (orchestrateWithParent) return;
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIoVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [orchestrateWithParent]);

  const visible = orchestrateWithParent ? parentRevealDone : ioVisible;

  const favWinPct = Math.round(clamp01(favorableWinRate) * 100);
  const conWinPct = Math.round(clamp01(contrarianWinRate) * 100);
  const favorableWinHigher = favWinPct > conWinPct;
  const contrarianWinHigher = conWinPct > favWinPct;

  const fS = clamp01(favorableShare);
  const cS = clamp01(contrarianShare);
  const shareSum = fS + cS;
  const favSeg = shareSum > 0 ? fS / shareSum : 0.5;
  const conSeg = shareSum > 0 ? cS / shareSum : 0.5;
  const favSharePct = Math.round(favSeg * 100);
  const conSharePct = Math.round(conSeg * 100);

  /** 旧バー左=逆張り（シアン系）・右=順当（マゼンタ〜オレンジ系）に寄せる */
  const COLOR_CONTRARIAN = "#22d3ee";
  const COLOR_FAVORABLE = "#e879f9";

  return (
    <div
      ref={ref}
      className="relative overflow-hidden rounded-2xl border border-cyan-300/20 bg-[#050814]/85 p-4 shadow-[0_14px_40px_rgba(0,0,0,0.55),0_0_24px_rgba(56,189,248,0.08)]"
    >
      <ShellGridOverlay roundedClassName="rounded-2xl" />
      <div className="relative z-1">
        <div className="mb-4 text-sm font-semibold text-white md:text-base">
          市場志向
        </div>

        <div className="grid grid-cols-2 gap-3 md:gap-4">
          <div className="rounded-xl border border-white/10 bg-white/4 px-3 py-2.5 md:px-4 md:py-3">
            <div className="text-[11px] font-medium text-cyan-200/90 md:text-xs">
              逆張り勝率
            </div>
            <div
              className={[
                "mt-1 text-2xl tabular-nums leading-none md:text-3xl",
                contrarianWinHigher ? "text-yellow-300" : "text-white",
                resultStatsMetricNumClass,
              ].join(" ")}
            >
              {conWinPct}
              <span
                className={[
                  "ml-0.5 text-base font-semibold md:text-lg",
                  contrarianWinHigher ? "text-yellow-200/85" : "text-white/70",
                ].join(" ")}
              >
                %
              </span>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/4 px-3 py-2.5 md:px-4 md:py-3">
            <div className="text-[11px] font-medium text-fuchsia-200/90 md:text-xs">
              順当勝率
            </div>
            <div
              className={[
                "mt-1 text-2xl tabular-nums leading-none md:text-3xl",
                favorableWinHigher ? "text-yellow-300" : "text-white",
                resultStatsMetricNumClass,
              ].join(" ")}
            >
              {favWinPct}
              <span
                className={[
                  "ml-0.5 text-base font-semibold md:text-lg",
                  favorableWinHigher ? "text-yellow-200/85" : "text-white/70",
                ].join(" ")}
              >
                %
              </span>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-3 text-sm font-semibold text-white md:text-base">
            順当 / 逆張り 比率
          </div>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-center sm:gap-8">
            {visible ? (
              <div className="shrink-0">
                <DonutChart
                  segments={[
                    {
                      label: "逆張り",
                      value: conSeg,
                      color: COLOR_CONTRARIAN,
                    },
                    {
                      label: "順当",
                      value: favSeg,
                      color: COLOR_FAVORABLE,
                    },
                  ]}
                  size={132}
                  thickness={30}
                  rotationDeg={0}
                  drawDelayMs={60}
                  ariaLabel={`逆張り 投稿比率 ${conSharePct}パーセント、順当 ${favSharePct}パーセント`}
                />
              </div>
            ) : (
              <div
                className="shrink-0 rounded-full bg-white/5"
                style={{ width: 132, height: 132 }}
                aria-hidden
              />
            )}
            <ul className="w-full max-w-[240px] space-y-2.5 text-sm sm:w-auto">
              <li className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-white/70">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: COLOR_CONTRARIAN }}
                    aria-hidden
                  />
                  逆張り 投稿比
                </span>
                <span
                  className={`tabular-nums text-white ${resultStatsMetricNumClass}`}
                >
                  {conSharePct}%
                </span>
              </li>
              <li className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-white/70">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: COLOR_FAVORABLE }}
                    aria-hidden
                  />
                  順当 投稿比
                </span>
                <span
                  className={`tabular-nums text-white ${resultStatsMetricNumClass}`}
                >
                  {favSharePct}%
                </span>
              </li>
            </ul>
          </div>
        </div>

        <p className="mt-3 text-[11px] leading-relaxed text-white/50 lg:text-[12px]">
          ※ 勝率は市場多数派寄り／逆張りそれぞれの的中率。比率は投稿の内訳です。
        </p>
      </div>
    </div>
  );
}
