"use client";

import type { MobileMetric } from "@/app/component/rankings/_data/mockRows";
import { jp } from "@/lib/fonts";
import type { Language } from "@/lib/i18n/language";
import { metricLabel, upsetShortLabel } from "@/lib/i18n/rankings";
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

function formatLabel(key: MobileMetric, lang: Language, label: string) {
  if (key === "upsetScore") return upsetShortLabel(lang);
  return lang === "en" ? metricLabel(key, lang) : label;
}

export default function RankingsMetricRow({
  metrics,
  metric,
  setMetric,
  language = "ja",
  compactMobile = false,
}: Props) {
  const reduceMotion = useReducedMotion();
  const currentIndex = metrics.findIndex((m) => m.key === metric);

  const prevIndex = wrapIndex(currentIndex - 1, metrics.length);
  const nextIndex = wrapIndex(currentIndex + 1, metrics.length);

  const prevMetric = metrics[prevIndex];
  const currentMetric = metrics[currentIndex];
  const nextMetric = metrics[nextIndex];

  return (
    <motion.div
      className="flex items-center justify-center px-2"
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
      <div
        className={[
          "relative flex w-full items-center justify-center sm:max-w-[420px]",
          compactMobile
            ? "h-[44px] max-w-[300px] sm:h-[50px]"
            : "h-[52px] max-w-[320px] sm:h-[58px]",
        ].join(" ")}
      >
        {/* 左右は scale を外さないとレイアウト高さと見た目がズレる */}
        {/* LEFT */}
        {metrics.length > 1 && (
          <button
            type="button"
            onClick={() => setMetric(prevMetric.key)}
            className={[
              "absolute left-0 z-0",
              compactMobile
                ? "box-border flex h-[32px] min-w-[68px] max-w-[30%] items-center justify-center leading-none"
                : "box-border flex h-[44px] min-w-[80px] max-w-[34%] items-center justify-center leading-none",
              "rounded-xl border border-white/10 bg-white/[0.035] px-2",
              compactMobile
                ? "text-[9px] text-white/35 sm:h-[40px] sm:min-w-[90px] sm:text-[11px]"
                : "text-[10px] text-white/40 sm:h-[50px] sm:min-w-[100px] sm:text-xs",
              "shadow-[inset_0_1px_0_rgba(255,255,255,0.10)] backdrop-blur-md",
              "opacity-70",
              jp.className,
            ].join(" ")}
            style={{
              transform: "perspective(800px) rotateY(26deg)",
              transformOrigin: "right center",
            }}
          >
            <span className="truncate">
              {formatLabel(prevMetric.key, language, prevMetric.label)}
            </span>
          </button>
        )}

        {/* CENTER */}
        <button
          type="button"
          onClick={() => setMetric(nextMetric.key)}
          className={[
            "relative z-10",
            compactMobile
              ? "box-border flex h-[38px] min-w-[106px] max-w-[54%] items-center justify-center leading-none"
              : "box-border flex h-[44px] min-w-[120px] max-w-[56%] items-center justify-center leading-none",
            "rounded-xl border bg-white/7 px-3",
            compactMobile
              ? "text-[12px] font-black tracking-[0.03em] text-white"
              : "text-sm font-black tracking-[0.04em] text-white",
            "shadow-[0_8px_24px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.14)]",
            compactMobile
              ? "backdrop-blur-md sm:h-[44px] sm:min-w-[132px] sm:text-[14px]"
              : "backdrop-blur-md sm:h-[50px] sm:min-w-[150px] sm:text-base",
            jp.className,
          ].join(" ")}
          style={{
            borderColor: "rgba(57,255,136,0.72)",
            textShadow: "0 0 10px rgba(57,255,136,0.18)",
            boxShadow: [
              "0 8px 24px rgba(0,0,0,0.22)",
              "inset 0 1px 0 rgba(255,255,255,0.14)",
              "0 0 0 1px rgba(57,255,136,0.22)",
              "0 0 10px rgba(57,255,136,0.14)",
            ].join(", "),
          }}
        >
          <span className="truncate">
            {formatLabel(currentMetric?.key, language, currentMetric?.label)}
          </span>
        </button>

        {/* RIGHT */}
        {metrics.length > 1 && (
          <button
            type="button"
            onClick={() => setMetric(nextMetric.key)}
            className={[
              "absolute right-0 z-0",
              compactMobile
                ? "box-border flex h-[32px] min-w-[68px] max-w-[30%] items-center justify-center leading-none"
                : "box-border flex h-[44px] min-w-[80px] max-w-[34%] items-center justify-center leading-none",
              "rounded-xl border border-white/10 bg-white/[0.035] px-2",
              compactMobile
                ? "text-[9px] text-white/35 sm:h-[40px] sm:min-w-[90px] sm:text-[11px]"
                : "text-[10px] text-white/40 sm:h-[50px] sm:min-w-[100px] sm:text-xs",
              "shadow-[inset_0_1px_0_rgba(255,255,255,0.10)] backdrop-blur-md",
              "opacity-70",
              jp.className,
            ].join(" ")}
            style={{
              transform: "perspective(800px) rotateY(-26deg)",
              transformOrigin: "left center",
            }}
          >
            <span className="truncate">
              {formatLabel(nextMetric.key, language, nextMetric.label)}
            </span>
          </button>
        )}
      </div>
    </motion.div>
  );
}