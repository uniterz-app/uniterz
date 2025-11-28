"use client";
import React, {
  useEffect,
  useRef,
} from "react";

type Props = {
  dates: Date[];                // ★ 試合日だけ
  selectedDate: Date;
  onSelect: (d: Date) => void;
  className?: string;
  size?: "sm" | "md" | "lg";
  visibleCount?: number;        // 同時表示数
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

  // ---- 選択変更時に中央へスナップ ----
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

  // ---- スクロールが止まったとき自動スナップ ----
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
    return () => wrap.removeEventListener("scroll", onScroll);
  }, [dates]);

  const sz = sizeMap[size];

  // ---- 曜日を3文字に変更 ("Sun", "Mon", …) ----
  const weekday = (d: Date) =>
    ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];

  return (
    <div
      ref={listRef}
      className={`overflow-x-auto no-scrollbar ${sz.padX} ${
        className ?? ""
      } snap-x snap-mandatory`}
    >
      <div className={`flex ${sz.gap} py-2`}>
        {dates.map((d, i) => {
          const selected = isSameDay(d, selectedDate);
          const isToday = isSameDay(d, today);

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
              >
                {/* ---- 曜日（3文字） ---- */}
                <span className="text-[11px] opacity-70 mb-1">
                  {weekday(d)}
                </span>

                {/* ---- 日付 UI ---- */}
                <div
                  className={[
                    "grid place-items-center rounded-full border transition-colors",
                    sz.circle,
                    selected
                      ? "bg-lime-600 border-lime-600 text-black"
                      : "border-white/20 bg-white/5 text-white",
                    isToday && !selected ? "ring-2 ring-lime-600" : "",
                  ].join(" ")}
                >
                  <span className={`font-bold ${sz.num}`}>
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

