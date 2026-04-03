"use client";

import { motion, useReducedMotion } from "framer-motion";
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
};

/** 下から「にじみ出す」ように、透明度・位置・スケールを同じカーブで立ち上げる */
const EMERGE_DURATION = 1.08;
const EMERGE_EASE: [number, number, number, number] = [0.16, 0.82, 0.32, 1];

/**
 * プロフィールサマリーカード用: 下からふわっと浮かび、透過→不透明・スケールが段々大きくなる
 */
export default function SummaryCardReveal({
  index,
  total: _total,
  enabled,
  className,
  children,
  onAnimationComplete,
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

  const firstStart = 0.05;
  const step = 0.11;
  const delay = firstStart + index * step;

  return (
    <motion.div
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
    </motion.div>
  );
}
