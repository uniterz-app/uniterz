"use client";

import { useEffect, useRef, useState } from "react";
import { ShellGridOverlay } from "@/app/component/ui/ShellGridOverlay";
import DonutChart from "@/app/component/predict/DonutChart";
import { resultStatsMetricNumClass } from "@/lib/fonts";

type Props = {
  homeRate: number;
  awayRate: number;
  homeShare: number;
  awayShare: number;
  /**
   * Pro Stats: 親 SummaryCardReveal の入場後に表示・アニメ開始。
   * false のときはビューポート intersection。
   */
  orchestrateWithParent?: boolean;
  /** orchestrateWithParent 時、ラッパー入場アニメ完了後に true */
  parentRevealDone?: boolean;
};

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

export default function HomeAwayWinRateBar({
  homeRate,
  awayRate,
  homeShare,
  awayShare,
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

  const homePct = Math.round(clamp01(homeRate) * 100);
  const awayPct = Math.round(clamp01(awayRate) * 100);
  const homeWinRateHigher = homePct > awayPct;
  const awayWinRateHigher = awayPct > homePct;

  const hS = clamp01(homeShare);
  const aS = clamp01(awayShare);
  const shareSum = hS + aS;
  const homeSeg = shareSum > 0 ? hS / shareSum : 0.5;
  const awaySeg = shareSum > 0 ? aS / shareSum : 0.5;
  const homeSharePct = Math.round(homeSeg * 100);
  const awaySharePct = Math.round(awaySeg * 100);

  /** 棒グラフ時代の配色に寄せた Home=シアン系、Away=マゼンタ系 */
  const COLOR_HOME = "#22d3ee";
  const COLOR_AWAY = "#e879f9";

  return (
    <div
      ref={ref}
      className="relative overflow-hidden rounded-2xl border border-cyan-300/20 bg-[#050814]/85 p-4 shadow-[0_14px_40px_rgba(0,0,0,0.55),0_0_24px_rgba(34,211,238,0.08)]"
    >
      <ShellGridOverlay roundedClassName="rounded-2xl" />
      <div className="relative z-1">
        <div className="mb-4 text-sm font-semibold text-white md:text-base">
          Home / Away 分析
        </div>

        <div className="grid grid-cols-2 gap-3 md:gap-4">
          <div className="rounded-xl border border-white/10 bg-white/4 px-3 py-2.5 md:px-4 md:py-3">
            <div className="text-[11px] font-medium text-cyan-200/90 md:text-xs">
              Home勝率
            </div>
            <div
              className={[
                "mt-1 text-2xl tabular-nums leading-none md:text-3xl",
                homeWinRateHigher ? "text-yellow-300" : "text-white",
                resultStatsMetricNumClass,
              ].join(" ")}
            >
              {homePct}
              <span
                className={[
                  "ml-0.5 text-base font-semibold md:text-lg",
                  homeWinRateHigher ? "text-yellow-200/85" : "text-white/70",
                ].join(" ")}
              >
                %
              </span>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/4 px-3 py-2.5 md:px-4 md:py-3">
            <div className="text-[11px] font-medium text-fuchsia-200/90 md:text-xs">
              Away勝率
            </div>
            <div
              className={[
                "mt-1 text-2xl tabular-nums leading-none md:text-3xl",
                awayWinRateHigher ? "text-yellow-300" : "text-white",
                resultStatsMetricNumClass,
              ].join(" ")}
            >
              {awayPct}
              <span
                className={[
                  "ml-0.5 text-base font-semibold md:text-lg",
                  awayWinRateHigher ? "text-yellow-200/85" : "text-white/70",
                ].join(" ")}
              >
                %
              </span>
            </div>
          </div>
        </div>

        {/* 投稿比率（ドーナツ） */}
        <div className="mt-5">
          <div className="mb-3 text-sm font-semibold text-white md:text-base">
            Home / Away 比率
          </div>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-center sm:gap-8">
            {visible ? (
              <div className="shrink-0">
                <DonutChart
                  segments={[
                    { label: "Home", value: homeSeg, color: COLOR_HOME },
                    { label: "Away", value: awaySeg, color: COLOR_AWAY },
                  ]}
                  size={132}
                  thickness={30}
                  rotationDeg={0}
                  drawDelayMs={60}
                  ariaLabel={`Home 投稿比率 ${homeSharePct}パーセント、Away ${awaySharePct}パーセント`}
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
                    style={{ backgroundColor: COLOR_HOME }}
                    aria-hidden
                  />
                  Home 投稿比
                </span>
                <span
                  className={`tabular-nums text-white ${resultStatsMetricNumClass}`}
                >
                  {homeSharePct}%
                </span>
              </li>
              <li className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-white/70">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: COLOR_AWAY }}
                    aria-hidden
                  />
                  Away 投稿比
                </span>
                <span
                  className={`tabular-nums text-white ${resultStatsMetricNumClass}`}
                >
                  {awaySharePct}%
                </span>
              </li>
            </ul>
          </div>
        </div>

        <p className="mt-3 text-[11px] leading-relaxed text-white/50 lg:text-[12px]">
          ※ 勝率はホーム／アウェーそれぞれの的中率。比率は投稿の内訳（どちらを多く選んだか）です。
        </p>
      </div>
    </div>
  );
}
