"use client";

import { motion } from "framer-motion";
import { useId, type ComponentProps } from "react";
import { ProCornerBracketFrame } from "@/app/component/common/ProCornerBracketFrame";
import { proBadgeWordClass, proBadgeWordFamily } from "@/lib/fonts";

export type ProCyberBadgeMotionProps = Pick<
  ComponentProps<typeof motion.span>,
  "initial" | "animate" | "transition"
>;

type Props = ProCyberBadgeMotionProps & {
  ariaLabel: string;
  /** ランキング一覧などでサイズを一段小さく */
  compact?: boolean;
  /** プロフィールカード — compact より一段大きく */
  premium?: boolean;
};

const MARK_SIZE = 64;

const PRO_GOLD = {
  bright: "#f4df9a",
  mid: "#d4af5a",
  deep: "#a67c28",
};

/** マーク + PRO ワードを1枚のタグで囲む Pro バッジ */
function ProLuxuryDiamondMark({
  className,
  idPrefix,
}: {
  className: string;
  idPrefix: string;
}) {
  const gold = `${idPrefix}-gold`;
  const goldDim = `${idPrefix}-gold-dim`;
  const frameFill = `${idPrefix}-frame`;
  const facetHi = `${idPrefix}-facet-hi`;
  const facetMid = `${idPrefix}-facet-mid`;
  const facetDark = `${idPrefix}-facet-dark`;
  const glow = `${idPrefix}-glow`;

  const outer =
    "M32,5 L59,32 L32,59 L5,32 Z";
  const frameInner = "M32,11.5 L52.5,32 L32,52.5 L11.5,32 Z";
  const gemTop = "32,14.5";
  const gemRight = "50,32";
  const gemBottom = "32,49.5";
  const gemLeft = "14,32";
  const gemCenter = "32,32";

  return (
    <svg
      className={className}
      viewBox={`0 0 ${MARK_SIZE} ${MARK_SIZE}`}
      aria-hidden
    >
      <defs>
        <linearGradient id={gold} x1="8%" y1="6%" x2="92%" y2="94%">
          <stop offset="0%" stopColor="#fff8e8" />
          <stop offset="18%" stopColor="#f3d98a" />
          <stop offset="42%" stopColor="#c89a3a" />
          <stop offset="68%" stopColor="#f0cc72" />
          <stop offset="88%" stopColor="#9a7128" />
          <stop offset="100%" stopColor="#6f5218" />
        </linearGradient>
        <linearGradient id={goldDim} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e8c66e" />
          <stop offset="100%" stopColor="#7a5a1c" />
        </linearGradient>
        <radialGradient id={frameFill} cx="28%" cy="22%" r="78%">
          <stop offset="0%" stopColor="#565660" />
          <stop offset="38%" stopColor="#2a2a32" />
          <stop offset="72%" stopColor="#121218" />
          <stop offset="100%" stopColor="#060608" />
        </radialGradient>
        <linearGradient id={facetHi} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fff9ee" />
          <stop offset="28%" stopColor="#efd080" />
          <stop offset="72%" stopColor="#c4933c" />
          <stop offset="100%" stopColor="#8f6820" />
        </linearGradient>
        <linearGradient id={facetMid} x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#3a3a44" />
          <stop offset="55%" stopColor="#1c1c22" />
          <stop offset="100%" stopColor="#0a0a0e" />
        </linearGradient>
        <linearGradient id={facetDark} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#242428" />
          <stop offset="45%" stopColor="#101014" />
          <stop offset="100%" stopColor="#000000" />
        </linearGradient>
        <filter id={glow} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow
            dx="0"
            dy="1.2"
            stdDeviation="1.4"
            floodColor="#000000"
            floodOpacity="0.55"
          />
          <feDropShadow
            dx="0"
            dy="0"
            stdDeviation="0.6"
            floodColor="#d4af5a"
            floodOpacity="0.12"
          />
        </filter>
      </defs>

      <g filter={`url(#${glow})`}>
        {/* 外枠リング */}
        <path
          fill={`url(#${frameFill})`}
          fillRule="evenodd"
          d={`${outer} ${frameInner}`}
        />

        {/* 外周・内周ゴールドリム */}
        <path
          d={outer}
          fill="none"
          stroke={`url(#${gold})`}
          strokeWidth="1.65"
          strokeLinejoin="miter"
        />
        <path
          d={frameInner}
          fill="none"
          stroke={`url(#${goldDim})`}
          strokeWidth="1.15"
          strokeLinejoin="miter"
        />

        {/* 内側ファセット宝石（光源: 左上） */}
        <polygon
          points={`${gemTop} ${gemLeft} ${gemCenter}`}
          fill={`url(#${facetHi})`}
        />
        <polygon
          points={`${gemTop} ${gemCenter} ${gemRight}`}
          fill={`url(#${facetMid})`}
        />
        <polygon
          points={`${gemRight} ${gemCenter} ${gemBottom}`}
          fill={`url(#${facetDark})`}
        />
        <polygon
          points={`${gemBottom} ${gemCenter} ${gemLeft}`}
          fill={`url(#${facetMid})`}
        />

        {/* 上面ハイライト */}
        <path
          d="M32,14.5 L36.5,18.5 L32,22.5 L27.5,18.5 Z"
          fill="#fffdf6"
          opacity="0.22"
        />
      </g>
    </svg>
  );
}

/** マーク + PRO ワードを1枚のタグで囲む Pro バッジ */
export function ProCyberBadge({
  ariaLabel,
  initial,
  animate,
  transition,
  compact = false,
  premium = false,
}: Props) {
  const rid = useId().replace(/[^a-zA-Z0-9-_]/g, "x");

  // compact: 一覧用 / premium: プロフィールカード用 — 枠に対して中身も比例縮小
  const tagClass = premium
    ? "relative inline-flex h-[14px] items-center gap-[2px] px-[3px]"
    : compact
      ? "relative inline-flex h-[13px] items-center gap-[2px] px-[2.5px] sm:h-[14px] sm:px-[3px]"
      : "relative inline-flex h-[18px] items-center gap-[3px] px-[4px]";
  const bracketClass =
    "pointer-events-none absolute inset-0 h-full w-full overflow-visible";
  const markClass = premium
    ? "relative z-[1] h-[7px] w-[7px] shrink-0"
    : compact
      ? "relative z-[1] h-[6.5px] w-[6.5px] shrink-0 sm:h-[7px] sm:w-[7px]"
      : "relative z-[1] h-[9px] w-[9px] shrink-0";
  const wordSize = premium ? "5.5px" : compact ? "5.5px" : "7px";
  const bracketStroke = premium || compact ? 1.35 : 0.95;

  return (
    <motion.span
      className={[
        tagClass,
        "shrink-0 select-none align-middle outline-none",
      ].join(" ")}
      initial={initial}
      animate={animate}
      transition={transition}
      aria-label={ariaLabel}
    >
      <ProCornerBracketFrame
        className={bracketClass}
        idPrefix={rid}
        strokeWidth={bracketStroke}
        vectorEffect="non-scaling-stroke"
      />

      <ProLuxuryDiamondMark className={markClass} idPrefix={rid} />

      <span
        className={[proBadgeWordClass, "relative z-[1] leading-none"].join(" ")}
        style={{
          fontFamily: proBadgeWordFamily,
          fontSize: wordSize,
          fontWeight: 400,
          letterSpacing: premium || compact ? "0.04em" : "0.07em",
          color: PRO_GOLD.mid,
          backgroundImage: `linear-gradient(180deg, ${PRO_GOLD.bright} 0%, ${PRO_GOLD.mid} 48%, ${PRO_GOLD.deep} 100%)`,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          WebkitTextFillColor: "transparent",
          textShadow: "none",
          filter: "drop-shadow(0.5px 0 0 rgba(0,0,0,0.4))",
        }}
        aria-hidden
      >
        PRO
      </span>
    </motion.span>
  );
}

/** ランキング行など：入場アニメなし */
export const proBadgeStaticMotion: ProCyberBadgeMotionProps = {
  initial: { opacity: 1, y: 0 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0 },
};

/** Free 行のレイアウト揃え用スペーサー幅（compact） */
export const PRO_BADGE_COMPACT_SPACER_CLASS =
  "inline-flex h-[13px] w-[26px] shrink-0 sm:h-[14px] sm:w-[28px]";
