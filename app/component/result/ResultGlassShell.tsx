"use client";

import React from "react";
import {
  RESULT_GLASS_BORDER,
  RESULT_GLASS_FILL,
  RESULT_GLASS_FILL_MOBILE,
  RESULT_GLASS_LIFT,
  RESULT_GLASS_SHADOW,
  RESULT_GLASS_SHADOW_HOVER,
  resultBadgeAccent,
  RESULT_HIT_CYBER_CLIP,
  resultStreakShellAccent,
  isResultWinFrameBadge,
  isResultHitFrameBadge,
  isResultPerfectFrameBadge,
  type ResultCardBadge,
} from "@/lib/result/resultGlass";
import ResultHitCyberFrame from "@/app/component/result/ResultHitCyberFrame";
import ResultPerfectCyberFrame from "@/app/component/result/ResultPerfectCyberFrame";

type Props = {
  children: React.ReactNode;
  /** 外側ラッパー class（幅・カーソル等） */
  className?: string;
  /** ガラス面に追加する class（text-white や overflow 解除等） */
  extraPanelClassName?: string;
  badge?: ResultCardBadge;
  activeWinStreak?: number;
  /** 一覧ではオフ推奨（枠スイープの無限アニメは GPU 負荷が高い） */
  showSweep?: boolean;
  /** モバイル dense：薄めのガラス */
  dense?: boolean;
  /** Web ホバーリフト */
  lift?: boolean;
  roundedClassName?: string;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
};

/**
 * リザルト用ガラスシェル。
 * 状態（UPSET・連勝）は色付き枠＋枠を走る光だけで表現する。
 */
export default function ResultGlassShell({
  children,
  className = "",
  extraPanelClassName = "",
  badge = null,
  activeWinStreak = 0,
  showSweep = true,
  dense = false,
  lift = true,
  roundedClassName = "rounded-2xl",
  onClick,
}: Props) {
  const accent = resultBadgeAccent(badge, activeWinStreak);
  const streakShell =
    badge === "streak" ? resultStreakShellAccent(activeWinStreak) : null;
  const shellClip = isResultWinFrameBadge(badge)
    ? RESULT_HIT_CYBER_CLIP
    : roundedClassName;

  const panelClass = [
    "relative overflow-hidden",
    shellClip,
    isResultWinFrameBadge(badge)
      ? RESULT_GLASS_BORDER
      : (accent.frameBorder ?? RESULT_GLASS_BORDER),
    dense ? RESULT_GLASS_FILL_MOBILE : RESULT_GLASS_FILL,
    accent.shadow || RESULT_GLASS_SHADOW,
    lift ? `${RESULT_GLASS_LIFT} ${RESULT_GLASS_SHADOW_HOVER}` : "",
    extraPanelClassName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={className} onClick={onClick}>
      <div className={panelClass}>
        {isResultHitFrameBadge(badge) ? (
          <ResultHitCyberFrame showSweep={showSweep} />
        ) : null}
        {isResultPerfectFrameBadge(badge) ? <ResultPerfectCyberFrame /> : null}

        {/* UPSET：赤枠を走る光 */}
        {badge === "upset" && showSweep ? (
          <div
            className={[
              "pointer-events-none absolute inset-0 z-[2] overflow-hidden",
              roundedClassName,
              "result-card-border-sweep result-card-upset-sweep",
            ].join(" ")}
            aria-hidden
          >
            <div className="result-card-border-sweep__spin result-card-upset-sweep__spin" />
          </div>
        ) : null}

        {/* 連勝：ティア色の枠を走る光 */}
        {badge === "streak" && streakShell && showSweep ? (
          <div
            className={[
              "pointer-events-none absolute inset-0 z-[2] overflow-hidden",
              roundedClassName,
              "result-card-border-sweep result-card-streak-sweep",
              streakShell.sweepClass,
            ].join(" ")}
            aria-hidden
          >
            <div className="result-card-border-sweep__spin result-card-streak-sweep__spin" />
          </div>
        ) : null}

        {children}
      </div>
    </div>
  );
}
