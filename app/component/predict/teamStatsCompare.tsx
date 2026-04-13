"use client";

import { motion } from "framer-motion";
import { resultStatsMetricNumClass } from "@/lib/fonts";

export const ROW_STAGGER = 0.09;
export const BAR_DURATION = 0.72;
export const BAR_AFTER_ROW = 0.06;

/** 左: ミント系ネオン / 右: バイオレット系（GameTeamStats と同一） */
export const BAR_LEFT_HEX = "#5cf0b5";
export const BAR_RIGHT_HEX = "#b388ff";
export const BAR_LEFT_RGB = "92,240,181";
export const BAR_RIGHT_RGB = "179,136,255";

export function barPctMaxNorm(h: number, a: number): [number, number] {
  const m = Math.max(h, a);
  if (m <= 0 || !Number.isFinite(m)) return [0, 0];
  return [
    Math.min(100, Math.max(0, Math.round((h / m) * 100))),
    Math.min(100, Math.max(0, Math.round((a / m) * 100))),
  ];
}

export function barPctMinPaNorm(h: number, a: number): [number, number] {
  const lo = Math.min(h, a);
  const hi = Math.max(h, a);
  if (hi <= 0 || !Number.isFinite(hi)) return [0, 0];
  const left = h > 0 ? Math.min(100, Math.round((lo / h) * 100)) : 0;
  const right = a > 0 ? Math.min(100, Math.round((lo / a) * 100)) : 0;
  return [Math.max(0, left), Math.max(0, right)];
}

export function barPctDiffNorm(h: number, a: number): [number, number] {
  const mPos = Math.max(h, a);
  if (mPos > 0) {
    return [
      Math.min(100, Math.max(0, Math.round((Math.max(0, h) / mPos) * 100))),
      Math.min(100, Math.max(0, Math.round((Math.max(0, a) / mPos) * 100))),
    ];
  }
  if (h === 0 && a === 0) return [0, 0];
  const worst = Math.min(h, a);
  const best = Math.max(h, a);
  const span = best - worst;
  if (span <= 0) return [50, 50];
  return [
    Math.min(100, Math.max(0, Math.round(((h - worst) / span) * 100))),
    Math.min(100, Math.max(0, Math.round(((a - worst) / span) * 100))),
  ];
}

export function CyberBar({
  value,
  grow,
  winGlow,
  delay,
}: {
  value: number;
  grow: "left" | "right";
  winGlow: boolean;
  delay: number;
}) {
  const v = Math.min(100, Math.max(0, value)) / 100;
  const origin = grow === "left" ? "right center" : "left center";
  const hex = grow === "left" ? BAR_LEFT_HEX : BAR_RIGHT_HEX;
  const rgb = grow === "left" ? BAR_LEFT_RGB : BAR_RIGHT_RGB;
  const borderTint =
    grow === "left" ? "border-[#5cf0b5]/28" : "border-[#b388ff]/28";
  const baseInset =
    grow === "left"
      ? "inset 0 0 6px rgba(92,240,181,0.07)"
      : "inset 0 0 6px rgba(179,136,255,0.07)";
  const fillBg =
    grow === "left"
      ? `linear-gradient(to right, ${hex}55 0%, ${hex}dd 45%, ${hex} 100%)`
      : `linear-gradient(to right, ${hex} 0%, ${hex}dd 55%, ${hex}55 100%)`;

  return (
    <div
      className={[
        "relative h-[3px] min-w-[56px] max-w-[min(36vw,132px)] flex-1 overflow-hidden rounded-[1px]",
        "md:h-1 md:min-w-[100px] md:max-w-[min(30vw,260px)]",
        "border bg-black/50",
        borderTint,
      ].join(" ")}
      style={{
        boxShadow: winGlow
          ? `${baseInset}, 0 0 8px ${hex}44, 0 0 3px ${hex}66`
          : baseInset,
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 rounded-[1px]"
        style={{
          background: `linear-gradient(
            to bottom,
            rgba(${rgb},0.3),
            rgba(${rgb},0.12)
          )`,
        }}
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[1px]">
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: v }}
          transition={{
            duration: BAR_DURATION,
            delay,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="absolute inset-y-0 left-0 z-1 w-full"
          style={{
            transformOrigin: origin,
            background: fillBg,
            boxShadow: winGlow
              ? `0 0 5px ${hex}55, 0 0 2px ${hex}77`
              : `0 0 2px ${hex}35`,
          }}
        />
      </div>
    </div>
  );
}

export function SymmetricalCompareRow({
  label,
  left,
  right,
  leftWin,
  rightWin,
  barDelay,
  largerMobileMetrics = false,
  emphasizedMetrics = false,
}: {
  label: string;
  left: {
    primary: string;
    rank: string | null;
    /** 主数値の直下（例: リーグ内順位）。recordBelow より上に表示 */
    rankBelow?: string | null;
    barPct: number;
    recordBelow: string | null;
  };
  right: {
    primary: string;
    rank: string | null;
    rankBelow?: string | null;
    barPct: number;
    recordBelow: string | null;
  };
  leftWin: boolean;
  rightWin: boolean;
  barDelay: number;
  /** true のとき主数値のみモバイルで一段大きく（H2H 直接対決スタッツ用） */
  largerMobileMetrics?: boolean;
  /** true のとき主数値をモバイル・デスクトップとも大きく（詳細スタッツ用） */
  emphasizedMetrics?: boolean;
}) {
  const rowAnimDelay = barDelay;

  const primarySize = emphasizedMetrics
    ? "text-lg md:text-2xl"
    : largerMobileMetrics
      ? "text-base md:text-base"
      : "text-sm md:text-base";

  const leftNumClass = [
    resultStatsMetricNumClass,
    `text-right ${primarySize}`,
    "text-[#5cf0b5]",
  ].join(" ");

  const rightNumClass = [
    resultStatsMetricNumClass,
    `text-left ${primarySize}`,
    "text-[#b388ff]",
  ].join(" ");

  const subLineClass = emphasizedMetrics
    ? [
        resultStatsMetricNumClass,
        "text-[11px] text-white/48 md:text-[13px]",
      ].join(" ")
    : [
        resultStatsMetricNumClass,
        "text-[10px] text-white/45 md:text-[11px]",
      ].join(" ");

  const rankBelowLineClass = emphasizedMetrics
    ? [
        resultStatsMetricNumClass,
        "text-[11px] text-white/55 md:text-[13px]",
      ].join(" ")
    : [
        resultStatsMetricNumClass,
        "text-[10px] text-white/52 md:text-[11px]",
      ].join(" ");

  const labelClass = emphasizedMetrics
    ? "text-xs font-medium leading-tight tracking-wide text-white/72 md:text-[13px]"
    : "text-[10px] font-medium leading-tight tracking-wide text-white/65 md:text-[11px]";

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: rowAnimDelay, ease: "easeOut" }}
      className="border-b border-white/8 py-2.5 last:border-b-0"
    >
      <div className="flex items-center gap-1 md:gap-1.5">
        <div className="flex min-w-0 flex-1 items-center justify-end gap-1 md:gap-1.5">
          <CyberBar
            value={left.barPct}
            grow="left"
            winGlow={leftWin}
            delay={barDelay + BAR_AFTER_ROW}
          />
          <span
            className={[
              resultStatsMetricNumClass,
              "w-9 shrink-0 text-right text-[10px] text-white/38 md:w-10 md:text-[11px]",
            ].join(" ")}
          >
            {left.rank ?? ""}
          </span>
          <div className="flex min-w-0 flex-col items-end gap-0.5">
            <span
              className={leftNumClass}
              style={{
                textShadow: leftWin
                  ? "0 0 6px rgba(92,240,181,0.42), 0 0 2px rgba(92,240,181,0.55)"
                  : undefined,
              }}
            >
              {left.primary}
            </span>
            {left.rankBelow ? (
              <span className={rankBelowLineClass}>{left.rankBelow}</span>
            ) : null}
            {left.recordBelow ? (
              <span className={subLineClass}>{left.recordBelow}</span>
            ) : null}
          </div>
        </div>

        <div
          className={[
            "shrink-0 px-0.5 text-center",
            emphasizedMetrics ? "w-20 md:w-22" : "w-18 md:w-21",
          ].join(" ")}
        >
          <div className={labelClass}>{label}</div>
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-1 md:gap-1.5">
          <div className="flex min-w-0 flex-col items-start gap-0.5">
            <span
              className={rightNumClass}
              style={{
                textShadow: rightWin
                  ? "0 0 6px rgba(179,136,255,0.4), 0 0 2px rgba(179,136,255,0.52)"
                  : undefined,
              }}
            >
              {right.primary}
            </span>
            {right.rankBelow ? (
              <span className={rankBelowLineClass}>{right.rankBelow}</span>
            ) : null}
            {right.recordBelow ? (
              <span className={subLineClass}>{right.recordBelow}</span>
            ) : null}
          </div>
          <span
            className={[
              resultStatsMetricNumClass,
              "w-9 shrink-0 text-left text-[10px] text-white/38 md:w-10 md:text-[11px]",
            ].join(" ")}
          >
            {right.rank ?? ""}
          </span>
          <CyberBar
            value={right.barPct}
            grow="right"
            winGlow={rightWin}
            delay={barDelay + BAR_AFTER_ROW}
          />
        </div>
      </div>
    </motion.div>
  );
}
