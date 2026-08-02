"use client";

import type { CSSProperties, ReactNode } from "react";
import { nameBebas, nameOxanium, nameRajdhani, jp } from "@/lib/fonts";
import { PRO_LEAGUE_ATMOSPHERE } from "@/lib/rankings/proLeagueAtmosphere";

export type RankingsTitleCyberVariant =
  | "horizon-chrome"
  | "hud-stack"
  | "neon-edge"
  | "jp-chrome"
  | "soft-blend"
  | "scan-pulse";

export type RankingsTitleCyberTone = "default" | "pro-league";

const CHROME_GRADIENT_HARD =
  "linear-gradient(180deg, #F5FEFF 0%, #BFF8FF 24%, #67E8F9 43%, #12C8D6 50%, #0EA5B7 64%, #7DDDEA 100%)";

const CHROME_GRADIENT_SOFT =
  "linear-gradient(180deg, #CFFAFE 0%, #00F5FF 38%, #06B6D4 68%, #A5F3FC 100%)";

/** filter drop-shadow は background-clip:text と併用すると矩形ハローになるため使わない */
const CYAN_GLYPH_GLOW =
  "0 0 6px rgba(34,211,238,0.42), 0 0 12px rgba(14,165,233,0.18), 0 1px 1px rgba(0,10,18,0.55)";

function chromeTextStyle(
  hard = true,
  tone: RankingsTitleCyberTone = "default"
): CSSProperties {
  const gradient =
    tone === "pro-league"
      ? PRO_LEAGUE_ATMOSPHERE.chromeGradient
      : hard
        ? CHROME_GRADIENT_HARD
        : CHROME_GRADIENT_SOFT;
  return {
    backgroundImage: gradient,
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
    WebkitTextFillColor: "transparent",
  };
}

/** クローム文字 + 字形に沿うグロー（矩形ハロー回避） */
function ChromeTitle({
  className,
  skewDeg,
  hard = true,
  glow = CYAN_GLYPH_GLOW,
  glowFill = "#67E8F9",
  tone = "default",
  children,
}: {
  className: string;
  skewDeg: number;
  hard?: boolean;
  glow?: string;
  glowFill?: string;
  tone?: RankingsTitleCyberTone;
  children: ReactNode;
}) {
  const resolvedGlow =
    tone === "pro-league" ? PRO_LEAGUE_ATMOSPHERE.chromeGlow : glow;
  const resolvedFill =
    tone === "pro-league" ? PRO_LEAGUE_ATMOSPHERE.chromeGlowFill : glowFill;

  return (
    <span
      className={["relative inline-block", className].join(" ")}
      style={{ transform: `skewX(${skewDeg}deg)` }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 select-none"
        style={{
          color: resolvedFill,
          textShadow: resolvedGlow,
          WebkitTextFillColor: resolvedFill,
        }}
      >
        {children}
      </span>
      <span className="relative" style={chromeTextStyle(hard, tone)}>
        {children}
      </span>
    </span>
  );
}

type Props = {
  variant: RankingsTitleCyberVariant;
  /** 例: RANKINGS / ランキング */
  title: string;
  /** HUD 上段ラベル */
  kicker?: string;
  /** HUD 下段 */
  subtitle?: string;
  /** web はやや大きめ */
  size?: "sm" | "md";
  /** PRO LEAGUE — 紫金クローム */
  tone?: RankingsTitleCyberTone;
  className?: string;
};

export function RankingsPageTitleCyber({
  variant,
  title,
  kicker = "SECTOR // NBA",
  subtitle = "LEADERBOARD",
  size = "md",
  tone = "default",
  className = "",
}: Props) {
  const mainSize =
    size === "sm" ? "text-[22px] sm:text-[26px]" : "text-[26px] sm:text-[32px]";
  const isJa = /[\u3040-\u30ff\u3400-\u9fff]/.test(title);

  if (variant === "hud-stack") {
    return (
      <div
        className={["flex flex-col items-center leading-none", className].join(
          " "
        )}
      >
        <span
          className={[
            nameOxanium.className,
            "mb-1 text-[8px] font-bold uppercase tracking-[0.32em] sm:text-[9px]",
          ].join(" ")}
          style={{
            color:
              tone === "pro-league" ? PRO_LEAGUE_ATMOSPHERE.gold : "#00F5FF",
            textShadow:
              tone === "pro-league"
                ? "0 0 10px rgba(246,195,68,0.55)"
                : "0 0 10px rgba(0,245,255,0.65)",
          }}
        >
          {kicker}
        </span>
        <RankingsPageTitleCyber
          variant="horizon-chrome"
          title={title}
          size={size}
          tone={tone}
        />
        <span
          className={[
            nameOxanium.className,
            "mt-1 text-[9px] font-bold uppercase tracking-[0.28em] sm:text-[10px]",
          ].join(" ")}
          style={{
            color:
              tone === "pro-league" ? PRO_LEAGUE_ATMOSPHERE.violet : "#FF2BD6",
            textShadow:
              tone === "pro-league"
                ? "0 0 12px rgba(192,132,252,0.55)"
                : "0 0 12px rgba(255,43,214,0.55)",
          }}
        >
          {subtitle}
        </span>
      </div>
    );
  }

  if (variant === "jp-chrome") {
    return (
      <ChromeTitle
        className={[
          isJa ? jp.className : nameBebas.className,
          "font-black italic",
          mainSize,
          "tracking-[0.12em]",
          className,
        ].join(" ")}
        skewDeg={-8}
        tone={tone}
      >
        {title}
      </ChromeTitle>
    );
  }

  if (variant === "soft-blend") {
    return (
      <ChromeTitle
        className={[
          nameRajdhani.className,
          "font-bold italic",
          mainSize,
          "tracking-[0.22em] uppercase",
          className,
        ].join(" ")}
        skewDeg={-6}
        hard={false}
        glow={
          tone === "pro-league"
            ? PRO_LEAGUE_ATMOSPHERE.chromeGlow
            : "0 0 8px rgba(0,245,255,0.32), 0 0 14px rgba(0,245,255,0.12)"
        }
        tone={tone}
      >
        {title}
      </ChromeTitle>
    );
  }

  if (variant === "neon-edge") {
    const edge =
      tone === "pro-league"
        ? {
            stroke: "rgba(246,195,68,0.9)",
            shadow:
              "0 0 8px rgba(192,132,252,0.85), 0 0 14px rgba(246,195,68,0.35)",
          }
        : {
            stroke: "rgba(0,245,255,0.9)",
            shadow:
              "0 0 8px rgba(0,245,255,0.85), 0 0 14px rgba(0,245,255,0.35)",
          };
    return (
      <span
        className={[
          nameBebas.className,
          "relative inline-block italic",
          mainSize,
          "tracking-[0.24em] uppercase",
          className,
        ].join(" ")}
        style={{ transform: "skewX(-10deg)" }}
      >
        <span
          aria-hidden
          className="absolute inset-0 select-none"
          style={{
            WebkitTextStroke: `1px ${edge.stroke}`,
            color: "transparent",
            textShadow: edge.shadow,
          }}
        >
          {title}
        </span>
        <span className="relative" style={chromeTextStyle(true, tone)}>
          {title}
        </span>
      </span>
    );
  }

  if (variant === "scan-pulse") {
    return (
      <ChromeTitle
        className={[
          nameBebas.className,
          "italic",
          mainSize,
          "tracking-[0.24em] uppercase",
          className,
        ].join(" ")}
        skewDeg={-10}
        tone={tone}
      >
        {title}
      </ChromeTitle>
    );
  }

  /* horizon-chrome */
  return (
    <ChromeTitle
      className={[
        nameBebas.className,
        "italic",
        mainSize,
        "tracking-[0.24em] uppercase",
        className,
      ].join(" ")}
      skewDeg={-10}
      tone={tone}
    >
      {title}
    </ChromeTitle>
  );
}

export const RANKINGS_TITLE_VARIANT_META: Record<
  RankingsTitleCyberVariant,
  { id: string; labelJa: string; descJa: string }
> = {
  "horizon-chrome": {
    id: "A",
    labelJa: "Horizon Chrome",
    descJa: "シアン系クローム — 水平スプリット＋斜体 Bebas",
  },
  "hud-stack": {
    id: "B",
    labelJa: "HUD Stack",
    descJa: "上: SECTOR ラベル / 中: タイトル / 下: マゼンタ副題（参照の3段構成）",
  },
  "neon-edge": {
    id: "C",
    labelJa: "Neon Edge",
    descJa: "クローム塗り＋シアンのネオン縁取り（夜光看板感）",
  },
  "jp-chrome": {
    id: "D",
    labelJa: "JP Chrome",
    descJa: "「ランキング」日本語版 — 同じグラデーション分割",
  },
  "soft-blend": {
    id: "E",
    labelJa: "Soft Blend",
    descJa: "Rajdhani — スプリットをやわらかくブレンド（控えめ）",
  },
  "scan-pulse": {
    id: "F",
    labelJa: "Scan Pulse",
    descJa: "Horizon Chrome ＋ 走査線（廃止・A と同見た目）",
  },
};
