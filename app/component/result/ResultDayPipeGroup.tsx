"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { m } from "framer-motion";
import {
  RESULT_DAY_METRICS_DELAY_SEC,
  RESULT_LIST_LEAD_IN_SEC,
  RESULT_PAGE_SLOT_GAP_SEC,
  RESULT_PAGE_SLOT_MAX_DELAY_SEC,
  RESULT_SLOT_DURATION_SEC,
  resultCardsCyberOrch,
  resultDayCyberGroup,
  resultDayHeaderBracketItem,
  resultDayHeaderBracketOrch,
  resultDayHeaderCyber,
  resultDayHeaderPageSlot,
} from "@/lib/result/resultCyberMotion";
import { resultStatsMetricNumClass } from "@/lib/fonts";
import { MOBILE_RESULT_DAY_STRIP_OUTER_CLASS } from "@/lib/games/mobileListCardLayout";
import { RESULT_WEB_DAY_STRIP_WIDTH_CLASS } from "@/lib/result/resultListWebLayout";
import { resultDayStripPanelClass } from "@/lib/result/resultGlass";

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
   * 子は `variants={resultCardCyberItem}` 付きの `m.div` が CardsOrch 直下に並ぶ想定。
   */
  listCyberCardStagger?: boolean;
  /** カード列のレイアウト（grid / flex 等） */
  cardsClassName?: string;
  /** 指定時は一覧全体の上から順スロットで日付帯を入場 */
  headerEntrySlot?: number;
};

function AnimatedDayPointsValue({
  value,
  reducedMotion,
  startDelayMs = 0,
}: {
  value: string;
  reducedMotion: boolean;
  startDelayMs?: number;
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
    let delayTimer = 0;
    const startAnim = () => {
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
    };

    if (startDelayMs > 0) {
      delayTimer = window.setTimeout(startAnim, startDelayMs);
    } else {
      startAnim();
    }

    return () => {
      window.clearTimeout(delayTimer);
      window.cancelAnimationFrame(rafId);
    };
  }, [safeTarget, reducedMotion, startDelayMs]);

  if (!Number.isFinite(target)) return <>{value}</>;
  return <>{display.toFixed(decimals)}</>;
}

function AnimatedIntegerValue({
  value,
  reducedMotion,
  startDelayMs = 0,
}: {
  value: number;
  reducedMotion: boolean;
  startDelayMs?: number;
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
    let delayTimer = 0;
    const startAnim = () => {
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
    };

    if (startDelayMs > 0) {
      delayTimer = window.setTimeout(startAnim, startDelayMs);
    } else {
      startAnim();
    }

    return () => {
      window.clearTimeout(delayTimer);
      window.cancelAnimationFrame(rafId);
    };
  }, [safeTarget, reducedMotion, startDelayMs]);

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
  cardsClassName = "",
  headerEntrySlot,
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

  const useFlatEntry =
    headerEntrySlot != null && !reducedMotion;
  const useCyberStagger =
    listCyberStagger && !reducedMotion && !useFlatEntry;
  // スロット入場開始は上限付き（一覧の slotDelay と揃える）。後段でも遅くなりすぎない。
  const flatSlotStartSec =
    headerEntrySlot != null
      ? Math.min(
          RESULT_LIST_LEAD_IN_SEC + headerEntrySlot * RESULT_PAGE_SLOT_GAP_SEC,
          RESULT_PAGE_SLOT_MAX_DELAY_SEC,
        )
      : 0;
  const metricsDelayMs = useFlatEntry
    ? Math.round((flatSlotStartSec + RESULT_SLOT_DURATION_SEC * 0.55) * 1000)
    : useCyberStagger
      ? Math.round(RESULT_DAY_METRICS_DELAY_SEC * 1000)
      : 0;
  const headerScanDelaySec = useFlatEntry
    ? flatSlotStartSec + 0.06
    : 0.1;

  const BracketShell = useCyberStagger || useFlatEntry ? m.span : "span";
  const HeaderSlot = useCyberStagger || useFlatEntry ? m.div : "div";
  const CardsRow = useCyberStagger ? m.div : "div";
  const CardsOrch =
    useCyberStagger && listCyberCardStagger ? m.div : "div";

  const dateStripContentRow = (
          <div
            className={[
              "relative z-[3] flex min-w-0 w-full flex-row items-center gap-2",
              isMobile ? "gap-2.5" : "gap-4 sm:gap-6",
            ].join(" ")}
            aria-label={
              dayPoints?.variant === "total"
                ? `${dateLabel}。${dayPoints.aria}`
                : dayPoints?.variant === "pending"
                  ? `${dateLabel}。${dayPoints.aria}`
                  : dateLabel
            }
          >
            <div className="flex min-w-0 flex-1 flex-col items-start justify-center pl-0.5">
              <p
                className={[
                  resultStatsMetricNumClass,
                  "font-extrabold tabular-nums tracking-tight text-cyan-50",
                  "[text-shadow:0_0_20px_rgba(34,211,238,0.55),0_0_40px_rgba(34,211,238,0.2)]",
                  isMobile ? "text-base leading-snug" : "text-xl sm:text-2xl",
                ].join(" ")}
              >
                {dateLabel}
              </p>
            </div>

            {dayPoints?.variant === "total" && (
              <>
                <div className="flex min-w-0 flex-1 items-center justify-center px-1">
                  {typeof dayPoints.hitTotal === "number" &&
                    dayPoints.hitTotal > 0 && (
                      <div
                        className={[
                          "inline-flex items-baseline gap-1 whitespace-nowrap",
                          "leading-none tracking-tight text-white/92",
                          isMobile
                            ? "text-[clamp(0.95rem,3.7vw,1.15rem)]"
                            : "text-base md:text-xl",
                        ].join(" ")}
                      >
                        <span
                          className={isMobile ? "text-[13px] font-semibold" : "text-xs sm:text-sm font-semibold"}
                        >
                          hit
                        </span>
                        <span className={[resultStatsMetricNumClass, "font-extrabold tabular-nums leading-none"].join(" ")}>
                          <AnimatedIntegerValue
                            value={dayPoints.hitWins ?? 0}
                            reducedMotion={reducedMotion}
                            startDelayMs={metricsDelayMs}
                          />
                        </span>
                        <span className={[resultStatsMetricNumClass, "font-extrabold leading-none"].join(" ")}>/</span>
                        <span className={[resultStatsMetricNumClass, "font-extrabold tabular-nums leading-none"].join(" ")}>
                          <AnimatedIntegerValue
                            value={dayPoints.hitTotal}
                            reducedMotion={reducedMotion}
                            startDelayMs={metricsDelayMs}
                          />
                        </span>
                      </div>
                    )}
                </div>
                <div
                  className={[
                    "flex min-w-0 flex-1 items-center justify-end",
                    isMobile ? "pr-0.5" : "pr-1",
                  ].join(" ")}
                >
                  <div className="flex flex-wrap items-baseline justify-end gap-x-1.5">
                    {dayPoints.prefix ? (
                      <span
                        className={
                          isMobile
                            ? "truncate text-[13px] font-semibold leading-tight text-white"
                            : "truncate text-[12px] font-semibold text-white sm:text-[13px]"
                        }
                      >
                        {dayPoints.prefix}
                      </span>
                    ) : null}
                    <span
                      className={[
                        "inline-block whitespace-nowrap leading-none tracking-tight tabular-nums font-extrabold text-white",
                        resultStatsMetricNumClass,
                        isMobile
                          ? "text-[clamp(1.05rem,4.2vw,1.35rem)]"
                          : "text-xl md:text-5xl",
                      ].join(" ")}
                    >
                      <AnimatedDayPointsValue
                        value={dayPoints.value}
                        reducedMotion={reducedMotion}
                        startDelayMs={metricsDelayMs}
                      />
                    </span>
                    <span
                      className={
                        isMobile
                          ? "truncate text-[12px] font-semibold leading-tight text-white"
                          : "truncate text-[12px] font-semibold text-white sm:text-[13px]"
                      }
                    >
                      {dayPoints.unit}
                    </span>
                  </div>
                </div>
              </>
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
  );

  /** 日付帯：モバイルはページ横いっぱいのバナー、Web はコンテンツ幅いっぱい */
  const dateStrip = isMobile ? (
    <div className={MOBILE_RESULT_DAY_STRIP_OUTER_CLASS}>
      <div className={resultDayStripPanelClass(true)}>
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-[3px] bg-[linear-gradient(180deg,rgba(34,211,238,0.95)_0%,rgba(34,211,238,0.2)_100%)] shadow-[0_0_12px_rgba(34,211,238,0.55)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(34,211,238,0.45)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.45)_1px,transparent_1px)] [background-size:14px_14px]"
          aria-hidden
        />
        {useCyberStagger && !isMobile ? (
          <m.div
            className="pointer-events-none absolute inset-x-0 top-0 z-[2] h-[42%] bg-[linear-gradient(180deg,rgba(34,211,238,0.12)_0%,transparent_100%)]"
            aria-hidden
            initial={{ opacity: 0, y: "-100%" }}
            animate={{ opacity: [0, 0.75, 0], y: ["-100%", "130%"] }}
            transition={{
              duration: 0.55,
              delay: headerScanDelaySec,
              ease: [0.22, 1, 0.36, 1],
              times: [0, 0.45, 1],
            }}
          />
        ) : null}
        {dateStripContentRow}
      </div>
    </div>
  ) : (
    <div className={RESULT_WEB_DAY_STRIP_WIDTH_CLASS}>
      <div
        className={resultDayStripPanelClass(false)}
        style={{
          clipPath:
            "polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.1] [background-image:linear-gradient(rgba(34,211,238,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.5)_1px,transparent_1px)] [background-size:11px_11px]"
          aria-hidden
        />
        <m.div
          className="pointer-events-none absolute inset-0 z-[1]"
          aria-hidden
          variants={
            useCyberStagger || useFlatEntry
              ? resultDayHeaderBracketOrch
              : undefined
          }
        >
          <BracketShell
            className="absolute left-0 top-0 h-3 w-3 border-l-2 border-t-2 border-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"
            {...(useCyberStagger || useFlatEntry
              ? { variants: resultDayHeaderBracketItem }
              : {})}
          />
          <BracketShell
            className="absolute bottom-0 right-0 h-3 w-3 border-b-2 border-r-2 border-fuchsia-500/90 shadow-[0_0_10px_rgba(217,70,239,0.55)]"
            {...(useCyberStagger || useFlatEntry
              ? { variants: resultDayHeaderBracketItem }
              : {})}
          />
          <BracketShell
            className="absolute right-0 top-0 h-3 w-3 border-r-2 border-t-2 border-cyan-400/50"
            {...(useCyberStagger || useFlatEntry
              ? { variants: resultDayHeaderBracketItem }
              : {})}
          />
          <BracketShell
            className="absolute bottom-0 left-0 h-3 w-3 border-b-2 border-l-2 border-cyan-400/40"
            {...(useCyberStagger || useFlatEntry
              ? { variants: resultDayHeaderBracketItem }
              : {})}
          />
        </m.div>
        {useCyberStagger ? (
          <m.div
            className="pointer-events-none absolute inset-x-0 top-0 z-[2] h-[38%] bg-[linear-gradient(180deg,rgba(34,211,238,0.14)_0%,transparent_100%)]"
            aria-hidden
            initial={{ opacity: 0, y: "-100%" }}
            animate={{ opacity: [0, 0.85, 0], y: ["-100%", "120%"] }}
            transition={{
              duration: 0.55,
              delay: headerScanDelaySec,
              ease: [0.22, 1, 0.36, 1],
              times: [0, 0.45, 1],
            }}
          />
        ) : null}
        {dateStripContentRow}
      </div>
    </div>
  );

  const DayRoot = useCyberStagger ? m.div : "div";

  return (
    <DayRoot
      className="relative w-full"
      {...(useCyberStagger ? { variants: resultDayCyberGroup } : {})}
    >
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

      <HeaderSlot
        ref={headerRef}
        className="flex gap-0"
        {...(useFlatEntry
          ? {
              variants: resultDayHeaderPageSlot,
              custom: headerEntrySlot,
            }
          : useCyberStagger
            ? { variants: resultDayHeaderCyber }
            : {})}
      >
        {railW > 0 ? (
          <div
            className="shrink-0"
            style={{ width: railW }}
            aria-hidden
          />
        ) : null}
        <div className="min-w-0 flex-1">{dateStrip}</div>
      </HeaderSlot>
      <CardsRow
        className={[
          "flex gap-0",
          isMobile ? "pt-3" : "pt-4",
        ].join(" ")}
        {...(useCyberStagger ? { variants: { hidden: {}, show: {} } } : {})}
      >
        {railW > 0 ? (
          <div
            className="shrink-0"
            style={{ width: railW }}
            aria-hidden
          />
        ) : null}
        <CardsOrch
          className={["min-w-0 flex-1", cardsClassName].filter(Boolean).join(" ")}
          {...(useCyberStagger && listCyberCardStagger
            ? { variants: resultCardsCyberOrch }
            : {})}
        >
          {children}
        </CardsOrch>
      </CardsRow>
    </DayRoot>
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
