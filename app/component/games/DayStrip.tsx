"use client";
import React, { useEffect, useRef } from "react";
import { toDateKeyInTimeZone } from "@/lib/time/zonedTime";

type Props = {
  dates: Date[];
  selectedDate: Date;
  onSelect: (d: Date) => void;
  className?: string;
  size?: "sm" | "md" | "lg";
  visibleCount?: number;
  autoScrollOnInit?: boolean;
  timeZone: string;
  isEn?: boolean;
};

const sizeMap = {
  sm: { circle: "w-8 h-8", num: "text-xs", gap: "gap-2", padX: "px-1" },
  md: { circle: "w-12 h-12", num: "text-sm", gap: "gap-2", padX: "px-2" },
  lg: { circle: "w-14 h-14", num: "text-base", gap: "gap-3", padX: "px-3" },
} as const;

export default function DayStrip({
  dates,
  selectedDate,
  onSelect,
  className,
  size = "lg",
  visibleCount,
  autoScrollOnInit = false,
  timeZone,
  isEn = false,
}: Props) {
  const listRef = useRef<HTMLDivElement>(null);
  const selRef = useRef<HTMLButtonElement>(null);
  const btnRefs = useRef<HTMLButtonElement[]>([]);
  const didInit = useRef(false);
  const scrollTimer = useRef<number | null>(null);
  const scrollingByCode = useRef(false);

  const selectedKey = toDateKeyInTimeZone(selectedDate, timeZone);
  const todayKey = toDateKeyInTimeZone(new Date(), timeZone);

  useEffect(() => {
    if (!listRef.current || !selRef.current) return;

    const wrap = listRef.current;
    const el = selRef.current;
    const left = el.offsetLeft - wrap.clientWidth / 2 + el.clientWidth / 2;

    wrap.scrollTo({
      left,
      behavior: !didInit.current && !autoScrollOnInit ? "auto" : "smooth",
    });

    didInit.current = true;
  }, [dates, selectedDate, autoScrollOnInit]);

  const snapToNearest = () => {
    const wrap = listRef.current;
    if (!wrap) return;

    const center = wrap.scrollLeft + wrap.clientWidth / 2;

    let bestIdx = 0;
    let bestDist = Infinity;

    btnRefs.current.forEach((el, i) => {
      if (!el) return;
      const cx = el.offsetLeft + el.clientWidth / 2;
      const dist = Math.abs(cx - center);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    });

    const nearestDate = dates[bestIdx];
    if (!nearestDate) return;

    scrollingByCode.current = true;
    onSelect(nearestDate);

    const target = btnRefs.current[bestIdx];
    if (target) {
      wrap.scrollTo({
        left: target.offsetLeft - (wrap.clientWidth - target.clientWidth) / 2,
        behavior: "smooth",
      });
    }

    window.setTimeout(() => {
      scrollingByCode.current = false;
    }, 250);
  };

  useEffect(() => {
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
  }, [dates]);

  const sz = sizeMap[size];

  const weekday = (d: Date) =>
    new Intl.DateTimeFormat(isEn ? "en-US" : "ja-JP", {
      timeZone,
      weekday: "short",
    }).format(d);

  return (
    <div
      ref={listRef}
      className={`overflow-x-auto no-scrollbar ${sz.padX} ${className ?? ""} snap-x snap-mandatory`}
    >
      <div className={`flex ${sz.gap} py-2`}>
        {dates.map((d, i) => {
          const dayKey = toDateKeyInTimeZone(d, timeZone);
          const selected = dayKey === selectedKey;
          const isTodayDate = dayKey === todayKey;

          const basis =
            visibleCount && visibleCount > 0
              ? ({ flex: `0 0 calc(100% / ${visibleCount})` } as const)
              : undefined;

          return (
            <div
              key={toDateKeyInTimeZone(d, timeZone)}
              className="shrink-0 flex justify-center snap-center"
              style={basis}
            >
              <button
                ref={(el) => {
                  if (el) btnRefs.current[i] = el;
                  if (selected) selRef.current = el;
                }}
                onClick={() => onSelect(d)}
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
                      ? "0 0 4px rgba(255,255,255,0.10)"
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
                      ? "rgba(132,204,22,0.54)"
                      : isTodayDate
                        ? "rgba(132,204,22,0.42)"
                        : "rgba(255,255,255,0.16)",
                    background: selected
                      ? "linear-gradient(180deg, rgba(132,204,22,0.86) 0%, rgba(101,163,13,0.82) 100%)"
                      : "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)",
                    boxShadow: selected
                      ? "inset 0 1px 0 rgba(255,255,255,0.12), 0 0 0 1px rgba(132,204,22,0.12), 0 0 4px rgba(132,204,22,0.08)"
                      : isTodayDate
                        ? "inset 0 1px 0 rgba(255,255,255,0.08), 0 0 3px rgba(132,204,22,0.05)"
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
                    className={`relative z-10 font-bold ${sz.num}`}
                    style={{
                      color: selected ? "#071006" : "#ffffff",
                      textShadow: selected
                        ? "0 1px 0 rgba(255,255,255,0.08)"
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
            </div>
          );
        })}
      </div>
    </div>
  );
}