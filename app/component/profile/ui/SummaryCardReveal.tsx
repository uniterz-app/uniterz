"use client";

import { m, useReducedMotion } from "framer-motion";
import { useEffect, useRef, type ReactNode } from "react";

type Props = {
  index: number;
  total: number;
  /** false のときはアニメなし（ローディング中など） */
  enabled: boolean;
  children: ReactNode;
  className?: string;
  /** motion の入場が終わったとき（1回）。アニメ無効時はマウント直後に呼ぶ */
  onAnimationComplete?: () => void;
  /**
   * `fade` … ほぼフェードのみ＋わずかな段差（Pro サマリー用）
   * `blurUp` … フェードアップ＋ブラー解除（Pro Stats タブ用）
   * 未指定 … 従来の下から浮き上がり
   */
  enterVariant?: "default" | "fade" | "blurUp";
};

/** 下から「にじみ出す」ように、透明度・位置・スケールを同じカーブで立ち上げる */
const EMERGE_DURATION = 1.08;
const EMERGE_EASE: [number, number, number, number] = [0.16, 0.82, 0.32, 1];

/**
 * プロフィールサマリーカード用: 下からふわっと浮かび、透過→不透明・スケールが段々大きくなる
 */
const FADE_DURATION = 0.52;
const FADE_FIRST_DELAY = 0.04;
const FADE_STEP = 0.072;

const BLUR_UP_DURATION = 0.78;
const BLUR_UP_FIRST_DELAY = 0.06;
const BLUR_UP_STEP = 0.1;

export default function SummaryCardReveal({
  index,
  total: _total,
  enabled,
  className,
  children,
  onAnimationComplete,
  enterVariant = "default",
}: Props) {
  const reduceMotion = useReducedMotion();
  const completeRef = useRef(onAnimationComplete);
  completeRef.current = onAnimationComplete;
  const firedRef = useRef(false);

  const fireComplete = () => {
    if (firedRef.current) return;
    firedRef.current = true;
    completeRef.current?.();
  };

  useEffect(() => {
    firedRef.current = false;
  }, [enabled, index]);

  useEffect(() => {
    if (!enabled || reduceMotion) {
      fireComplete();
    }
  }, [enabled, reduceMotion]);

  if (!enabled || reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  if (enterVariant === "fade") {
    const delay = FADE_FIRST_DELAY + index * FADE_STEP;
    return (
      <m.div
        className={className}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay,
          duration: FADE_DURATION,
          ease: [0.22, 0.61, 0.36, 1],
        }}
        onAnimationComplete={onAnimationComplete ? fireComplete : undefined}
      >
        {children}
      </m.div>
    );
  }

  if (enterVariant === "blurUp") {
    const delay = BLUR_UP_FIRST_DELAY + index * BLUR_UP_STEP;
    return (
      <m.div
        className={className}
        initial={{ opacity: 0, y: 28, filter: "blur(14px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{
          delay,
          duration: BLUR_UP_DURATION,
          ease: [0.22, 0.61, 0.36, 1],
        }}
        onAnimationComplete={onAnimationComplete ? fireComplete : undefined}
      >
        {children}
      </m.div>
    );
  }

  const firstStart = 0.05;
  const step = 0.11;
  const delay = firstStart + index * step;

  return (
    <m.div
      className={className}
      initial={{ opacity: 0, y: 52, scale: 0.86 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay,
        duration: EMERGE_DURATION,
        ease: EMERGE_EASE,
      }}
      onAnimationComplete={onAnimationComplete ? fireComplete : undefined}
    >
      {children}
    </m.div>
  );
}
