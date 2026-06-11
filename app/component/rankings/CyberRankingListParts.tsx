"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { nameBebas, nameOxanium, nameRajdhani, jp } from "@/lib/fonts";
import { summaryMetricNumClass } from "@/lib/fonts";
import { RankingsAvatarCircle } from "@/app/component/rankings/RankingsAvatarCircle";
import {
  cyberRankNumStyle,
  cyberRankPalette,
  CYBER_LIST_CYAN,
} from "@/lib/rankings/cyberRankVisual";
import type { MobileMetric } from "@/app/component/rankings/_data/mockRows";
import { formatMetricDecimals } from "@/lib/format/metricDecimals";
import { rankingMetricAccent } from "@/lib/rankings/rankingMetricAccent";
import { RankFirstBorderEdgeScan } from "@/app/component/rankings/RankFirstBorderEdgeScan";
import {
  hasJaScript,
  rankingFontSizePx,
} from "@/lib/rankings/rankingJaTextSize";
import type { Language } from "@/lib/i18n/language";
import { postsLabel } from "@/lib/i18n/rankings";

const SEGMENTS = 10;
const SEG_STAGGER_S = 0.055;
const SEG_OPACITY_DURATION_S = 0.32;

function filledSegCount(pct: number): number {
  return Math.round((Math.min(100, Math.max(0, pct)) / 100) * SEGMENTS);
}

export function CyberListSegBar({
  pct,
  metric,
  compact,
  enterDelay = 0,
}: {
  pct: number;
  metric: MobileMetric;
  compact?: boolean;
  /** 行の登場アニメと合わせるための遅延（秒） */
  enterDelay?: number;
}) {
  const reduceMotion = useReducedMotion();
  const [enter, setEnter] = useState(reduceMotion === true);
  const accent = rankingMetricAccent(metric);
  const segMinH = compact ? "h-[4px]" : "h-[5px]";
  const filled = enter ? filledSegCount(pct) : 0;
  const motionOff = reduceMotion === true;

  useEffect(() => {
    if (motionOff) {
      setEnter(true);
      return;
    }
    setEnter(false);
    const id = window.setTimeout(() => setEnter(true), enterDelay * 1000);
    return () => window.clearTimeout(id);
  }, [pct, metric, enterDelay, motionOff]);

  return (
    <div
      className={[
        "flex w-full gap-[3px]",
        compact ? "max-w-[120px]" : "max-w-[168px]",
      ].join(" ")}
      role="presentation"
    >
      {Array.from({ length: SEGMENTS }).map((_, i) => {
        const lit = i < filled;
        const delay = i * SEG_STAGGER_S;
        const shown = enter || motionOff;

        return (
          <motion.div
            key={i}
            className={["flex-1 rounded-[1px]", segMinH].join(" ")}
            initial={false}
            animate={{
              opacity: shown ? (lit ? 1 : 0.38) : 0,
              scaleY: shown ? 1 : 0.3,
            }}
            transition={
              motionOff
                ? { duration: 0 }
                : {
                    opacity: {
                      delay: enter ? delay : 0,
                      duration: SEG_OPACITY_DURATION_S,
                    },
                    scaleY: {
                      delay: enter ? delay : 0,
                      type: "spring",
                      stiffness: 380,
                      damping: 28,
                    },
                  }
            }
            style={{
              transformOrigin: "center bottom",
              background: lit ? accent.border : "rgba(255,255,255,0.07)",
              boxShadow: lit ? `0 0 6px ${accent.bar.glow}` : "none",
              border: lit
                ? `1px solid ${accent.bg}`
                : "1px solid rgba(255,255,255,0.04)",
            }}
          />
        );
      })}
    </div>
  );
}

export function CyberRankNumber({
  rank,
  compact,
}: {
  rank: number;
  compact?: boolean;
}) {
  const label = String(rank).padStart(2, "0");

  return (
    <span className="cyber-rank-num relative inline-block">
      <span
        className={[nameBebas.className, "relative z-[1] block tabular-nums leading-none"].join(
          " "
        )}
        style={cyberRankNumStyle(rank, !!compact)}
      >
        {label}
      </span>
      <span aria-hidden className="cyber-rank-num__scan pointer-events-none" />
    </span>
  );
}

const rankHudNumClass = summaryMetricNumClass;

function cyberScoreColor(rank: number): string {
  if (rank === 1) return "#FFD65A";
  if (rank === 2) return "#FCD34D";
  if (rank === 3) return "#FB923C";
  const t = Math.min(1, (rank - 4) / 14);
  return `rgba(255, 43, 214, ${0.92 - t * 0.35})`;
}

function cyberScoreGlow(rank: number): string {
  if (rank === 1) {
    return "0 0 10px rgba(255,214,90,0.55), 0 0 18px rgba(255,43,214,0.25)";
  }
  if (rank <= 3) {
    return "0 0 8px rgba(255,43,214,0.42)";
  }
  const t = Math.min(1, (rank - 4) / 14);
  return `0 0 ${8 + t * 4}px rgba(255,43,214,${0.38 - t * 0.22})`;
}

export function CyberRankingScore({
  rank,
  metric,
  counted,
  compact = false,
}: {
  rank: number;
  metric: MobileMetric;
  counted: number;
  compact?: boolean;
}) {
  const color = cyberScoreColor(rank);
  const mainSize = compact
    ? rank <= 3
      ? "text-[15px]"
      : "text-[13px]"
    : rank <= 3
      ? "text-[23px]"
      : "text-[19px]";

  const valueStyle = {
    color,
    textShadow: cyberScoreGlow(rank),
  } as const;

  const displayValue =
    metric === "winRate" || metric === "streak" || metric === "goalScorerHits"
      ? String(Math.round(counted))
      : formatMetricDecimals(counted, 1);

  return (
    <div
      className={[
        rankHudNumClass,
        mainSize,
        "tabular-nums leading-none",
      ].join(" ")}
      style={valueStyle}
    >
      {displayValue}
    </div>
  );
}

export function CyberRankingListRow({
  rank,
  displayName,
  photoURL,
  barPct,
  metric,
  metricTag,
  scoreSlot,
  nameExtra,
  compact = false,
  showCrownSlot,
  posts,
  language = "ja",
  subtleShell = false,
  barEnterDelay = 0,
}: {
  rank: number;
  displayName: string;
  photoURL?: string | null;
  barPct: number;
  metric: MobileMetric;
  metricTag: string;
  scoreSlot: ReactNode;
  nameExtra?: ReactNode;
  compact?: boolean;
  showCrownSlot?: ReactNode;
  posts?: number;
  language?: Language;
  subtleShell?: boolean;
  barEnterDelay?: number;
}) {
  const palette = cyberRankPalette(rank);
  const firstFrame = palette.firstPlaceFrame && !subtleShell;
  const nameJa = hasJaScript(displayName);
  const nameFontSize = rankingFontSizePx(compact ? 13 : 15, displayName);
  const tagJa = hasJaScript(metricTag);
  const tagFontSize = rankingFontSizePx(compact ? 7 : 8, metricTag);
  const postsText = `${postsLabel(language)} ${posts ?? 0}`;
  const postsJa = hasJaScript(postsText);
  const postsFontSize = rankingFontSizePx(compact ? 8 : 9, postsText);

  return (
    <article
      className={[
        "relative flex items-stretch overflow-hidden",
        compact ? "min-h-[56px]" : "min-h-[72px]",
      ].join(" ")}
      style={{
        background: subtleShell
          ? "rgba(255,255,255,0.02)"
          : "linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 42%, rgba(0,0,0,0.12) 100%)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {firstFrame ? <RankFirstBorderEdgeScan /> : null}

      <span
        aria-hidden
        className={[
          "w-[3px] shrink-0",
          firstFrame ? "relative z-10" : "",
        ].join(" ")}
        style={{
          background: palette.accent,
          boxShadow: `0 0 12px ${palette.accentGlow}`,
        }}
      />

      <div
        className={[
          "flex min-w-0 flex-1 items-center",
          firstFrame ? "relative z-10" : "",
          compact ? "gap-2 px-2 py-2" : "gap-3 px-3 py-2.5 sm:gap-4 sm:px-4",
        ].join(" ")}
      >
        <div
          className={[
            "relative shrink-0",
            compact ? "w-[42px]" : "w-[52px] sm:w-[58px]",
          ].join(" ")}
        >
          {showCrownSlot}
          <CyberRankNumber rank={rank} compact={compact} />
        </div>

        <div
          className={[
            "flex shrink-0 flex-col items-end",
            rank === 1 && !subtleShell ? (compact ? "gap-0.5" : "gap-1") : "",
          ].join(" ")}
        >
          {rank === 1 && !subtleShell ? (
            <span
              aria-hidden
              className={[
                "font-bold leading-none",
                nameOxanium.className,
                compact ? "text-[6px] tracking-[0.08em]" : "text-[7px] tracking-[0.1em]",
              ].join(" ")}
              style={{
                color: "#B8FF3C",
                textShadow: "0 0 6px rgba(184,255,60,0.55)",
              }}
            >
              +++
            </span>
          ) : null}
          <div
            className="relative shrink-0 overflow-hidden rounded-sm"
            style={{
              width: compact ? 36 : 44,
              height: compact ? 36 : 44,
              border: firstFrame
                ? "1px solid rgba(184,255,60,0.55)"
                : "1px solid rgba(255,255,255,0.12)",
              boxShadow: firstFrame ? "0 0 12px rgba(184,255,60,0.2)" : "none",
            }}
          >
            <RankingsAvatarCircle
              photoURL={photoURL}
              displayName={displayName}
              boxClassName="h-full w-full rounded-sm"
              initialTextClassName={
                nameJa
                  ? compact
                    ? "text-[10px]"
                    : "text-[12px]"
                  : compact
                    ? "text-[11px]"
                    : "text-[13px]"
              }
              gateReady
            />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1">
            <div
              className={[
                "min-w-0 truncate font-bold tracking-[0.06em]",
                nameJa ? jp.className : nameRajdhani.className,
                nameJa ? "" : "uppercase",
              ].join(" ")}
              style={{
                color: CYBER_LIST_CYAN,
                fontSize: nameFontSize,
                textShadow: "0 0 12px rgba(0,245,255,0.35)",
              }}
            >
              {displayName}
            </div>
            {nameExtra}
          </div>
          <div className={compact ? "mt-1.5" : "mt-2"}>
            <CyberListSegBar
              pct={barPct}
              metric={metric}
              compact={compact}
              enterDelay={barEnterDelay}
            />
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end justify-center pl-1">
          {scoreSlot}
          <span
            className={[
              "mt-1 font-bold tracking-[0.2em]",
              tagJa ? jp.className : nameOxanium.className,
              tagJa ? "" : "uppercase",
            ].join(" ")}
            style={{ color: "#FF2BD6", fontSize: tagFontSize }}
          >
            {metricTag}
          </span>
          {typeof posts === "number" ? (
            <span
              className={[
                "mt-0.5 tabular-nums leading-none",
                postsJa ? jp.className : nameOxanium.className,
                postsJa ? "" : "uppercase tracking-[0.12em]",
              ].join(" ")}
              style={{
                color: "rgba(255,255,255,0.48)",
                fontSize: postsFontSize,
              }}
            >
              {postsText}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
