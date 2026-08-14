"use client";

import { motion } from "framer-motion";
import {
  CyberSlantedSegBar,
  type CyberSegAccent,
} from "@/app/component/rankings/CyberSlantedSegBar";
import { nameOxanium, resultStatsMetricNumClass } from "@/lib/fonts";

export const ROW_STAGGER = 0.045;
export const BAR_DURATION = 0.42;
export const BAR_AFTER_ROW = 0.03;

/** 左: ミント系ネオン / 右: バイオレット系（GameTeamStats と同一） */
export const BAR_LEFT_HEX = "#5cf0b5";
export const BAR_RIGHT_HEX = "#b388ff";
export const BAR_LEFT_RGB = "92,240,181";
export const BAR_RIGHT_RGB = "179,136,255";

/** リーグ順位 → 斜めセグメント点灯数（6帯: 1–5 … 26–30） */
export const LEAGUE_RANK_SEGMENTS = 6;

/**
 * #1–5 → 6点灯、#6–10 → 5 … #26–30 → 1。
 * 順位なしは 0。
 */
export function leagueRankSegFilled(
  rank: number | null | undefined,
  segments = LEAGUE_RANK_SEGMENTS
): number {
  if (rank == null || !Number.isFinite(rank) || rank < 1) return 0;
  const r = Math.min(30, Math.round(rank));
  const bucket = Math.min(segments - 1, Math.floor((r - 1) / 5)); // 0..5
  return segments - bucket;
}

export function leagueRankSegPct(
  rank: number | null | undefined,
  segments = LEAGUE_RANK_SEGMENTS
): number {
  return (leagueRankSegFilled(rank, segments) / segments) * 100;
}

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

/** リーグ順位帯（6セグ）の斜めバー — HOME は中央寄りから外側へ点灯 */
export function LeagueRankSegBar({
  rank,
  grow,
  delay,
}: {
  rank: number | null | undefined;
  grow: "left" | "right";
  delay: number;
}) {
  const pct = leagueRankSegPct(rank, LEAGUE_RANK_SEGMENTS);
  const accent: CyberSegAccent =
    grow === "left"
      ? {
          border: BAR_LEFT_HEX,
          glow: "rgba(92,240,181,0.28)",
          bg: BAR_LEFT_HEX,
        }
      : {
          border: BAR_RIGHT_HEX,
          glow: "rgba(179,136,255,0.28)",
          bg: BAR_RIGHT_HEX,
        };

  return (
    <div
      className={[
        "flex min-w-0 flex-1",
        grow === "left"
          ? "justify-end [&_.cyber-slanted-seg-track]:flex-row-reverse"
          : "justify-start",
      ].join(" ")}
    >
      <CyberSlantedSegBar
        pct={pct}
        segments={LEAGUE_RANK_SEGMENTS}
        compact
        enterDelay={delay}
        accent={accent}
        maxWidthClass="max-w-[112px]"
      />
    </div>
  );
}

const PRO_NOTE_TONE_CLASS: Record<string, string> = {
  up: "text-[#2DFF6E]/90",
  down: "text-[#FF8AB4]/90",
  flat: "text-white/40",
};

const PRO_BADGE_CLASS: Record<string, string> = {
  top5: "border-[#FF6B2D]/70 bg-[#FF6B2D]/18 text-[#FF9A63]",
  top10: "border-[#2DFF6E]/55 bg-[#2DFF6E]/14 text-[#2DFF6E]",
  bot10: "border-[#5B8CFF]/50 bg-[#5B8CFF]/12 text-[#8EB6FF]",
  bot5: "border-[#7EC8FF]/65 bg-[#7EC8FF]/16 text-[#B8E4FF]",
};

function SideMetricBlock({
  align,
  primary,
  primaryClass,
  winGlow,
  winShadow,
  rankBelow,
  rankBelowClass,
  recordBelow,
  recordBelowClass,
  proBadge,
  proBadgeId,
  proMeta,
  proMetaTone,
  compactHud,
}: {
  align: "left" | "right";
  primary: string;
  primaryClass: string;
  winGlow: boolean;
  winShadow?: string;
  rankBelow?: string | null;
  rankBelowClass: string;
  recordBelow: string | null;
  recordBelowClass: string;
  proBadge?: string | null;
  proBadgeId?: string | null;
  proMeta?: string | null;
  proMetaTone?: "up" | "down" | "flat";
  compactHud: boolean;
}) {
  const items = align === "right" ? "items-end" : "items-start";
  const textAlign = align === "right" ? "text-right" : "text-left";

  return (
    <div className={`flex min-w-0 flex-col gap-0.5 ${items}`}>
      <div
        className={`flex min-w-0 flex-wrap items-center gap-1 ${
          align === "right" ? "justify-end" : "justify-start"
        }`}
      >
        <span className={primaryClass} style={{ textShadow: winGlow ? winShadow : undefined }}>
          {primary}
        </span>
        {proBadge ? (
          <span
            className={[
              nameOxanium.className,
              "shrink-0 rounded-[2px] border px-1 py-px text-[6px] font-extrabold uppercase tracking-[0.06em]",
              PRO_BADGE_CLASS[proBadgeId ?? "top10"] ?? PRO_BADGE_CLASS.top10,
            ].join(" ")}
          >
            {proBadge}
          </span>
        ) : null}
      </div>
      {proMeta ? (
        <span
          className={[
            nameOxanium.className,
            textAlign,
            "whitespace-nowrap",
            compactHud ? "text-[8px] font-bold tracking-[0.04em]" : "text-[9px] font-bold",
            PRO_NOTE_TONE_CLASS[proMetaTone ?? "flat"],
          ].join(" ")}
        >
          {proMeta}
        </span>
      ) : null}
      {rankBelow ? (
        <span className={[rankBelowClass, "whitespace-nowrap"].join(" ")}>
          {rankBelow}
        </span>
      ) : null}
      {recordBelow ? <span className={recordBelowClass}>{recordBelow}</span> : null}
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
  /** 予想オーバーレイ向け：英語 HUD ラベル + やや小さめの数値 */
  compactHud = false,
}: {
  label: string;
  left: {
    primary: string;
    rank: string | null;
    /** 主数値の直下（例: リーグ内順位）。recordBelow より上に表示 */
    rankBelow?: string | null;
    barPct: number;
    /** あり → リーグ順位6セグバー。なし → 従来の相対 CyberBar */
    leagueRank?: number | null;
    recordBelow: string | null;
    /** Pro: 主数値と同列のバッジ（FIRE / HOT …） */
    proBadge?: string | null;
    proBadgeId?: string | null;
    proMeta?: string | null;
    proMetaTone?: "up" | "down" | "flat";
    /** @deprecated 互換 — proMeta 推奨 */
    proNote?: string | null;
    proNoteTone?: "up" | "down" | "flat";
  };
  right: {
    primary: string;
    rank: string | null;
    rankBelow?: string | null;
    barPct: number;
    leagueRank?: number | null;
    recordBelow: string | null;
    proBadge?: string | null;
    proBadgeId?: string | null;
    proMeta?: string | null;
    proMetaTone?: "up" | "down" | "flat";
    proNote?: string | null;
    proNoteTone?: "up" | "down" | "flat";
  };
  leftWin: boolean;
  rightWin: boolean;
  barDelay: number;
  /** true のとき主数値のみモバイルで一段大きく（H2H 直接対決スタッツ用） */
  largerMobileMetrics?: boolean;
  /** true のとき主数値をモバイル・デスクトップとも大きく（詳細スタッツ用） */
  emphasizedMetrics?: boolean;
  compactHud?: boolean;
}) {
  const rowAnimDelay = barDelay;

  const primarySize = compactHud
    ? "text-[13px] md:text-sm"
    : emphasizedMetrics
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

  const subLineClass = compactHud
    ? [
        resultStatsMetricNumClass,
        "text-[9px] text-white/45 md:text-[10px]",
      ].join(" ")
    : emphasizedMetrics
      ? [
          resultStatsMetricNumClass,
          "text-[11px] text-white/48 md:text-[13px]",
        ].join(" ")
      : [
          resultStatsMetricNumClass,
          "text-[10px] text-white/45 md:text-[11px]",
        ].join(" ");

  const rankBelowLineClass = compactHud
    ? [
        resultStatsMetricNumClass,
        "text-[12px] font-bold text-white/80 md:text-[13px]",
      ].join(" ")
    : emphasizedMetrics
      ? [
          resultStatsMetricNumClass,
          "text-[11px] text-white/55 md:text-[13px]",
        ].join(" ")
      : [
          resultStatsMetricNumClass,
          "text-[10px] text-white/52 md:text-[11px]",
        ].join(" ");

  const labelClass = compactHud
    ? [
        nameOxanium.className,
        "text-[9px] font-bold uppercase leading-tight tracking-[0.12em] text-white/70 md:text-[10px]",
      ].join(" ")
    : emphasizedMetrics
      ? [
          nameOxanium.className,
          "text-[10px] font-bold uppercase leading-tight tracking-[0.12em] text-white/72 md:text-[12px]",
        ].join(" ")
      : "text-[10px] font-medium leading-tight tracking-wide text-white/65 md:text-[11px]";

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: rowAnimDelay, ease: "easeOut" }}
      className={
        compactHud
          ? "border-b border-white/8 py-1.5 last:border-b-0"
          : "border-b border-white/8 py-2.5 last:border-b-0"
      }
    >
      <div className="flex items-center gap-1 md:gap-1.5">
        <div className="flex min-w-0 flex-1 items-center justify-end gap-1 md:gap-1.5">
          {left.leagueRank != null ? (
            <LeagueRankSegBar
              rank={left.leagueRank}
              grow="left"
              delay={barDelay + BAR_AFTER_ROW}
            />
          ) : (
            <CyberBar
              value={left.barPct}
              grow="left"
              winGlow={leftWin}
              delay={barDelay + BAR_AFTER_ROW}
            />
          )}
          <span
            className={[
              resultStatsMetricNumClass,
              "w-9 shrink-0 text-right text-[10px] text-white/38 md:w-10 md:text-[11px]",
            ].join(" ")}
          >
            {left.rank ?? ""}
          </span>
          <SideMetricBlock
            align="right"
            primary={left.primary}
            primaryClass={leftNumClass}
            winGlow={leftWin}
            winShadow="0 0 6px rgba(92,240,181,0.42), 0 0 2px rgba(92,240,181,0.55)"
            rankBelow={left.rankBelow}
            rankBelowClass={rankBelowLineClass}
            recordBelow={left.recordBelow}
            recordBelowClass={subLineClass}
            proBadge={left.proBadge}
            proBadgeId={left.proBadgeId}
            proMeta={left.proMeta ?? left.proNote}
            proMetaTone={left.proMetaTone ?? left.proNoteTone}
            compactHud={compactHud}
          />
        </div>

        <div
          className={[
            "shrink-0 px-0.5 text-center",
            compactHud
              ? "w-14 md:w-16"
              : emphasizedMetrics
                ? "w-20 md:w-22"
                : "w-18 md:w-21",
          ].join(" ")}
        >
          <div className={labelClass}>{label}</div>
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-1 md:gap-1.5">
          <SideMetricBlock
            align="left"
            primary={right.primary}
            primaryClass={rightNumClass}
            winGlow={rightWin}
            winShadow="0 0 6px rgba(179,136,255,0.4), 0 0 2px rgba(179,136,255,0.52)"
            rankBelow={right.rankBelow}
            rankBelowClass={rankBelowLineClass}
            recordBelow={right.recordBelow}
            recordBelowClass={subLineClass}
            proBadge={right.proBadge}
            proBadgeId={right.proBadgeId}
            proMeta={right.proMeta ?? right.proNote}
            proMetaTone={right.proMetaTone ?? right.proNoteTone}
            compactHud={compactHud}
          />
          <span
            className={[
              resultStatsMetricNumClass,
              "w-9 shrink-0 text-left text-[10px] text-white/38 md:w-10 md:text-[11px]",
            ].join(" ")}
          >
            {right.rank ?? ""}
          </span>
          {right.leagueRank != null ? (
            <LeagueRankSegBar
              rank={right.leagueRank}
              grow="right"
              delay={barDelay + BAR_AFTER_ROW}
            />
          ) : (
            <CyberBar
              value={right.barPct}
              grow="right"
              winGlow={rightWin}
              delay={barDelay + BAR_AFTER_ROW}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
}
