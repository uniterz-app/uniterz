"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { CSSProperties } from "react";

/** ===== JST 日付ユーティリティ（ズレないやつ） ===== */
const MS = 24 * 60 * 60 * 1000;
const JST_OFFSET = 9 * 60 * 60 * 1000; // +09:00

// UnixエポックをJSTの「1970/01/01 00:00」扱いにするための基準
const EPOCH_JST_DAY = 0; // 1970-01-01 (JST) を dayNumber=0 とする

/** UTCミリ秒 → JSTの通日番号(1970/1/1基準) */
function epochMsToJstDayNumber(ms: number): number {
  return Math.floor((ms + JST_OFFSET) / MS);
}

/** JSTの通日番号 → Date（その日のJST 00:00相当） */
function jstDayNumberToDate(dayNum: number): Date {
  // dayNum * MS は JST基準。UTCに戻すために -JST_OFFSET
  return new Date(dayNum * MS - JST_OFFSET);
}

/** 任意DateをJST通日番号に */
function dateToJstDayNumber(d: Date): number {
  return epochMsToJstDayNumber(d.getTime());
}

/** 表示用（大きい日付・英語曜日） */
function formatDayLabel(dayNum: number) {
  const d = jstDayNumberToDate(dayNum);
  const w = d.toLocaleDateString("en-US", { weekday: "short", timeZone: "Asia/Tokyo" }); // Mon/Tue...
  const m = d.toLocaleDateString("en-US", { month: "short", timeZone: "Asia/Tokyo" });   // Oct/Nov...
  const dd = d.getDate(); // JST相当に揃っている
  return { w, m, dd };
}
const WEEK = ["S", "M", "T", "W", "T", "F", "S"] as const;

function formatMonthTitle(dayNum: number) {
  const d = jstDayNumberToDate(dayNum);
  // 日本時間で英語の "Oct 2025" 形式
  return d.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "Asia/Tokyo",
  });
}


/** props */
type Props = {
  /** 選択している日 (JST) */
  value: Date;
  /** 変更ハンドラ */
  onChange: (d: Date) => void;
  /** 1セルの幅(px) : web ~64, mobile ~56 推奨 */
  itemWidth?: number;
  /** 高さ(px)  */
  height?: number;
  /** 同時に見せたい個数の目安（スクロール量計算のヒント/任意） */
  visibleCountHint?: number;
  /** 今日を青リング・選択を塗りつぶし */
  accentColorClass?: string; // 例: "bg-sky-500"
};

const BIG_COUNT = 365 * 4000; // 4000年分相当（実質無限）
const CENTER_INDEX = Math.floor(BIG_COUNT / 2);


export default function InfiniteDayStrip({
  value,
  onChange,
  itemWidth = 64,
  height = 84,
  visibleCountHint = 10,
  accentColorClass = "bg-sky-500",
}: Props) {
  // ハイドレーション対策（SSR時は描画しない）
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // 今日/選択日の通日番号
  const [now] = useState(() => Date.now()); // 初回だけ評価され、SSR→CSRで同じ値が使われる
const todayDay = useMemo(() => dateToJstDayNumber(new Date(now)), [now]);
  const selectedDay = useMemo(() => dateToJstDayNumber(value), [value]);
const monthTitle = useMemo(() => formatMonthTitle(selectedDay), [selectedDay]);

  // 「巨大インデックス」 <-> 「JST通日番号」を相互変換
  // 中央インデックスを today に合わせて意味づけしておくと直感的
  const dayAtCenter = todayDay;
  const indexToDay = (index: number) => dayAtCenter + (index - CENTER_INDEX);
  const dayToIndex = (day: number) => CENTER_INDEX + (day - dayAtCenter);

  const parentRef = useRef<HTMLDivElement | null>(null);

  const virtualizer = useVirtualizer({
    count: BIG_COUNT,
    horizontal: true,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemWidth,
    // キーの安定化
    getItemKey: (index) => index,
    overscan: visibleCountHint * 2,
  });

  // 選択が変わったとき、中央付近にスクロール（初期表示では自動スクロールしない仕様ならここを外す）
  useEffect(() => {
    if (!mounted) return;
    const idx = dayToIndex(selectedDay);
    virtualizer.scrollToIndex(idx, { align: "center", behavior: "smooth" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, selectedDay]);

  return (
   <div ref={parentRef} style={{ height, opacity: mounted ? 1 : 0 }}
      className="relative w-full overflow-x-auto select-none"
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
                transform: `translate3d(${vi.start}px,0,0)`,
                height,
              }}
            >
              <button
                onClick={() => onChange(jstDayNumberToDate(dayNum))}
                className={[
                  "flex flex-col items-center justify-center rounded-xl transition-colors",
                  "px-2",
                  isSelected ? `${accentColorClass} text-white` : "bg-transparent text-white",
                ].join(" ")}
                style={{ width: itemWidth - 8, height: height - 10 }}
                aria-current={isSelected ? "date" : undefined}
              >
                {/* 上段: 月 / 曜日 */}
                <div className="text-[10px] opacity-80 leading-none">{m}</div>
                <div className="text-[11px] opacity-80 leading-none -mt-0.5">{w}</div>

                {/* 中段: 日にち（大きめ） */}
                <div
                  className={[
                    "mt-1 leading-none font-extrabold",
                    isSelected ? "text-white" : "text-white",
                  ].join(" ")}
                  style={{ fontSize: 18 }}
                >
                  {dd}
                </div>

                {/* 下段: 今日リング */}
                <div className="mt-1 h-4 flex items-center justify-center">
                  {isToday && !isSelected ? (
                    <span className={`inline-block w-2.5 h-2.5 rounded-full border-2 border-current`} />
                  ) : (
                    <span className="inline-block w-2.5 h-2.5" />
                  )}
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
