"use client";

import { Flame } from "lucide-react";
import {
  resultHitBadgeClass,
  resultMissBadgeClass,
  resultStreakBadgeClass,
  resultStreakBadgeIconClass,
  resultUpsetBadgeClass,
  type ResultCardBadge,
} from "@/lib/result/resultGlass";
import type { WinStreakBadgeStyle } from "@/lib/ui/winStreakBadge";

type Props = {
  badge: ResultCardBadge;
  streakBadge: WinStreakBadgeStyle | null;
  /** 連勝数（streakBadge が無いときのフォールバック用） */
  activeWinStreak?: unknown;
  isMobile: boolean;
  /** LIVE マーク等をバッジ横に並べる */
  trailing?: React.ReactNode;
  /** リザルト一覧・詳細向け：バッジをやや小さく */
  hitBadgeSubtle?: boolean;
  className?: string;
};

/** HIT / UPSET / MISS / 連勝バッジの共通表示 */
export default function ResultOutcomeBadges({
  badge,
  streakBadge,
  activeWinStreak = 0,
  isMobile,
  trailing = null,
  hitBadgeSubtle = false,
  className = "",
}: Props) {
  const streakClass =
    badge === "streak"
      ? (streakBadge?.className ??
        resultStreakBadgeClass(activeWinStreak, isMobile, {
          subtle: hitBadgeSubtle,
        }))
      : null;
  const streakLabel = streakBadge?.label;
  const streakIconClass =
    streakBadge?.iconClassName ??
    `shrink-0 ${resultStreakBadgeIconClass(activeWinStreak)}`;
  const mobileStreakIconClass = isMobile ? "h-2.5 w-2.5" : "h-3.5 w-3.5";

  if (!badge && !trailing) return null;

  return (
    <div
      className={[
        "flex flex-row flex-wrap items-start justify-end gap-1",
        className,
      ].join(" ")}
    >
      {badge === "streak" && streakClass && streakLabel ? (
        <span className={streakClass}>
          <Flame
            className={`${mobileStreakIconClass} ${streakIconClass}`}
            aria-hidden
          />
          <span className="min-w-0 truncate leading-tight">{streakLabel}</span>
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
          className={resultMissBadgeClass(isMobile, {
            subtle: hitBadgeSubtle,
          })}
        >
          MISS
        </span>
      ) : null}
      {trailing}
    </div>
  );
}
