"use client";

import { Flame } from "lucide-react";
import type { ResultOutcomeOnlyBadge } from "@/lib/result/resultBadge";
import {
  resultHitBadgeClass,
  resultMissBadgeClass,
  resultPerfectBadgeClass,
  resultStreakBadgeClass,
  resultStreakBadgeIconClass,
  resultUpsetBadgeClass,
  type ResultCardBadge,
} from "@/lib/result/resultGlass";
import type { WinStreakBadgeStyle } from "@/lib/ui/winStreakBadge";

type Props = {
  badge: ResultCardBadge;
  outcomeBadge?: ResultOutcomeOnlyBadge | null;
  showStreakBadge?: boolean;
  stackBadges?: boolean;
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

function resolveBadgeLayout(props: Props) {
  const { badge, outcomeBadge, showStreakBadge, stackBadges } = props;

  if (stackBadges !== undefined) {
    return {
      stackBadges,
      showStreakBadge: showStreakBadge ?? false,
      outcomeBadge: outcomeBadge ?? null,
    };
  }

  if (badge === "streak") {
    return {
      stackBadges: false,
      showStreakBadge: true,
      outcomeBadge: null,
    };
  }

  return {
    stackBadges: false,
    showStreakBadge: false,
    outcomeBadge: (badge as ResultOutcomeOnlyBadge) ?? null,
  };
}

function OutcomeBadgeChip({
  outcome,
  isMobile,
  hitBadgeSubtle,
}: {
  outcome: ResultOutcomeOnlyBadge;
  isMobile: boolean;
  hitBadgeSubtle: boolean;
}) {
  if (outcome === "hit") {
    return (
      <span className={resultHitBadgeClass(isMobile, { subtle: hitBadgeSubtle })}>
        HIT
      </span>
    );
  }
  if (outcome === "perfect") {
    return (
      <span
        className={resultPerfectBadgeClass(isMobile, { subtle: hitBadgeSubtle })}
      >
        PERFECT
      </span>
    );
  }
  if (outcome === "upset") {
    return (
      <span className={resultUpsetBadgeClass(isMobile, { subtle: hitBadgeSubtle })}>
        UPSET
      </span>
    );
  }
  return (
    <span className={resultMissBadgeClass(isMobile, { subtle: hitBadgeSubtle })}>
      MISS
    </span>
  );
}

/** HIT / PERFECT / UPSET / MISS / 連勝バッジの共通表示 */
export default function ResultOutcomeBadges({
  badge,
  outcomeBadge,
  showStreakBadge,
  stackBadges,
  streakBadge,
  activeWinStreak = 0,
  isMobile,
  trailing = null,
  hitBadgeSubtle = false,
  className = "",
}: Props) {
  const layout = resolveBadgeLayout({
    badge,
    outcomeBadge,
    showStreakBadge,
    stackBadges,
    streakBadge,
    activeWinStreak,
    isMobile,
    trailing,
    hitBadgeSubtle,
    className,
  });

  const streakClass =
    layout.showStreakBadge
      ? (streakBadge?.className ??
        resultStreakBadgeClass(activeWinStreak, isMobile, {
          subtle: hitBadgeSubtle,
        }))
      : null;
  const streakLabel = streakBadge?.label;
  const streakIconClass =
    streakBadge?.iconClassName ??
    `shrink-0 ${resultStreakBadgeIconClass(activeWinStreak)}`;
  const mobileStreakIconClass = isMobile ? "h-2 w-2" : "h-3.5 w-3.5";

  const displayOutcome = layout.stackBadges
    ? layout.outcomeBadge
    : layout.showStreakBadge &&
        layout.outcomeBadge !== "perfect" &&
        layout.outcomeBadge !== "upset"
      ? null
      : layout.outcomeBadge;

  const displayStreak =
    layout.showStreakBadge &&
    (layout.stackBadges ||
      (layout.outcomeBadge !== "perfect" && layout.outcomeBadge !== "upset"));

  if (!displayStreak && !displayOutcome && !trailing) {
    return null;
  }

  const streakNode =
    displayStreak && streakClass && streakLabel ? (
      <span className={streakClass}>
        <Flame
          className={`${mobileStreakIconClass} ${streakIconClass}`}
          aria-hidden
        />
        <span className="min-w-0 truncate leading-tight">{streakLabel}</span>
      </span>
    ) : null;

  const outcomeNode = displayOutcome ? (
    <OutcomeBadgeChip
      outcome={displayOutcome}
      isMobile={isMobile}
      hitBadgeSubtle={hitBadgeSubtle}
    />
  ) : null;

  if (layout.stackBadges) {
    return (
      <div
        className={[
          "flex flex-row flex-wrap items-center justify-end gap-1",
          className,
        ].join(" ")}
      >
        {outcomeNode}
        {streakNode}
        {trailing}
      </div>
    );
  }

  return (
    <div
      className={[
        "flex flex-row flex-wrap items-start justify-end gap-1",
        className,
      ].join(" ")}
    >
      {streakNode}
      {outcomeNode}
      {trailing}
    </div>
  );
}
