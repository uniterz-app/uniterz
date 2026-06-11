"use client";

import { useRef, type TouchEvent as ReactTouchEvent } from "react";
import type { MobileMetric } from "@/app/component/rankings/_data/mockRows";
import { jp } from "@/lib/fonts";
import type { Language } from "@/lib/i18n/language";
import { metricLabel, upsetShortLabel } from "@/lib/i18n/rankings";
import { t } from "@/lib/i18n/t";
import { motion, useReducedMotion } from "framer-motion";

const tabFadeEase: [number, number, number, number] = [0.16, 0.82, 0.32, 1];

type Props = {
  metrics: { key: MobileMetric; label: string }[];
  metric: MobileMetric;
  setMetric: (v: MobileMetric) => void;
  language?: Language;
  compactMobile?: boolean;
};

function wrapIndex(index: number, length: number) {
  return (index + length) % length;
}

function formatLabel(key: MobileMetric, lang: Language) {
  if (key === "upsetScore") return upsetShortLabel(lang);
  return metricLabel(key, lang);
}

/** Web 用：選択タブが Z 方向へ出てくるスプリング */
const tabSpring = { type: "spring" as const, stiffness: 420, damping: 30, mass: 0.82 };

/** モバイル：変更しない（従来の 3 スロット UI） */
function RankingsMetricRowMobile({
  metrics,
  metric,
  setMetric,
  language = "ja",
  reduceMotion,
}: Props & { reduceMotion: boolean | null }) {
  const touchStartXRef = useRef<number | null>(null);
  const currentIndex = Math.max(
    0,
    metrics.findIndex((m) => m.key === metric)
  );
  const SWIPE_THRESHOLD_PX = 36;

  const moveMetricBy = (delta: number) => {
    if (metrics.length <= 1) return;
    const targetIndex = wrapIndex(currentIndex + delta, metrics.length);
    setMetric(metrics[targetIndex].key);
  };

  const handleTouchStart = (e: ReactTouchEvent<HTMLDivElement>) => {
    touchStartXRef.current = e.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (e: ReactTouchEvent<HTMLDivElement>) => {
    const startX = touchStartXRef.current;
    touchStartXRef.current = null;
    if (startX == null) return;
    const endX = e.changedTouches[0]?.clientX;
    if (typeof endX !== "number") return;
    const dx = endX - startX;
    if (Math.abs(dx) < SWIPE_THRESHOLD_PX) return;
    if (dx < 0) {
      moveMetricBy(1);
      return;
    }
    moveMetricBy(-1);
  };

  const prevIndex = wrapIndex(currentIndex - 1, metrics.length);
  const nextIndex = wrapIndex(currentIndex + 1, metrics.length);

  const prevMetric = metrics[prevIndex];
  const currentMetric = metrics[currentIndex];
  const nextMetric = metrics[nextIndex];
  const m = t(language);

  return (
    <motion.div
      role="tablist"
      aria-label={m.rankings.metricTabsLabel}
      className="flex items-center justify-center px-2"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : {
              duration: 0.38,
              delay: 0.08,
              ease: tabFadeEase,
            }
      }
    >
      <div className="relative flex h-[44px] w-full max-w-[300px] items-center justify-center sm:h-[50px] sm:max-w-[420px]">
        {metrics.length > 1 && (
          <button
            type="button"
            role="tab"
            aria-selected={false}
            onClick={() => setMetric(prevMetric.key)}
            className={[
              "absolute left-0 z-0 box-border flex h-[32px] min-w-[68px] max-w-[30%] items-center justify-center leading-none rounded-xl border border-[#ffffff80] bg-transparent px-2 text-[9px] font-medium text-[#ffffff80] shadow-none backdrop-blur-md opacity-70 [-webkit-tap-highlight-color:transparent] transition-[color,border-color,box-shadow,text-shadow] duration-500 ease-in-out hover:border-[#008cff] hover:text-white hover:shadow-[0_0_5px_#008cff,0_0_20px_rgba(0,140,255,0.55),0_0_40px_rgba(0,140,255,0.35)] focus-visible:outline-none focus-visible:border-[#008cff] focus-visible:text-white focus-visible:shadow-[0_0_5px_#008cff,0_0_20px_rgba(0,140,255,0.55),0_0_40px_rgba(0,140,255,0.35)] active:border-[#008cff] active:text-white active:shadow-[0_0_5px_#008cff,0_0_20px_rgba(0,140,255,0.55),0_0_40px_rgba(0,140,255,0.35)] sm:h-[40px] sm:min-w-[90px] sm:text-[11px]",
              jp.className,
            ].join(" ")}
            style={{
              transform: "perspective(800px) rotateY(26deg)",
              transformOrigin: "right center",
            }}
          >
            <span className="truncate">
              {formatLabel(prevMetric.key, language)}
            </span>
          </button>
        )}

        <button
          type="button"
          role="tab"
          aria-selected
          onClick={() => setMetric(nextMetric.key)}
          className={[
            "relative z-10 box-border flex h-[38px] min-w-[106px] max-w-[54%] items-center justify-center rounded-xl border border-[rgba(57,255,136,0.72)] bg-white/7 px-3 text-[12px] font-black tracking-[0.03em] text-white shadow-[0_8px_24px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.14),0_0_0_1px_rgba(57,255,136,0.22),0_0_10px_rgba(57,255,136,0.14)] backdrop-blur-md [-webkit-tap-highlight-color:transparent] transition-[border-color,box-shadow,text-shadow] duration-500 ease-in-out hover:shadow-[0_8px_24px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.14),0_0_0_1px_rgba(57,255,136,0.85),0_0_12px_rgba(57,255,136,0.55),0_0_28px_rgba(57,255,136,0.35)] focus-visible:outline-none focus-visible:shadow-[0_8px_24px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.14),0_0_0_1px_rgba(57,255,136,0.85),0_0_12px_rgba(57,255,136,0.55),0_0_28px_rgba(57,255,136,0.35)] active:shadow-[0_8px_24px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.14),0_0_0_1px_rgba(57,255,136,0.85),0_0_12px_rgba(57,255,136,0.55),0_0_28px_rgba(57,255,136,0.35)] sm:h-[44px] sm:min-w-[132px] sm:text-[14px]",
            jp.className,
          ].join(" ")}
          style={{
            textShadow: "0 0 10px rgba(57,255,136,0.18)",
          }}
        >
          <span className="truncate">
            {formatLabel(currentMetric!.key, language)}
          </span>
        </button>

        {metrics.length > 1 && (
          <button
            type="button"
            role="tab"
            aria-selected={false}
            onClick={() => setMetric(nextMetric.key)}
            className={[
              "absolute right-0 z-0 box-border flex h-[32px] min-w-[68px] max-w-[30%] items-center justify-center leading-none rounded-xl border border-[#ffffff80] bg-transparent px-2 text-[9px] font-medium text-[#ffffff80] shadow-none backdrop-blur-md opacity-70 [-webkit-tap-highlight-color:transparent] transition-[color,border-color,box-shadow,text-shadow] duration-500 ease-in-out hover:border-[#008cff] hover:text-white hover:shadow-[0_0_5px_#008cff,0_0_20px_rgba(0,140,255,0.55),0_0_40px_rgba(0,140,255,0.35)] focus-visible:outline-none focus-visible:border-[#008cff] focus-visible:text-white focus-visible:shadow-[0_0_5px_#008cff,0_0_20px_rgba(0,140,255,0.55),0_0_40px_rgba(0,140,255,0.35)] active:border-[#008cff] active:text-white active:shadow-[0_0_5px_#008cff,0_0_20px_rgba(0,140,255,0.55),0_0_40px_rgba(0,140,255,0.35)] sm:h-[40px] sm:min-w-[90px] sm:text-[11px]",
              jp.className,
            ].join(" ")}
            style={{
              transform: "perspective(800px) rotateY(-26deg)",
              transformOrigin: "left center",
            }}
          >
            <span className="truncate">
              {formatLabel(nextMetric.key, language)}
            </span>
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default function RankingsMetricRow({
  metrics,
  metric,
  setMetric,
  language = "ja",
  compactMobile = false,
}: Props) {
  const reduceMotion = useReducedMotion();

  const msgs = t(language);

  if (compactMobile) {
    return (
      <RankingsMetricRowMobile
        metrics={metrics}
        metric={metric}
        setMetric={setMetric}
        language={language}
        compactMobile
        reduceMotion={reduceMotion}
      />
    );
  }

  return (
    <motion.div
      className="w-full px-2"
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : {
              duration: 0.38,
              delay: 0.08,
              ease: tabFadeEase,
            }
      }
    >
      <div className="w-full">
        <div
          role="tablist"
          aria-label={msgs.rankings.metricTabsLabel}
          className="flex w-full flex-wrap justify-center gap-2 py-2.5 [transform-style:preserve-3d] transform-gpu"
          style={
            reduceMotion
              ? undefined
              : {
                  perspective: "960px",
                  perspectiveOrigin: "50% 50%",
                }
          }
        >
          {metrics.map((item) => {
            const active = item.key === metric;
            return (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setMetric(item.key)}
                className={[
                  jp.className,
                  "group relative h-[40px] min-w-[5.5rem] max-w-[min(100%,11rem)] shrink-0 cursor-pointer select-none rounded-xl p-0 outline-none focus-visible:outline-none [-webkit-tap-highlight-color:transparent] sm:h-[44px] sm:min-w-[6.25rem]",
                ].join(" ")}
              >
                <motion.span
                  initial={false}
                  animate={
                    reduceMotion
                      ? {
                          scale: active ? 1 : 0.98,
                          opacity: active ? 1 : 0.88,
                          z: 0,
                          rotateX: 0,
                        }
                      : {
                          z: active ? 52 : -18,
                          scale: active ? 1.08 : 0.92,
                          rotateX: active ? 0 : 9,
                        }
                  }
                  transition={tabSpring}
                  className={[
                    "flex h-full w-full items-center justify-center rounded-xl border px-2.5 text-xs font-black leading-none tracking-[0.03em] will-change-transform pointer-events-none backdrop-blur-md transition-[border-color,box-shadow,color,text-shadow] duration-500 ease-in-out sm:px-3 sm:text-sm",
                    active
                      ? "border-[rgba(57,255,136,0.72)] bg-white/7 text-white shadow-[0_10px_28px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.14),0_0_0_1px_rgba(57,255,136,0.22),0_0_14px_rgba(57,255,136,0.2)] group-hover:shadow-[0_10px_28px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.14),0_0_0_2px_rgba(57,255,136,0.85),0_0_16px_rgba(57,255,136,0.55),0_0_36px_rgba(57,255,136,0.3)] group-focus-visible:shadow-[0_10px_28px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.14),0_0_0_2px_rgba(57,255,136,0.85),0_0_16px_rgba(57,255,136,0.55),0_0_36px_rgba(57,255,136,0.3)] group-active:shadow-[0_10px_28px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.14),0_0_0_2px_rgba(57,255,136,0.85),0_0_16px_rgba(57,255,136,0.55),0_0_36px_rgba(57,255,136,0.3)]"
                      : "border-[#ffffff80] bg-white/[0.035] text-[#ffffff80] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] group-hover:border-[#008cff] group-hover:text-white group-hover:shadow-[0_0_5px_#008cff,0_0_20px_rgba(0,140,255,0.55),0_0_40px_rgba(0,140,255,0.35),inset_0_1px_0_rgba(255,255,255,0.08)] group-focus-visible:border-[#008cff] group-focus-visible:text-white group-focus-visible:shadow-[0_0_5px_#008cff,0_0_20px_rgba(0,140,255,0.55),0_0_40px_rgba(0,140,255,0.35),inset_0_1px_0_rgba(255,255,255,0.08)] group-active:border-[#008cff] group-active:text-white group-active:shadow-[0_0_5px_#008cff,0_0_20px_rgba(0,140,255,0.55),0_0_40px_rgba(0,140,255,0.35),inset_0_1px_0_rgba(255,255,255,0.08)]",
                  ].join(" ")}
                  style={{
                    transformStyle: "preserve-3d",
                    textShadow: active
                      ? "0 0 10px rgba(57,255,136,0.18)"
                      : undefined,
                  }}
                >
                  <span className="line-clamp-2 text-center sm:line-clamp-1">
                    {formatLabel(item.key, language)}
                  </span>
                </motion.span>
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
