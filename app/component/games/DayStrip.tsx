"use client";
import React, { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import cn from "clsx";
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
  /** スクリーンリーダー用ラベルのロケール（曜日は表示しないが aria に含める） */
  a11yLocale?: string;
  /** true のとき日付セル間を一段広げる（モバイル向け） */
  wideItemGap?: boolean;
  /** true のときウェブ版のみ日付セル間を詰める（モバイルは wideItemGap のまま） */
  compactWebGap?: boolean;
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
  a11yLocale = "ja-JP",
  wideItemGap = false,
  compactWebGap = false,
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

  const sz = sizeMap[size];
  /** flex gap と visibleCount 用の basis 計算を一致させる */
  const gapClass = wideItemGap
    ? size === "lg"
      ? "gap-4"
      : size === "md"
        ? "gap-3"
        : "gap-3"
    : compactWebGap
      ? size === "lg"
        ? "gap-2"
        : size === "md"
          ? "gap-1.5"
          : "gap-1"
      : sz.gap;
  const gapPx = wideItemGap
    ? size === "lg"
      ? 16
      : 12
    : compactWebGap
      ? size === "lg"
        ? 8
        : size === "md"
          ? 6
          : 4
      : size === "lg"
        ? 12
        : 8;

  /** 試合日が visibleCount 未満だと「100%/n」幅のセルが並ばず右に大きな空きが出るため、均等配置に切り替える */
  const distributeFewDays = useMemo(
    () =>
      Boolean(
        visibleCount &&
          visibleCount > 0 &&
          dates.length > 0 &&
          dates.length < visibleCount,
      ),
    [visibleCount, dates.length],
  );

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
        className={cn(
          `flex ${gapClass} pt-1 pb-2`,
          distributeFewDays && "min-w-full justify-evenly",
        )}
        variants={dayStripContainer}
        initial={reduceMotion ? false : "hidden"}
        animate="show"
      >
        {dates.map((d, i) => {
          const dayKey = toDateKeyInTimeZone(d, timeZone);
          const selected = dayKey === selectedKey;
          const isTodayDate = dayKey === todayKey;

          const basis =
            visibleCount &&
            visibleCount > 0 &&
            !distributeFewDays
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
              <motion.button
                ref={(el) => {
                  if (el) btnRefs.current[i] = el;
                  if (selected) selRef.current = el;
                }}
                onClick={() => {
                  // クリック/タップ確定後、selected 追従の中央寄せで表示を更新する
                  scrollingByCode.current = true;
                  if (scrollTimer.current) window.clearTimeout(scrollTimer.current);
                  onSelect(d);
                  window.setTimeout(() => {
                    scrollingByCode.current = false;
                  }, 180);
                }}
                className="flex touch-manipulation flex-col items-center justify-center"
                type="button"
                aria-label={new Intl.DateTimeFormat(a11yLocale, {
                  timeZone,
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }).format(d)}
              >
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
                        ? "rgba(250,204,21,0.75)"
                        : "rgba(255,255,255,0.16)",
                    background: selected
                      ? "linear-gradient(180deg, rgba(34,211,238,0.42) 0%, rgba(8,145,178,0.36) 100%)"
                      : "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)",
                    boxShadow: selected
                      ? "inset 0 1px 0 rgba(255,255,255,0.12), 0 0 0 1px rgba(34,211,238,0.14), 0 0 7px rgba(34,211,238,0.14)"
                      : isTodayDate
                        ? "inset 0 1px 0 rgba(255,255,255,0.08), 0 0 0 1px rgba(250,204,21,0.2), 0 0 10px rgba(250,204,21,0.22)"
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
                        ? "0 0 5px rgba(34,211,238,0.22), 0 1px 0 rgba(0,0,0,0.32)"
                        : "0 1px 0 rgba(0,0,0,0.22)",
                    }}
                  >
                    {new Intl.DateTimeFormat("en-US", {
                      timeZone,
                      day: "numeric",
                    }).format(d)}
                  </span>
                </div>
              </motion.button>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
