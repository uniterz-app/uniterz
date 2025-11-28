"use client";

import React from "react";
import type { WalkthroughStep } from "./stepDefinitions";

type WalkthroughOverlayProps = {
  targetRect: DOMRect | null;
  step: WalkthroughStep;
  onClose: () => void;
};

export default function WalkthroughOverlay({
  targetRect,
  step,
  onClose,
}: WalkthroughOverlayProps) {

  if (
    !targetRect ||
    !targetRect.width ||
    !targetRect.height ||
    Number.isNaN(targetRect.top)
  ) {
    return null;
  }

  const isOdds = step.key === "mainOdds";

  // 横長に
  const boxWidth = isOdds ? 320 : 260;

  // ★ スクリーン幅
  const screenW = typeof window !== "undefined" ? window.innerWidth : 390;

  // ★ 左位置を「画面に収まるように」clamp
  let left = isOdds ? targetRect.left - 80 : targetRect.left;

  // 左端12pxより左にいかない
  left = Math.max(left, 12);

  // 右端12pxより右にいかない
  left = Math.min(left, screenW - boxWidth - 12);

  return (
    <>
      {/* 背景 */}
      <div
        className="fixed inset-0 bg-black/60 z-[9990]"
        onClick={(e) => e.stopPropagation()}
      />

      {/* ハイライト枠 */}
      <div
        className="fixed z-[9991] border-[3px] border-white rounded-xl pointer-events-none transition-all"
        style={{
          top: targetRect.top - 6,
          left: targetRect.left - 6,
          width: targetRect.width + 12,
          height: targetRect.height + 12,
        }}
      />

      {/* 吹き出し */}
      <div
        className="fixed z-[9992] bg-white text-black rounded-xl shadow-lg p-3 text-[13px]"
        style={{
          top: targetRect.bottom + 10,
          left,
          width: boxWidth,
        }}
      >
        <div className="text-[15px] font-bold mb-1">{step.title}</div>

        {step.body && (
  <div
    className="mb-3 leading-relaxed"
    dangerouslySetInnerHTML={{ __html: step.body }}
  />
)}


        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold"
          >
            OK
          </button>
        </div>
      </div>
    </>
  );
}
