"use client";
import React, { useEffect, useLayoutEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { resultStatsMetricNumClass } from "@/lib/fonts";
import { toDateKeyInTimeZone } from "@/lib/time/zonedTime";
import { GAMES_CYBER_EASE } from "./cyberMotion";

type Props = {
  dates: Date[];
  selectedDate: Date;
  onSelect: (d: Date) => void;
  className?: string;
  size?: "sm" | "md" | "lg";
  visibleCount?: number;
  autoScrollOnInit?: boolean;
  snapSelectOnScroll?: boolean;
  timeZone: string;
  isEn?: boolean;
  /** true のとき日付セル間を一段広げる（モバイル向け） */
  wideItemGap?: boolean;
};

const sizeMap = {
  sm: { circle: "w-8 h-8", num: "text-xs", gap: "gap-2", padX: "px-1" },
  md: { circle: "w-12 h-12", num: "text-sm", gap: "gap-2", padX: "px-2" },
  lg: { circle: "w-14 h-14", num: "text-base", gap: "gap-3", padX: "px-3" },
} as const;

const DAY_STRIP_EASE = GAMES_CYBER_EASE;

export default function DayStrip({
  dates,
  selectedDate,
  onSelect,
  className,
  size = "lg",
  visibleCount,
  autoScrollOnInit = false,
  snapSelectOnScroll = true,
  timeZone,
  isEn = false,
  wideItemGap = false,
}: Props) {
  const reduceMotion = useReducedMotion();
  const listRef = useRef<HTMLDivElement>(null);
  const selRef = useRef<HTMLButtonElement>(null);
  const btnRefs = useRef<HTMLButtonElement[]>([]);
  const didInit = useRef(false);
  /** 初回だけ「今日」があればその丸が見える位置へ（以降は選択日へ追従） */
  const firstAlignRef = useRef(true);
  const scrollTimer = useRef<number | null>(null);
  const scrollingByCode = useRef(false);
  /** ストリップ上の日をタップした直後は、smooth スクロールや snap と二重にならないよう整列・スナップ選択を抑止 */
  const skipProgrammaticAlignUntil = useRef(0);
  /** scrollIntoView 直後〜motion の子が落ち着くまで scroll 由来の snap 選択を無効化（初回オープン時の誤日付へ寄るのを防ぐ） */
  const suppressSnapPickUntil = useRef(0);

  const selectedKey = toDateKeyInTimeZone(selectedDate, timeZone);
  const todayKey = toDateKeyInTimeZone(new Date(), timeZone);

  useLayoutEffect(() => {
    if (!listRef.current || dates.length === 0) return;

    const keys = dates.map((d) => toDateKeyInTimeZone(d, timeZone));

    let scrollKey: string;
    if (firstAlignRef.current && keys.includes(todayKey)) {
      scrollKey = todayKey;
      firstAlignRef.current = false;
    } else {
      scrollKey = selectedKey;
      if (firstAlignRef.current) firstAlignRef.current = false;
    }

    const idx = keys.indexOf(scrollKey);
    const el = idx >= 0 ? btnRefs.current[idx] : null;
    if (!el) return;

    // タップで選んだ日は既に画面内にあるので中央寄せしない（端の日で snap / smooth が残りスクロールと競合するのを防ぐ）
    if (Date.now() < skipProgrammaticAlignUntil.current) {
      didInit.current = true;
      return;
    }

    scrollingByCode.current = true;
    if (scrollTimer.current) window.clearTimeout(scrollTimer.current);

    // motion の transform 付き祖先があると button.offsetLeft が横並び全体に対して信頼できないため、
    // スクロールコンテナ内でセルを中央に寄せるには scrollIntoView が確実
    // モバイル snap ありでは smooth が終わる前に scrollingByCode が切れて snapToNearest が割り込むため常に auto
    const behavior: ScrollBehavior =
      snapSelectOnScroll || (!didInit.current && !autoScrollOnInit)
        ? "auto"
        : "smooth";
    el.scrollIntoView({
      inline: "center",
      block: "nearest",
      behavior,
    });
    // 初回表示でも motion の stagger 中は矩形がずれて snapToNearest が別日を選ぶことがあるため、しばらくスナップ選択を止める
    suppressSnapPickUntil.current =
      Date.now() + (snapSelectOnScroll ? 820 : 380);
    const settleMs = behavior === "smooth" ? 720 : 120;
    window.setTimeout(() => {
      scrollingByCode.current = false;
    }, settleMs);

    didInit.current = true;
  }, [
    dates,
    selectedDate,
    selectedKey,
    todayKey,
    timeZone,
    autoScrollOnInit,
    snapSelectOnScroll,
  ]);

  const snapToNearest = () => {
    const wrap = listRef.current;
    if (!wrap) return;

    if (Date.now() < suppressSnapPickUntil.current) return;
    if (Date.now() < skipProgrammaticAlignUntil.current) return;

    // offsetLeft は transform 付き祖先では列全体に対する座標にならないため、ビューポート基準で中央に近い日を選ぶ
    const wrapRect = wrap.getBoundingClientRect();
    const stripCenterX = wrapRect.left + wrapRect.width / 2;

    let bestIdx = 0;
    let bestDist = Infinity;

    btnRefs.current.forEach((el, i) => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const dist = Math.abs(cx - stripCenterX);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    });

    const nearestDate = dates[bestIdx];
    if (!nearestDate) return;

    const nearestKey = toDateKeyInTimeZone(nearestDate, timeZone);
    // 既に選択と一致していれば二重の onSelect / 中央寄せスクロールを避ける（端の日タップ後の「戻り」を防ぐ）
    if (nearestKey === selectedKey) return;

    scrollingByCode.current = true;
    onSelect(nearestDate);

    const target = btnRefs.current[bestIdx];
    if (target) {
      target.scrollIntoView({
        inline: "center",
        block: "nearest",
        behavior: snapSelectOnScroll ? "auto" : "smooth",
      });
      suppressSnapPickUntil.current =
        Date.now() + (snapSelectOnScroll ? 450 : 280);
    }

    window.setTimeout(() => {
      scrollingByCode.current = false;
    }, snapSelectOnScroll ? 120 : 280);
  };

  useEffect(() => {
    if (!snapSelectOnScroll) return;
    const wrap = listRef.current;
    if (!wrap) return;

    const onScroll = () => {
      if (scrollingByCode.current) return;
      if (scrollTimer.current) window.clearTimeout(scrollTimer.current);
      scrollTimer.current = window.setTimeout(snapToNearest, 130);
    };

    wrap.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      wrap.removeEventListener("scroll", onScroll);
      if (scrollTimer.current) window.clearTimeout(scrollTimer.current);
    };
  }, [dates, snapSelectOnScroll, selectedKey, timeZone]);

  const markStripPointerPick = () => {
    skipProgrammaticAlignUntil.current = Date.now() + 520;
  };

  const sz = sizeMap[size];
  /** flex gap と visibleCount 用の basis 計算を一致させる */
  const gapClass = wideItemGap
    ? size === "lg"
      ? "gap-4"
      : size === "md"
        ? "gap-3"
        : "gap-3"
    : sz.gap;
  const gapPx = wideItemGap
    ? size === "lg"
      ? 16
      : 12
    : size === "lg"
      ? 12
      : 8;

  const weekday = (d: Date) =>
    new Intl.DateTimeFormat(isEn ? "en-US" : "ja-JP", {
      timeZone,
      weekday: "short",
    }).format(d);

  const dayStripContainer = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: reduceMotion ? 0 : 0.028,
        delayChildren: reduceMotion ? 0 : 0.04,
      },
    },
  };

  const dayStripItem = {
    hidden: reduceMotion
      ? { opacity: 1, y: 0, scale: 1 }
      : { opacity: 0, y: 12, scale: 0.93 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: reduceMotion ? 0 : 0.28,
        ease: DAY_STRIP_EASE,
      },
    },
  };

  return (
    <div
      ref={listRef}
      className={`overflow-x-auto no-scrollbar ${sz.padX} ${className ?? ""} ${snapSelectOnScroll ? "snap-x snap-proximity" : ""}`}
    >
      <motion.div
        className={`flex ${gapClass} py-2`}
        variants={dayStripContainer}
        initial={reduceMotion ? false : "hidden"}
        animate="show"
      >
        {dates.map((d, i) => {
          const dayKey = toDateKeyInTimeZone(d, timeZone);
          const selected = dayKey === selectedKey;
          const isTodayDate = dayKey === todayKey;

          const basis =
            visibleCount && visibleCount > 0
              ? ({
                  flex: `0 0 calc((100% - ${(visibleCount - 1) * gapPx}px) / ${visibleCount})`,
                } as const)
              : undefined;

          return (
            <motion.div
              key={toDateKeyInTimeZone(d, timeZone)}
              className={[
                "shrink-0 flex justify-center",
                snapSelectOnScroll ? "snap-center" : "",
              ].join(" ")}
              style={basis}
              variants={dayStripItem}
            >
              <button
                ref={(el) => {
                  if (el) btnRefs.current[i] = el;
                  if (selected) selRef.current = el;
                }}
                onPointerDown={() => {
                  markStripPointerPick();
                }}
                onClick={() => {
                  // Click selection should win over scroll-snap callbacks.
                  scrollingByCode.current = true;
                  if (scrollTimer.current) window.clearTimeout(scrollTimer.current);
                  onSelect(d);
                  window.setTimeout(() => {
                    scrollingByCode.current = false;
                  }, 320);
                }}
                className="flex flex-col items-center"
                type="button"
              >
                <span
                  className={[
                    "mb-1 text-[11px] transition-all duration-200",
                    selected ? "text-white/95" : "text-white/70",
                  ].join(" ")}
                  style={{
                    textShadow: selected
                      ? "0 0 10px rgba(34,211,238,0.45), 0 0 2px rgba(255,255,255,0.2)"
                      : undefined,
                    transform: selected ? "translateY(-1px)" : undefined,
                  }}
                >
                  {weekday(d)}
                </span>

                <div
                  className={[
                    "relative grid place-items-center rounded-full border-2",
                    "transition-all duration-200 ease-out",
                    sz.circle,
                    "text-white",
                  ].join(" ")}
                  style={{
                    transform: selected
                      ? "translateY(-1px) scale(1.02)"
                      : "translateY(0) scale(1)",
                    borderColor: selected
                      ? "rgba(34,211,238,0.62)"
                      : isTodayDate
                        ? "rgba(34,211,238,0.38)"
                        : "rgba(255,255,255,0.16)",
                    background: selected
                      ? "linear-gradient(180deg, rgba(34,211,238,0.42) 0%, rgba(8,145,178,0.36) 100%)"
                      : "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)",
                    boxShadow: selected
                      ? "inset 0 1px 0 rgba(255,255,255,0.14), 0 0 0 1px rgba(34,211,238,0.2), 0 0 14px rgba(34,211,238,0.28)"
                      : isTodayDate
                        ? "inset 0 1px 0 rgba(255,255,255,0.08), 0 0 8px rgba(34,211,238,0.12)"
                        : "inset 0 1px 0 rgba(255,255,255,0.06)",
                    isolation: "isolate",
                  }}
                >
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 rounded-full"
                    style={{
                      background: selected
                        ? "linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.00) 55%)"
                        : "linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.00) 60%)",
                    }}
                  />

                  <span
                    className={`relative z-10 ${resultStatsMetricNumClass} ${sz.num}`}
                    style={{
                      color: selected ? "#ecfeff" : "#ffffff",
                      textShadow: selected
                        ? "0 0 10px rgba(34,211,238,0.55), 0 1px 0 rgba(0,0,0,0.35)"
                        : "0 0 3px rgba(255,255,255,0.04)",
                    }}
                  >
                    {new Intl.DateTimeFormat("en-US", {
                      timeZone,
                      day: "numeric",
                    }).format(d)}
                  </span>
                </div>
              </button>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
