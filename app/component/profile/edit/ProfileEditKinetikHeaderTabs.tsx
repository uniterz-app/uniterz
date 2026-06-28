"use client";

import { useCallback, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import CyberTooltip from "@/app/component/common/CyberTooltip";
import type { KinetikRankBadgeResult } from "./kinetikRankBadge";
import { getKinetikRankBadgeExplanation } from "./kinetikRankBadge";
import {
  resolveKinetikCyberTooltipTheme,
  type KinetikSlantTabThemeKey,
} from "./kinetikSlantTabTheme";
import {
  formatKinetikWinStreakLabel,
  getKinetikStreakTier,
  getKinetikWinStreakExplanation,
} from "./kinetikStreakFx";
import { nameOxanium } from "@/lib/fonts";

type Props = {
  rankBadge: KinetikRankBadgeResult | null;
  winStreak: number;
  language?: "ja" | "en";
  compact?: boolean;
  /** Web 左カラム: タグを縦積み */
  stack?: boolean;
};

function SlantTabScan() {
  return (
    <span
      className="profile-edit-kinetik-slant-tab__scan pointer-events-none"
      aria-hidden
    />
  );
}

function SlantTab({
  children,
  delay = 0,
  className,
  explanation,
  onPress,
}: {
  children: ReactNode;
  delay?: number;
  className: string;
  explanation: string;
  onPress: (e: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  const reduceMotion = useReducedMotion() === true;

  return (
    <motion.div
      className="shrink-0"
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.36,
        delay: reduceMotion ? 0 : delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <button
        type="button"
        className={[
          className,
          "appearance-none cursor-pointer transition hover:brightness-110",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050508]",
        ].join(" ")}
        aria-label={explanation.split("\n")[0]}
        onClick={onPress}
      >
        {children}
      </button>
    </motion.div>
  );
}

export default function ProfileEditKinetikHeaderTabs({
  rankBadge,
  winStreak,
  language = "ja",
  compact = false,
  stack = false,
}: Props) {
  const streakTier = getKinetikStreakTier(winStreak);
  const streakLabel = formatKinetikWinStreakLabel(winStreak, language);
  const rankExplanation = rankBadge
    ? getKinetikRankBadgeExplanation(rankBadge, language)
    : null;
  const streakExplanation = streakLabel
    ? getKinetikWinStreakExplanation(winStreak, language)
    : null;
  const [tooltip, setTooltip] = useState<{
    rect: DOMRect;
    message: string;
    themeKey: KinetikSlantTabThemeKey;
  } | null>(null);

  const openTooltip = useCallback(
    (
      e: React.MouseEvent<HTMLButtonElement>,
      message: string,
      themeKey: KinetikSlantTabThemeKey
    ) => {
      e.stopPropagation();
      const rect = e.currentTarget.getBoundingClientRect();
      setTooltip({ rect, message, themeKey });
    },
    []
  );

  if (!rankBadge && !streakLabel) return null;

  const tabPad = compact ? "px-3 py-1.5" : "px-4 py-[7px]";
  const textSize = compact ? "text-[9px]" : "text-[10px]";

  return (
    <>
      <div
        className={[
          "profile-edit-kinetik-header-tabs flex gap-1.5",
          stack
            ? "w-full flex-col items-stretch"
            : "flex-wrap items-stretch",
        ].join(" ")}
      >
        {rankBadge && rankExplanation ? (
          <SlantTab
            delay={0.06}
            explanation={rankExplanation}
            onPress={(e) => openTooltip(e, rankExplanation, rankBadge.tier)}
            className={[
              "profile-edit-kinetik-slant-tab profile-edit-kinetik-slant-tab--filled",
              `profile-edit-kinetik-slant-tab--rank-${rankBadge.tier}`,
              tabPad,
            ].join(" ")}
          >
            <SlantTabScan />
            <span
              className={[
                nameOxanium.className,
                "profile-edit-kinetik-slant-tab__label uppercase tracking-[0.14em]",
                textSize,
              ].join(" ")}
            >
              {rankBadge.label}
            </span>
          </SlantTab>
        ) : null}

        {streakLabel && streakExplanation ? (
          <SlantTab
            delay={0.16}
            explanation={streakExplanation}
            onPress={(e) =>
              openTooltip(
                e,
                streakExplanation,
                `streak-${streakTier}` as KinetikSlantTabThemeKey
              )
            }
            className={[
              "profile-edit-kinetik-slant-tab profile-edit-kinetik-slant-tab--outline",
              streakTier > 0
                ? `profile-edit-kinetik-slant-tab--streak-${streakTier}`
                : "",
              tabPad,
            ].join(" ")}
          >
            <span
              className={[
                nameOxanium.className,
                "profile-edit-kinetik-slant-tab__label",
                textSize,
                language === "en"
                  ? "uppercase tracking-[0.14em]"
                  : "tracking-[0.08em]",
              ].join(" ")}
            >
              {streakLabel}
            </span>
          </SlantTab>
        ) : null}
      </div>

      {tooltip ? (
        <CyberTooltip
          anchorRect={tooltip.rect}
          message={tooltip.message}
          theme={resolveKinetikCyberTooltipTheme(tooltip.themeKey)}
          onClose={() => setTooltip(null)}
        />
      ) : null}
    </>
  );
}
