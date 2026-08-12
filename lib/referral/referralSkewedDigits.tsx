"use client";

import type { ReactNode } from "react";

/** ランキング My Rank と同じ傾き */
export const REFERRAL_DIGIT_SKEW = "skewX(-12deg)" as const;

/** 文字列内の数字だけ傾ける */
export function renderReferralSkewedDigits(text: string): ReactNode {
  return text.split("").map((ch, i) =>
    /\d/.test(ch) ? (
      <span
        key={`${i}-${ch}`}
        className="inline-block tabular-nums"
        style={{ transform: REFERRAL_DIGIT_SKEW }}
      >
        {ch}
      </span>
    ) : (
      <span key={`${i}-${ch}`}>{ch}</span>
    )
  );
}

/** ブロック全体を傾ける（招待コード等） */
export function referralSkewBlockClassName(extra?: string): string {
  return ["inline-block tabular-nums", extra].filter(Boolean).join(" ");
}

export const referralSkewBlockStyle = {
  transform: REFERRAL_DIGIT_SKEW,
} as const;
