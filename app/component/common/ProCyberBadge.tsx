"use client";

import { motion } from "framer-motion";
import { useId, type ComponentProps } from "react";

export type ProCyberBadgeMotionProps = Pick<
  ComponentProps<typeof motion.span>,
  "initial" | "animate" | "transition"
>;

type Props = ProCyberBadgeMotionProps & {
  ariaLabel: string;
  /** ランキング一覧などでサイズを一段小さく */
  compact?: boolean;
};

/** プロフィール・ランキング共通：六角枠＋「PRO」（枠のみ発光、文字はシャープ） */
export function ProCyberBadge({
  ariaLabel,
  initial,
  animate,
  transition,
  compact = false,
}: Props) {
  const rid = useId().replace(/[^a-zA-Z0-9-_]/g, "x");
  const gradMetal = `pro-hex-metal-${rid}`;
  const gradInner = `pro-hex-inner-${rid}`;
  const filterFrame = `pro-hex-glow-${rid}`;
  const hexD = "M8 10 L48 10 L52 30 L48 50 L8 50 L4 30 Z";

  // compact: 一覧用。sm 未満（モバイル幅）では一段小さくする
  const outer = compact
    ? "relative inline-flex h-8 w-[27px] shrink-0 select-none items-center justify-center align-middle outline-none sm:h-9 sm:w-[31px]"
    : "relative inline-flex h-11 w-10 shrink-0 select-none items-center justify-center align-middle outline-none";
  const svgClass = compact
    ? "h-8 w-[27px] overflow-visible sm:h-9 sm:w-[31px]"
    : "h-11 w-10 overflow-visible";

  return (
    <motion.span
      className={outer}
      initial={initial}
      animate={animate}
      transition={transition}
      aria-label={ariaLabel}
    >
      <svg className={svgClass} viewBox="0 0 56 60" aria-hidden>
        <defs>
          <linearGradient
            id={gradMetal}
            x1="4"
            y1="4"
            x2="52"
            y2="56"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#e2e8f0" />
            <stop offset="0.22" stopColor="#94a3b8" />
            <stop offset="0.5" stopColor="#475569" />
            <stop offset="0.78" stopColor="#cbd5e1" />
            <stop offset="1" stopColor="#64748b" />
          </linearGradient>
          <radialGradient
            id={gradInner}
            cx="0.5"
            cy="0.42"
            r="0.72"
            gradientUnits="objectBoundingBox"
          >
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="0.55" stopColor="#050a12" />
            <stop offset="100%" stopColor="#020308" />
          </radialGradient>
          <filter
            id={filterFrame}
            x="-25%"
            y="-22%"
            width="145%"
            height="140%"
          >
            <feDropShadow
              in="SourceGraphic"
              dx="0"
              dy="0"
              stdDeviation="1.05"
              floodColor="#22d3ee"
              floodOpacity="0.5"
              result="g1"
            />
            <feDropShadow
              in="SourceGraphic"
              dx="0"
              dy="0"
              stdDeviation="2.1"
              floodColor="#06b6d4"
              floodOpacity="0.2"
              result="g2"
            />
            <feMerge>
              <feMergeNode in="g2" />
              <feMergeNode in="g1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g>
          <g filter={`url(#${filterFrame})`}>
            <path
              d={hexD}
              fill={`url(#${gradInner})`}
              stroke={`url(#${gradMetal})`}
              strokeWidth="2.15"
              strokeLinejoin="miter"
            />
            <path
              d={hexD}
              fill="none"
              stroke="#22d3ee"
              strokeWidth="0.55"
              strokeOpacity="0.75"
              transform="translate(28, 30) scale(0.9) translate(-28, -30)"
            />
          </g>
          <text
            x="28"
            y="29"
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#ecfeff"
            stroke="#0c4a6e"
            strokeWidth="0.2"
            paintOrder="stroke fill"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, monospace"
            fontSize={compact ? "11.5" : "13.5"}
            fontWeight="800"
            letterSpacing="0.1em"
            textRendering="geometricPrecision"
          >
            PRO
          </text>
        </g>
      </svg>
    </motion.span>
  );
}

/** ランキング行など：入場アニメなし */
export const proBadgeStaticMotion: ProCyberBadgeMotionProps = {
  initial: { opacity: 1, y: 0 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0 },
};
