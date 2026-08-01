"use client";

import type { CSSProperties, ReactNode } from "react";
import {
  RankingsGlowWireFrame,
  RankingsNoiseTexture,
  RankingsScanTexture,
} from "@/app/component/rankings/RankingsCyberDecor";
import {
  RANKINGS_CARD_DROP_SHADOW,
  rankingsCardShellStyle,
} from "@/lib/rankings/rankingsCyberTheme";

type Props = {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  compact?: boolean;
  /** コミュニティモーダル等、装飾を抑えたトーン */
  subtle?: boolean;
  interactive?: boolean;
  /** 親の `group/{name}` active 時にフラッシュ */
  pressGroup?: string;
  style?: CSSProperties;
  /** 枠・背景を上書き（月次ヒーローの上位帯色など） */
  shellStyle?: CSSProperties;
  /** 底線・フラッシュのアクセント（未指定はシアン） */
  accentRgb?: string;
};

/** MyRankCard と同系の DATA SLAB パネル枠 */
export function RankingsCyberPanel({
  children,
  className = "",
  innerClassName = "",
  compact = false,
  subtle = false,
  interactive = false,
  pressGroup,
  style,
  shellStyle,
  accentRgb = "rgba(34,211,238,0.25)",
}: Props) {
  const pressFlashClass = pressGroup
    ? `opacity-0 transition-opacity duration-150 group-active/${pressGroup}:opacity-100`
    : "hidden";

  return (
    <div
      className={[
        subtle ? "shadow-[0_8px_18px_rgba(0,0,0,0.28)]" : RANKINGS_CARD_DROP_SHADOW,
        interactive
          ? "transition-[filter] duration-150 hover:brightness-[1.04]"
          : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={style}
    >
      <div
        className={[
          "relative w-full max-w-full overflow-hidden",
          compact ? "px-3 py-3" : "px-4 py-3.5 sm:px-5",
          innerClassName,
        ].join(" ")}
        style={{
          ...rankingsCardShellStyle(subtle ? "subtle" : "default"),
          ...shellStyle,
        }}
      >
        {!subtle ? <RankingsNoiseTexture /> : null}
        {!subtle ? <RankingsScanTexture /> : null}
        {!subtle ? <RankingsGlowWireFrame variant="full" /> : null}
        {!subtle ? (
          <div
            className="pointer-events-none absolute bottom-0 left-0 right-0 z-[2] h-px"
            style={{
              background: `linear-gradient(to right, transparent, ${accentRgb}, transparent)`,
            }}
            aria-hidden
          />
        ) : null}
        {!subtle ? (
          <span
            className={[
              "pointer-events-none absolute inset-0 z-[3]",
              pressFlashClass,
            ].join(" ")}
            style={{
              background: `linear-gradient(105deg, transparent 10%, ${accentRgb} 50%, transparent 90%)`,
            }}
            aria-hidden
          />
        ) : null}
        <div className="relative z-[10]">{children}</div>
      </div>
    </div>
  );
}

type SectionLabelProps = {
  children: ReactNode;
  className?: string;
};

/** シリアル帯風セクション見出し */
export function RankingsCyberSectionLabel({
  children,
  className = "",
  subtle = false,
}: SectionLabelProps & { subtle?: boolean }) {
  return (
    <div
      className={[
        "mb-3 flex items-center gap-2 border-b pb-2",
        subtle ? "border-white/10" : "border-cyan-400/20",
        className,
      ].join(" ")}
    >
      <span
        className={[
          "h-1.5 w-1.5 shrink-0 rounded-full",
          subtle
            ? "bg-cyan-400/55"
            : "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.85)]",
        ].join(" ")}
        aria-hidden
      />
      <h2
        className={[
          "font-mono font-semibold uppercase tracking-[0.22em]",
          subtle
            ? "text-[10px] text-cyan-200/65 sm:text-[11px]"
            : "text-[11px] text-cyan-200/85 [text-shadow:0_0_12px_rgba(34,211,238,0.35)] sm:text-xs",
        ].join(" ")}
      >
        {children}
      </h2>
    </div>
  );
}
