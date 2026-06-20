"use client";

import type { CSSProperties } from "react";
import { nameBebas, nameOxanium, nameRajdhani, jp } from "@/lib/fonts";

export type RankingsTitleCyberVariant =
  | "horizon-chrome"
  | "hud-stack"
  | "neon-edge"
  | "jp-chrome"
  | "soft-blend"
  | "scan-pulse";

const CHROME_GRADIENT_HARD =
  "linear-gradient(180deg, #F0FEFF 0%, #9CF6FF 28%, #00F5FF 46%, #00F5FF 48%, #00A8B8 52%, #00CFE0 68%, #7AEEF8 100%)";

const CHROME_GRADIENT_SOFT =
  "linear-gradient(180deg, #CFFAFE 0%, #00F5FF 38%, #06B6D4 68%, #A5F3FC 100%)";

const CYAN_TITLE_GLOW =
  "drop-shadow(0 0 10px rgba(0,245,255,0.55)) drop-shadow(0 0 22px rgba(0,245,255,0.28))";

function chromeTextStyle(hard = true): CSSProperties {
  return {
    backgroundImage: hard ? CHROME_GRADIENT_HARD : CHROME_GRADIENT_SOFT,
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
    WebkitTextFillColor: "transparent",
  };
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
  className?: string;
};

export function RankingsPageTitleCyber({
  variant,
  title,
  kicker = "SECTOR // NBA",
  subtitle = "LEADERBOARD",
  size = "md",
  className = "",
}: Props) {
  const mainSize = size === "sm" ? "text-[22px] sm:text-[26px]" : "text-[26px] sm:text-[32px]";
  const isJa = /[\u3040-\u30ff\u3400-\u9fff]/.test(title);

  if (variant === "hud-stack") {
    return (
      <div className={["flex flex-col items-center leading-none", className].join(" ")}>
        <span
          className={[nameOxanium.className, "mb-1 text-[8px] font-bold uppercase tracking-[0.32em] sm:text-[9px]"].join(
            " "
          )}
          style={{
            color: "#00F5FF",
            textShadow: "0 0 10px rgba(0,245,255,0.65)",
          }}
        >
          {kicker}
        </span>
        <RankingsPageTitleCyber
          variant="horizon-chrome"
          title={title}
          size={size}
        />
        <span
          className={[nameOxanium.className, "mt-1 text-[9px] font-bold uppercase tracking-[0.28em] sm:text-[10px]"].join(
            " "
          )}
          style={{
            color: "#FF2BD6",
            textShadow: "0 0 12px rgba(255,43,214,0.55)",
          }}
        >
          {subtitle}
        </span>
      </div>
    );
  }

  if (variant === "jp-chrome") {
    return (
      <span
        className={[
          isJa ? jp.className : nameBebas.className,
          "inline-block font-black italic",
          mainSize,
          "tracking-[0.12em]",
          className,
        ].join(" ")}
        style={{
          ...chromeTextStyle(true),
          transform: "skewX(-8deg)",
          filter: CYAN_TITLE_GLOW,
        }}
      >
        {title}
      </span>
    );
  }

  if (variant === "soft-blend") {
    return (
      <span
        className={[
          nameRajdhani.className,
          "inline-block font-bold italic",
          mainSize,
          "tracking-[0.22em] uppercase",
          className,
        ].join(" ")}
        style={{
          ...chromeTextStyle(false),
          transform: "skewX(-6deg)",
          filter: "drop-shadow(0 0 14px rgba(0,245,255,0.35))",
        }}
      >
        {title}
      </span>
    );
  }

  if (variant === "neon-edge") {
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
            WebkitTextStroke: "1px rgba(0,245,255,0.9)",
            color: "transparent",
            textShadow:
              "0 0 8px rgba(0,245,255,0.95), 0 0 16px rgba(0,245,255,0.5), 0 0 24px rgba(0,245,255,0.25)",
          }}
        >
          {title}
        </span>
        <span style={chromeTextStyle(true)}>{title}</span>
      </span>
    );
  }

  if (variant === "scan-pulse") {
    return (
      <span
        className={[
          nameBebas.className,
          "inline-block italic",
          mainSize,
          "tracking-[0.24em] uppercase",
          className,
        ].join(" ")}
        style={{
          ...chromeTextStyle(true),
          transform: "skewX(-10deg)",
          filter: CYAN_TITLE_GLOW,
        }}
      >
        {title}
      </span>
    );
  }

  /* horizon-chrome — 参照画像に近いハードスプリット */
  return (
    <span
      className={[
        nameBebas.className,
        "inline-block italic",
        mainSize,
        "tracking-[0.24em] uppercase",
        className,
      ].join(" ")}
      style={{
        ...chromeTextStyle(true),
        transform: "skewX(-10deg)",
        filter: CYAN_TITLE_GLOW,
      }}
    >
      {title}
    </span>
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
