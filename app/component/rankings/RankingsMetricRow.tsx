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
      <div className="relative flex h-[48px] w-full max-w-[320px] items-center justify-center sm:h-[56px] sm:max-w-[420px]">
        {/* LEFT */}
        {metrics.length > 1 && (
          <button
            type="button"
            onClick={() => setMetric(prevMetric.key)}
            className={[
              "absolute left-0 z-0",
              "flex h-[34px] min-w-[80px] max-w-[34%] items-center justify-center",
              "rounded-xl border border-white/10 bg-white/[0.035] px-2",
              "text-[10px] text-white/40 sm:h-[40px] sm:min-w-[100px] sm:text-xs",
              "shadow-[inset_0_1px_0_rgba(255,255,255,0.10)] backdrop-blur-md",
              "scale-[0.88] opacity-70",
              jp.className,
            ].join(" ")}
            style={{
              transform: "perspective(800px) rotateY(28deg) scale(0.88)",
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
            "flex h-[40px] min-w-[120px] max-w-[56%] items-center justify-center",
            "rounded-xl border bg-white/7 px-3",
            "text-sm font-black tracking-[0.04em] text-white",
            "shadow-[0_8px_24px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.14)]",
            "backdrop-blur-md sm:h-[46px] sm:min-w-[150px] sm:text-base",
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
              "flex h-[34px] min-w-[80px] max-w-[34%] items-center justify-center",
              "rounded-xl border border-white/10 bg-white/[0.035] px-2",
              "text-[10px] text-white/40 sm:h-[40px] sm:min-w-[100px] sm:text-xs",
              "shadow-[inset_0_1px_0_rgba(255,255,255,0.10)] backdrop-blur-md",
              "scale-[0.88] opacity-70",
              jp.className,
            ].join(" ")}
            style={{
              transform: "perspective(800px) rotateY(-28deg) scale(0.88)",
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