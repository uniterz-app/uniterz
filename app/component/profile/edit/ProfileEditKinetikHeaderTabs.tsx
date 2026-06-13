"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { KinetikRankBadgeResult } from "./kinetikRankBadge";
import {
  formatKinetikWinStreakLabel,
  getKinetikStreakTier,
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
  title,
}: {
  children: ReactNode;
  delay?: number;
  className: string;
  title?: string;
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
      <div className={className} title={title}>
        {children}
      </div>
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

  if (!rankBadge && !streakLabel) return null;

  const tabPad = compact ? "px-3 py-1.5" : "px-4 py-[7px]";
  const textSize = compact ? "text-[9px]" : "text-[10px]";

  return (
    <div
      className={[
        "profile-edit-kinetik-header-tabs flex gap-1.5",
        stack
          ? "w-full flex-col items-stretch"
          : "flex-wrap items-stretch",
      ].join(" ")}
    >
      {rankBadge ? (
        <SlantTab
          delay={0.06}
          title={rankBadge.description}
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

      {streakLabel ? (
        <SlantTab
          delay={0.16}
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
              language === "en" ? "uppercase tracking-[0.14em]" : "tracking-[0.08em]",
            ].join(" ")}
          >
            {streakLabel}
          </span>
        </SlantTab>
      ) : null}
    </div>
  );
}
