"use client";
import React, { useEffect, useRef } from "react";

type Props = {
  dates: Date[];
  selectedDate: Date;
  onSelect: (d: Date) => void;
  className?: string;
  size?: "sm" | "md" | "lg";
  visibleCount?: number;
  autoScrollOnInit?: boolean;
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
}: Props) {
  const listRef = useRef<HTMLDivElement>(null);
  const selRef = useRef<HTMLButtonElement>(null);
  const btnRefs = useRef<HTMLButtonElement[]>([]);
  const didInit = useRef(false);
  const scrollTimer = useRef<number | null>(null);
  const scrollingByCode = useRef(false);

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const today = new Date();

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

    setTimeout(() => {
      scrollingByCode.current = false;
    }, 250);
  };

  useEffect(() => {
    const wrap = listRef.current;
    if (!wrap) return;

    const onScroll = () => {
      if (scrollingByCode.current) return;
      if (scrollTimer.current) clearTimeout(scrollTimer.current);
      scrollTimer.current = window.setTimeout(snapToNearest, 130);
    };

    wrap.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      wrap.removeEventListener("scroll", onScroll);
      if (scrollTimer.current) clearTimeout(scrollTimer.current);
    };
  }, [dates]);

  const sz = sizeMap[size];

  const weekday = (d: Date) =>
    ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];

  return (
    <div
      ref={listRef}
      className={`overflow-x-auto no-scrollbar ${sz.padX} ${className ?? ""} snap-x snap-mandatory`}
    >
      <div className={`flex ${sz.gap} py-2`}>
        {dates.map((d, i) => {
          const selected = isSameDay(d, selectedDate);
          const isTodayDate = isSameDay(d, today);

          const basis =
            visibleCount && visibleCount > 0
              ? ({ flex: `0 0 calc(100% / ${visibleCount})` } as const)
              : undefined;

          return (
            <div
              key={d.toISOString()}
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
                    textShadow: selected ? "0 0 8px rgba(255,255,255,0.18)" : undefined,
                    transform: selected ? "translateY(-1px)" : undefined,
                  }}
                >
                  {weekday(d)}
                </span>

                <div
                  className={[
  "relative grid place-items-center rounded-full border-2",
  "transition-all duration-200 ease-out",
  "backdrop-blur-md",
  sz.circle,
  "text-white",
].join(" ")}
                  style={{
                    transform: selected ? "translateY(-3px) scale(1.08)" : "translateY(0) scale(1)",
                    // ★ 当日は「線の色だけ」変更（外側リングなし）
                    borderColor: selected
                      ? "rgba(132, 204, 22, 0.75)"
                      : isTodayDate
                      ? "rgba(132, 204, 22, 0.70)"
                      : "rgba(255,255,255,0.18)",
                    background: selected
                      ? "linear-gradient(180deg, rgba(132,204,22,0.95) 0%, rgba(101,163,13,0.92) 100%)"
                      : "linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 100%)",
                    boxShadow: selected
                      ? isTodayDate
                        ? "0 14px 28px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.25), 0 0 0 1px rgba(132,204,22,0.35), 0 0 20px rgba(132,204,22,0.65)"
                        : "0 14px 28px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.20), 0 0 0 1px rgba(132,204,22,0.28), 0 0 14px rgba(132,204,22,0.35)"
                      : isTodayDate
                      ? "inset 0 1px 0 rgba(255,255,255,0.10), 0 0 10px rgba(132,204,22,0.18)"
                      : "inset 0 1px 0 rgba(255,255,255,0.08)",
                  }}
                >
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 rounded-full"
                    style={{
                      background: selected
                        ? "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.00) 55%)"
                        : "linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.00) 60%)",
                    }}
                  />

                  <span
                    className={`relative z-10 font-bold ${sz.num}`}
                    style={{
                      color: selected ? "#04110a" : "#ffffff",
                      textShadow: selected
                        ? "0 1px 0 rgba(255,255,255,0.15)"
                        : "0 0 8px rgba(255,255,255,0.08)",
                    }}
                  >
                    {d.getDate()}
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