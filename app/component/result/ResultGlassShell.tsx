"use client";

import React from "react";
import {
  RESULT_GLASS_BORDER,
  RESULT_GLASS_FILL,
  RESULT_GLASS_FILL_LITE,
  RESULT_GLASS_FILL_MOBILE,
  RESULT_GLASS_LIFT,
  RESULT_GLASS_SHADOW,
  RESULT_GLASS_SHADOW_HOVER,
  RESULT_GLASS_SHADOW_LITE,
  resultBadgeAccent,
  RESULT_HIT_CYBER_CLIP,
  isResultCyberClipFrameBadge,
  isResultHitFrameBadge,
  isResultPerfectFrameBadge,
  isResultStreakFrameBadge,
  isResultUpsetFrameBadge,
  type ResultCardBadge,
} from "@/lib/result/resultGlass";
import ResultHitCyberFrame from "@/app/component/result/ResultHitCyberFrame";
import ResultPerfectCyberFrame from "@/app/component/result/ResultPerfectCyberFrame";
import ResultStreakCyberFrame from "@/app/component/result/ResultStreakCyberFrame";
import ResultUpsetCyberFrame from "@/app/component/result/ResultUpsetCyberFrame";

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
  /** 他人プロフィール向け：blur・重い影・ホバーリフトを抑える */
  lite?: boolean;
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
  lite = false,
  roundedClassName = RESULT_HIT_CYBER_CLIP,
  onClick,
}: Props) {
  const accent = resultBadgeAccent(badge, activeWinStreak);

  const glassFill = lite
    ? RESULT_GLASS_FILL_LITE
    : dense
      ? RESULT_GLASS_FILL_MOBILE
      : RESULT_GLASS_FILL;
  const glassShadow = lite
    ? RESULT_GLASS_SHADOW_LITE
    : accent.shadow || RESULT_GLASS_SHADOW;
  const glassLift = lite ? false : lift;
  const frameSweep = !lite && showSweep;

  const panelClass = [
    "relative overflow-hidden",
    roundedClassName,
    isResultCyberClipFrameBadge(badge)
      ? RESULT_GLASS_BORDER
      : (accent.frameBorder ?? RESULT_GLASS_BORDER),
    glassFill,
    glassShadow,
    glassLift ? `${RESULT_GLASS_LIFT} ${RESULT_GLASS_SHADOW_HOVER}` : "",
    extraPanelClassName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={className} onClick={onClick}>
      <div className={panelClass}>
        {isResultHitFrameBadge(badge) ? (
          <ResultHitCyberFrame showSweep={frameSweep} />
        ) : null}
        {isResultPerfectFrameBadge(badge) ? (
          <ResultPerfectCyberFrame showSweep={frameSweep} />
        ) : null}
        {isResultStreakFrameBadge(badge) ? (
          <ResultStreakCyberFrame
            activeWinStreak={activeWinStreak}
            showSweep={frameSweep}
          />
        ) : null}
        {isResultUpsetFrameBadge(badge) ? (
          <ResultUpsetCyberFrame showSweep={frameSweep} />
        ) : null}

        {children}
      </div>
    </div>
  );
}
