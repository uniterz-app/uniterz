"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

/** ===== JST 日付ユーティリティ（ズレないやつ） ===== */
const MS = 24 * 60 * 60 * 1000;
const JST_OFFSET = 9 * 60 * 60 * 1000; // +09:00

/** UTCミリ秒 → JSTの通日番号(1970/1/1基準) */
function epochMsToJstDayNumber(ms: number): number {
  return Math.floor((ms + JST_OFFSET) / MS);
}

/** JSTの通日番号 → Date（その日のJST 00:00相当） */
function jstDayNumberToDate(dayNum: number): Date {
  return new Date(dayNum * MS - JST_OFFSET);
}

/** 任意DateをJST通日番号に */
function dateToJstDayNumber(d: Date): number {
  return epochMsToJstDayNumber(d.getTime());
}

/** 表示用（英語曜日・月） */
function formatDayLabel(dayNum: number) {
  const d = jstDayNumberToDate(dayNum);
  const w = d.toLocaleDateString("en-US", {
    weekday: "short",
    timeZone: "Asia/Tokyo",
  });
  const m = d.toLocaleDateString("en-US", {
    month: "short",
    timeZone: "Asia/Tokyo",
  });
  const dd = d.getDate();
  return { w, m, dd };
}

function formatMonthTitle(dayNum: number) {
  const d = jstDayNumberToDate(dayNum);
  const year = d.toLocaleDateString("ja-JP", {
    year: "numeric",
    timeZone: "Asia/Tokyo",
  });
  const month = d.toLocaleDateString("ja-JP", {
    month: "long",
    timeZone: "Asia/Tokyo",
  });
  return `${year} ${month}`;
}

type Props = {
  value: Date;
  onChange: (d: Date) => void;
  itemWidth?: number;
  height?: number;
  visibleCountHint?: number;
};

const BIG_COUNT = 365 * 4000;
const CENTER_INDEX = Math.floor(BIG_COUNT / 2);

export default function InfiniteDayStrip({
  value,
  onChange,
  itemWidth = 64,
  height = 84,
  visibleCountHint = 10,
}: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [now] = useState(() => Date.now());
  const todayDay = useMemo(() => dateToJstDayNumber(new Date(now)), [now]);
  const selectedDay = useMemo(() => dateToJstDayNumber(value), [value]);
  const monthTitle = useMemo(() => formatMonthTitle(selectedDay), [selectedDay]);

  const dayAtCenter = todayDay;
  const indexToDay = (index: number) => dayAtCenter + (index - CENTER_INDEX);
  const dayToIndex = (day: number) => CENTER_INDEX + (day - dayAtCenter);

  const parentRef = useRef<HTMLDivElement | null>(null);

  const virtualizer = useVirtualizer({
    count: BIG_COUNT,
    horizontal: true,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemWidth,
    getItemKey: (index) => index,
    overscan: visibleCountHint * 2,
  });

  useEffect(() => {
    if (!mounted) return;
    const idx = dayToIndex(selectedDay);
    virtualizer.scrollToIndex(idx, { align: "center", behavior: "smooth" });
  }, [mounted, selectedDay, virtualizer]);

  const goToday = () => {
    const todayDate = jstDayNumberToDate(todayDay);
    onChange(todayDate);
    if (!mounted) return;
    virtualizer.scrollToIndex(dayToIndex(todayDay), {
      align: "center",
      behavior: "smooth",
    });
  };

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={goToday}
        className="mb-3 block w-full text-center font-extrabold tracking-wide text-white"
        style={{
          fontSize: 22,
          lineHeight: 1.1,
          background: "transparent",
          border: "none",
          outline: "none",
        }}
        aria-label="今日に戻る"
        title="今日に戻る"
      >
        {monthTitle}
      </button>

      <div
        ref={parentRef}
        className="relative w-full overflow-x-auto select-none"
        style={{ height, opacity: mounted ? 1 : 0 }}
        aria-label="day-strip"
      >
        <div
          className="relative"
          style={{ width: virtualizer.getTotalSize(), height: "100%" }}
        >
          {virtualizer.getVirtualItems().map((vi) => {
            const dayNum = indexToDay(vi.index);
            const { w, m, dd } = formatDayLabel(dayNum);
            const isToday = dayNum === todayDay;
            const isSelected = dayNum === selectedDay;

            return (
              <div
                key={vi.key}
                className="absolute top-0 flex items-center justify-center"
                style={{
                  width: vi.size,
                  height,
                  transform: `translate3d(${vi.start}px,0,0)`,
                }}
              >
                <button
                  type="button"
                  onClick={() => onChange(jstDayNumberToDate(dayNum))}
                  className="relative flex flex-col items-center justify-center px-2 text-white"
                  style={{
                    width: itemWidth - 8,
                    height: height - 10,
                    borderRadius: 999,
                    background: "transparent",
                    border: "none",
                    outline: "none",
                  }}
                  aria-current={isSelected ? "date" : undefined}
                >
                  {isSelected && (
                    <>
                      <span
                        style={{
                          position: "absolute",
                          left: "50%",
                          top: "50%",
                          width: 54,
                          height: 54,
                          transform: "translate(-50%, -50%)",
                          borderRadius: "999px",
                          background: "#84cc16",
opacity: 0.78,
                          zIndex: 0,
                          pointerEvents: "none",
                        }}
                      />
                      <span
                        style={{
                          position: "absolute",
                          left: "50%",
                          top: "50%",
                          width: 64,
                          height: 64,
                          transform: "translate(-50%, -50%)",
                          borderRadius: "999px",
                         boxShadow:
  "0 0 6px rgba(132,204,22,0.16), 0 0 12px rgba(132,204,22,0.08)",
                          zIndex: 0,
                          pointerEvents: "none",
                        }}
                      />
                    </>
                  )}

                  {!isSelected && isToday && (
                    <span
                      style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        width: 52,
                        height: 52,
                        transform: "translate(-50%, -50%)",
                        borderRadius: "999px",
                        border: "2px solid rgba(132,204,22,0.9)",
                        boxShadow: "0 0 12px rgba(132,204,22,0.18)",
                        zIndex: 0,
                        pointerEvents: "none",
                      }}
                    />
                  )}

                  <div className="relative z-10 text-[10px] leading-none opacity-80">
                    {m}
                  </div>
                  <div className="relative z-10 -mt-0.5 text-[11px] leading-none opacity-80">
                    {w}
                  </div>

                  <div
                    className="relative z-10 mt-1 leading-none font-extrabold"
                    style={{
                      fontSize: 18,
                      color: isSelected ? "#0b1202" : "#ffffff",
                    }}
                  >
                    {dd}
                  </div>

                  <div className="relative z-10 mt-1 flex h-4 items-center justify-center">
                    <span className="inline-block h-2.5 w-2.5" />
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}