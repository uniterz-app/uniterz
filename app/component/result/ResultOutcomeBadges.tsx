"use client";

import { Flame } from "lucide-react";
import {
  resultHitBadgeClass,
  resultUpsetBadgeClass,
  type ResultCardBadge,
} from "@/lib/result/resultGlass";
import type { WinStreakBadgeStyle } from "@/lib/ui/winStreakBadge";

type Props = {
  badge: ResultCardBadge;
  streakBadge: WinStreakBadgeStyle | null;
  isMobile: boolean;
  /** LIVE マーク等をバッジ横に並べる */
  trailing?: React.ReactNode;
  /** リザルト一覧・詳細向け：HIT バッジをやや小さく */
  hitBadgeSubtle?: boolean;
  className?: string;
};

/** HIT / UPSET / MISS / 連勝バッジの共通表示 */
export default function ResultOutcomeBadges({
  badge,
  streakBadge,
  isMobile,
  trailing = null,
  hitBadgeSubtle = false,
  className = "",
}: Props) {
  const mobileBadgeClass = isMobile
    ? "text-[10px] px-1.5 py-0.5"
    : "text-[11px] px-2 py-0.5";
  const mobileStreakBadgeClass = isMobile
    ? "text-[9px] px-1.5 py-0.5 gap-1"
    : "text-[11px] px-2.5 py-0.5 gap-1.5";
  const mobileStreakIconClass = isMobile ? "h-2.5 w-2.5" : "h-3.5 w-3.5";

  if (!badge && !trailing) return null;

  return (
    <div
      className={[
        "flex flex-row flex-wrap items-start justify-end gap-1",
        className,
      ].join(" ")}
    >
      {badge === "streak" && streakBadge ? (
        <span
          className={`pointer-events-auto inline-flex max-w-full min-w-0 items-center gap-0.5 rounded-md font-extrabold shadow-md ${mobileStreakBadgeClass} ${streakBadge.className}`}
        >
          <Flame
            className={`shrink-0 ${mobileStreakIconClass} ${streakBadge.iconClassName}`}
          />
          <span className="min-w-0 truncate text-[9px] leading-tight sm:text-[11px]">
            {streakBadge.label}
          </span>
        </span>
      ) : null}
      {badge === "hit" ? (
        <span
          className={resultHitBadgeClass(isMobile, {
            subtle: hitBadgeSubtle,
          })}
        >
          HIT
        </span>
      ) : null}
      {badge === "upset" ? (
        <span className={resultUpsetBadgeClass(isMobile)}>UPSET</span>
      ) : null}
      {badge === "miss" ? (
        <span
          className={`pointer-events-auto shrink-0 rounded-md bg-gray-500 font-extrabold text-white shadow-md ${mobileBadgeClass}`}
        >
          MISS
        </span>
      ) : null}
      {trailing}
    </div>
  );
}
