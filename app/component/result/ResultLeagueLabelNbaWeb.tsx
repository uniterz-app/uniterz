// app/component/result/ResultLeagueLabelNbaWeb.tsx
"use client";

import React, { memo } from "react";
import { resultLeagueNbaLabelFontClass } from "@/lib/fonts";

/** ネイティブ `ResultLeagueLabelSkia` と同趣旨：青丸ピル無し・二重テキストで周囲だけ光らせる */
type Props = {
  text?: string;
  className?: string;
};

function ResultLeagueLabelNbaWebImpl({
  text = "NBA",
  className = "",
}: Props) {
  const typo = [
    resultLeagueNbaLabelFontClass,
    "text-[12px] font-extrabold uppercase leading-none tracking-[1.8px] text-white",
  ].join(" ");

  return (
    <span
      className={["relative inline-flex shrink-0 align-top", className].filter(Boolean).join(" ")}
      aria-label={text}
    >
      <span
        className={[
          typo,
          "pointer-events-none absolute left-0 top-0 opacity-[0.35]",
          "[text-shadow:0_0_3px_rgba(255,255,255,0.55)]",
        ].join(" ")}
        aria-hidden
      >
        {text}
      </span>
      <span
        className={[
          typo,
          "relative z-[1]",
          "[text-shadow:0_0_0.5px_rgba(255,255,255,0.15)]",
        ].join(" ")}
        aria-hidden
      >
        {text}
      </span>
    </span>
  );
}

export const ResultLeagueLabelNbaWeb = memo(ResultLeagueLabelNbaWebImpl);
ResultLeagueLabelNbaWeb.displayName = "ResultLeagueLabelNbaWeb";
