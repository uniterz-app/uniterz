"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { m, type Variants } from "framer-motion";
import {
  GAMES_CYBER_EASE,
  GAMES_CYBER_ENTRY_DURATION_SEC,
  GAMES_CYBER_SLOT_GAP_SEC,
} from "@/app/component/games/cyberMotion";
import { resultStatsMetricNumClass } from "@/lib/fonts";
import { MOBILE_RESULT_CARD_MAX_W_CLASS } from "@/lib/games/mobileListCardLayout";

/** 日付行右側の得点表示（確定合計 or 未確定） */
export type ResultDayPointsHeader =
  | null
  | {
      variant: "pending";
      line: string;
      aria: string;
    }
  | {
      variant: "total";
      value: string;
      prefix: string;
      unit: string;
      aria: string;
      /** 勝者予想が判定できた試合のうち的中数 / 判定済み件数（中央に hit N/M で表示） */
      hitWins?: number;
      hitTotal?: number;
    };

type Props = {
  dateLabel: string;
  isMobile: boolean;
  /** アクセシビリティ: 省略時はアニメーションあり */
  reducedMotion?: boolean;
  dayPoints?: ResultDayPointsHeader;
  children: ReactNode;
  /**
   * 一覧のスタッガー親と連動するサイバー入場（日付帯 → カード列の順）。
   * 親は Framer の staggerChildren で各日ブロックの開始をずらす想定。
   */
  listCyberStagger?: boolean;
  /**
   * true のとき、日付の次に各 Result カードを上から順にスタッガー表示する。
   * 子は先頭が `m.div`（variants でカード列のオーケストレーション）で、その直下にカード用 `m.div` が並ぶ想定。
   */
  listCyberCardStagger?: boolean;
};

function AnimatedDayPointsValue({
  value,
  reducedMotion,
}: {
  value: string;
  reducedMotion: boolean;
}) {
  const target = Number.parseFloat(value);
  const safeTarget = Number.isFinite(target) ? target : 0;
  const decimals = value.includes(".") ? value.split(".")[1]?.length ?? 0 : 0;
  // 初回は 0 から数えて合計点のカウントアップを見せる（from=目標だと変化がゼロになる）
  const [display, setDisplay] = useState<number>(() =>
    reducedMotion ? safeTarget : 0
  );
  const fromRef = useRef<number>(reducedMotion ? safeTarget : 0);

  useEffect(() => {
    if (reducedMotion) {
      fromRef.current = safeTarget;
      setDisplay(safeTarget);
      return;
    }

    const from = fromRef.current;
    const to = safeTarget;
    const durationMs = 700;
    let rafId = 0;
    const start = performance.now();

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      // 終盤を少しゆっくりにして読み取りやすくする。
      const eased = 1 - Math.pow(1 - t, 3);
      const next = from + (to - from) * eased;
      setDisplay(next);
      if (t < 1) {
        rafId = window.requestAnimationFrame(step);
      } else {
        fromRef.current = to;
      }
    };

    rafId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(rafId);
  }, [safeTarget, reducedMotion]);

  if (!Number.isFinite(target)) return <>{value}</>;
  return <>{display.toFixed(decimals)}</>;
}

function AnimatedIntegerValue({
  value,
  reducedMotion,
}: {
  value: number;
  reducedMotion: boolean;
}) {
  const safeTarget = Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
  const [display, setDisplay] = useState<number>(() =>
    reducedMotion ? safeTarget : 0
  );
  const fromRef = useRef<number>(reducedMotion ? safeTarget : 0);

  useEffect(() => {
    if (reducedMotion) {
      fromRef.current = safeTarget;
      setDisplay(safeTarget);
      return;
    }

    const from = fromRef.current;
    const to = safeTarget;
    const durationMs = 620;
    let rafId = 0;
    const start = performance.now();

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = from + (to - from) * eased;
      setDisplay(next);
      if (t < 1) {
        rafId = window.requestAnimationFrame(step);
      } else {
        fromRef.current = to;
      }
    };

    rafId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(rafId);
  }, [safeTarget, reducedMotion]);

  return <>{Math.round(display)}</>;
}

/**
 * リザルト一覧の「日付見出し」とカード群を、直角パイプ風の線でつなぐ。
 * ブラケット（下線＋両端上向き）→ 縦線 → 各カード高さの中央から左へ短い横線。
 */
export function ResultDayPipeGroup({
  dateLabel,
  isMobile,
  reducedMotion = false,
  dayPoints = null,
  children,
  listCyberStagger = false,
  listCyberCardStagger = false,
}: Props) {
  const headerRef = useRef<HTMLDivElement | null>(null);
  const [spineTopPx, setSpineTopPx] = useState<number | null>(null);

  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const measure = () => {
      const h = el.offsetHeight;
      if (h > 0) setSpineTopPx(h);
    };

    measure();

    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(measure);
      ro.observe(el);
      return () => ro.disconnect();
    }

    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [dateLabel, isMobile, dayPoints]);

  // モバイルはカードを画面幅に揃えるため左レールを使わない
  const railW = isMobile ? 0 : 24;
  const spineTop =
    spineTopPx != null ? `${spineTopPx}px` : isMobile ? "3rem" : "3.5rem";

  const easeOut = [0.22, 1, 0.36, 1] as const;
  const useCyberStagger = listCyberStagger && !reducedMotion;
  const useCardSlotStagger = Boolean(
    listCyberCardStagger && useCyberStagger
  );

  /** スクロール連動は使わず、マウント時のみ（reduce 時は無効） */
  const headerMotion =
    useCyberStagger || reducedMotion
      ? {}
      : {
          initial: { opacity: 0, x: -14, filter: "blur(4px)" },
          animate: {
            opacity: 1,
            x: 0,
            filter: "blur(0px)",
            transition: { duration: 0.45, ease: easeOut },
          },
        };

  /** 日付帯とカード列の順番入場（親リストの staggerChildren と組み合わせる） */
  const dayCyberOrch: Variants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: GAMES_CYBER_SLOT_GAP_SEC,
        delayChildren: 0.02,
      },
    },
  };

  const dayCyberSegment: Variants = reducedMotion
    ? { hidden: {}, show: {} }
    : {
        hidden: {
          opacity: 0,
          y: -16,
          scale: 0.985,
          filter: "blur(6px)",
        },
        show: {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
          transition: {
            duration: GAMES_CYBER_ENTRY_DURATION_SEC,
            ease: GAMES_CYBER_EASE,
          },
        },
      };

  /** 日付カード（サイバー列と通常列で共通） */
  const dateStrip = (
    <div
      className={
        isMobile
          ? `mx-auto w-full ${MOBILE_RESULT_CARD_MAX_W_CLASS}`
          : "mx-auto w-full max-w-xl sm:max-w-5xl"
      }
    >
      <div className="flex w-full flex-col items-center gap-2">
        <m.div
          className={[
            "group relative w-full max-w-full overflow-hidden",
            "border border-cyan-400/70 bg-[#030308]/95",
            "shadow-[0_0_32px_-4px_rgba(34,211,238,0.35),inset_0_1px_0_0_rgba(34,211,238,0.25)]",
            isMobile ? "px-3 py-3" : "px-4 py-3.5 sm:px-5",
          ].join(" ")}
          style={{
            clipPath:
              "polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)",
          }}
          {...headerMotion}
        >
          {/* グリッド */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(34,211,238,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.5)_1px,transparent_1px)] [background-size:11px_11px]"
            aria-hidden
          />
          {/* スキャンライン風 */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.06] [background:repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(34,211,238,0.12)_2px,rgba(34,211,238,0.12)_3px)]"
            aria-hidden
          />
          {/* コーナーブラケット */}
          <span
            className="pointer-events-none absolute left-0 top-0 z-[1] h-3 w-3 border-l-2 border-t-2 border-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"
            aria-hidden
          />
          <span
            className="pointer-events-none absolute bottom-0 right-0 z-[1] h-3 w-3 border-b-2 border-r-2 border-fuchsia-500/90 shadow-[0_0_10px_rgba(217,70,239,0.55)]"
            aria-hidden
          />
          <span
            className="pointer-events-none absolute right-0 top-0 z-[1] h-3 w-3 border-r-2 border-t-2 border-cyan-400/50"
            aria-hidden
          />
          <span
            className="pointer-events-none absolute bottom-0 left-0 z-[1] h-3 w-3 border-b-2 border-l-2 border-cyan-400/40"
            aria-hidden
          />

          <div
            className={[
              "relative flex min-w-0 flex-row items-center gap-2",
              isMobile ? "sm:gap-3" : "gap-4 sm:gap-6",
            ].join(" ")}
            aria-label={
              dayPoints?.variant === "total"
                ? `${dateLabel}。${dayPoints.aria}`
                : dayPoints?.variant === "pending"
                  ? `${dateLabel}。${dayPoints.aria}`
                  : dateLabel
            }
          >
            <div className="flex min-w-0 shrink-0 flex-col items-start justify-center">
              <p
                className={[
                  "font-mono font-bold tabular-nums tracking-tight text-cyan-50",
                  "[text-shadow:0_0_20px_rgba(34,211,238,0.55),0_0_40px_rgba(34,211,238,0.2)]",
                  isMobile ? "text-base leading-snug" : "text-xl sm:text-2xl",
                ].join(" ")}
              >
                {dateLabel}
              </p>
            </div>

            {dayPoints?.variant === "total" &&
              typeof dayPoints.hitTotal === "number" &&
              dayPoints.hitTotal > 0 && (
                <div className="min-w-0 flex-1 px-1 text-center">
                  <div
                    className={[
                      "inline-flex items-baseline gap-1 whitespace-nowrap",
                      "leading-none tracking-tight tabular-nums font-black text-white/92",
                      resultStatsMetricNumClass,
                      isMobile
                        ? "text-[clamp(0.95rem,3.7vw,1.15rem)]"
                        : "text-base md:text-xl",
                    ].join(" ")}
                  >
                    <span className={isMobile ? "text-[11px]" : "text-xs sm:text-sm"}>
                      hit
                    </span>
                    <span>
                      <AnimatedIntegerValue
                        value={dayPoints.hitWins ?? 0}
                        reducedMotion={reducedMotion}
                      />
                    </span>
                    <span>/</span>
                    <span>
                      <AnimatedIntegerValue
                        value={dayPoints.hitTotal}
                        reducedMotion={reducedMotion}
                      />
                    </span>
                  </div>
                </div>
              )}

            {dayPoints?.variant === "total" && (
              <div
                className={[
                  "flex min-w-0 shrink-0 flex-col items-end justify-center text-right",
                  !(
                    typeof dayPoints.hitTotal === "number" &&
                    dayPoints.hitTotal > 0
                  )
                    ? "ml-auto"
                    : "",
                  isMobile
                    ? "min-w-0 pl-1"
                    : "min-w-[8.5rem]",
                ].join(" ")}
              >
                <div className="flex flex-wrap items-baseline justify-end gap-x-1.5">
                  {dayPoints.prefix ? (
                    <span
                      className={
                        isMobile
                          ? "truncate text-[11px] font-semibold leading-tight text-white"
                          : "truncate text-[12px] font-semibold text-white sm:text-[13px]"
                      }
                    >
                      {dayPoints.prefix}
                    </span>
                  ) : null}
                  {/* ResultCard 中央スコアと同じ数値タイポ（Oxanium + サイズ階層） */}
                  <m.span
                    className={[
                      "inline-block whitespace-nowrap leading-none tracking-tight tabular-nums font-black text-white",
                      isMobile
                        ? "text-[clamp(1.05rem,4.2vw,1.35rem)]"
                        : "text-xl md:text-5xl",
                      resultStatsMetricNumClass,
                    ].join(" ")}
                    initial={
                      reducedMotion ? false : { scale: 0.88, opacity: 0.55 }
                    }
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 420,
                      damping: 26,
                      mass: 0.55,
                    }}
                  >
                    <AnimatedDayPointsValue
                      value={dayPoints.value}
                      reducedMotion={reducedMotion}
                    />
                  </m.span>
                  <span
                    className={
                      isMobile
                        ? "truncate text-[11px] font-semibold leading-tight text-white"
                        : "truncate text-[12px] font-semibold text-white sm:text-[13px]"
                    }
                  >
                    {dayPoints.unit}
                  </span>
                </div>
              </div>
            )}

            {dayPoints?.variant === "pending" && (
              <div
                className={
                  isMobile
                    ? "flex min-w-0 flex-1 items-center justify-end pl-1"
                    : "flex min-w-0 flex-col items-end justify-center sm:pl-2"
                }
              >
                <span className="border border-dashed border-fuchsia-500/50 bg-black/60 px-2.5 py-1.5 font-mono text-[11px] font-semibold tracking-wide text-fuchsia-300/80 [box-shadow:0_0_16px_-4px_rgba(217,70,239,0.4)] sm:text-xs">
                  {dayPoints.line}
                </span>
              </div>
            )}
          </div>
        </m.div>
      </div>
    </div>
  );

  return (
    <div className="relative">
      {railW > 0 && (
        <div
          className="pointer-events-none absolute bottom-3 w-px -translate-x-1/2 bg-white/45"
          style={{
            left: railW / 2,
            top: spineTop,
          }}
          aria-hidden
        />
      )}

      <div className={isMobile ? "flex flex-col gap-3" : "flex flex-col gap-4"}>
        <div ref={headerRef} className="flex gap-0">
          {railW > 0 ? (
            <div
              className="shrink-0"
              style={{ width: railW }}
              aria-hidden
            />
          ) : null}
          {useCyberStagger ? (
            <m.div
              className="flex min-w-0 flex-1 flex-col"
              variants={dayCyberOrch}
              initial="hidden"
              animate="show"
            >
              <m.div variants={dayCyberSegment} className="min-w-0 w-full">
                {dateStrip}
              </m.div>
              {useCardSlotStagger ? (
                children
              ) : (
                <m.div variants={dayCyberSegment} className="min-w-0 w-full pt-2">
                  {children}
                </m.div>
              )}
            </m.div>
          ) : (
            <div className="min-w-0 flex-1">
              {dateStrip}
              <div className="min-w-0 w-full pt-2">{children}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** カード1枚ぶん：縦レールからカード左辺へ横線＋コンテンツ */
export function ResultDayPipeCardRow({
  isMobile,
  children,
}: {
  isMobile: boolean;
  children: ReactNode;
}) {
  const railW = isMobile ? 0 : 24;
  const stubW = isMobile ? 11 : 12;

  return (
    <div className="flex items-center gap-0">
      {railW > 0 ? (
        <div
          className="shrink-0 flex items-center justify-end"
          style={{ width: railW }}
        >
          <div
            className="h-px bg-white/45"
            style={{ width: stubW }}
            aria-hidden
          />
        </div>
      ) : null}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
